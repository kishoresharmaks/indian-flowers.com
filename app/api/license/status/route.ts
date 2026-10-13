import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import LicenseSetting from '@/models/LicenseSetting';
import { getLicensingServerUrl, computeClientLicenseState } from '@/lib/licensing/licenseClient';

export const dynamic = 'force-dynamic';

const DEFAULT_FALLBACK_PLANS = [
  {
    planId: 'plan_monthly',
    name: 'Pro POS & Invoicing (Monthly)',
    description: 'Full access to POS Counter, Billing & GST Invoicing.',
    billingCycle: 'MONTHLY',
    price: 999,
    discountPrice: 1499,
    features: { posEnabled: true, invoicingEnabled: true },
    isPopular: false,
    isActive: true,
  },
  {
    planId: 'plan_quarterly',
    name: 'Pro POS & Invoicing (Quarterly)',
    description: '3 Months access with 10% discount on regular subscription.',
    billingCycle: 'QUARTERLY',
    price: 2699,
    discountPrice: 2997,
    features: { posEnabled: true, invoicingEnabled: true },
    isPopular: false,
    isActive: true,
  },
  {
    planId: 'plan_yearly',
    name: 'Pro POS & Invoicing (Yearly)',
    description: '12 Months access with 2 months free + priority WhatsApp support.',
    billingCycle: 'YEARLY',
    price: 8999,
    discountPrice: 11988,
    features: { posEnabled: true, invoicingEnabled: true },
    isPopular: true,
    isActive: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const savedSetting = await LicenseSetting.findOne({ key: 'current_license' });

    const licensingServerUrl = getLicensingServerUrl();
    const host = request.headers.get('host') || 'localhost';

    const supportEmail =
      process.env.LICENSE_SUPPORT_EMAIL ||
      process.env.NEXT_PUBLIC_LICENSE_SUPPORT_EMAIL ||
      'krishkishoreks@gmail.com';
    const supportPhone =
      process.env.LICENSE_SUPPORT_PHONE ||
      process.env.NEXT_PUBLIC_LICENSE_SUPPORT_PHONE ||
      '+917695946750';

    let plans = [...DEFAULT_FALLBACK_PLANS];
    let razorpayKeyId = '';
    let manualPaymentConfig: any = {
      upiId: 'nexusproducts@upi',
      upiName: 'NEXUS PRODUCTS',
      supportPhone,
      supportEmail,
    };

    // Try fetching live plans & Razorpay key from licensing authority server
    try {
      const plansRes = await fetch(`${licensingServerUrl}/api/license/plans`, { cache: 'no-store' });
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.success && plansData.plans && plansData.plans.length > 0) {
          plans = plansData.plans;
          razorpayKeyId = plansData.razorpayKeyId || '';
          if (plansData.manualPaymentConfig) {
            manualPaymentConfig = plansData.manualPaymentConfig;
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch live plans from licensing server, using fallbacks');
    }

    // 1. Check if store is unlicensed
    if (!savedSetting || !savedSetting.licenseKey) {
      const unlicensedState = computeClientLicenseState({});
      return NextResponse.json({
        success: true,
        isActivated: false,
        license: {
          ...unlicensedState,
          supportEmail,
          supportPhone,
        },
        plans,
        razorpayKeyId,
        manualPaymentConfig,
        licensingServerUrl,
      });
    }

    let liveStatus = savedSetting.status;
    let liveValidUntil = savedSetting.validUntil;
    let liveBusinessName = savedSetting.businessName;
    let livePlanName = savedSetting.planName || 'Pro Subscription';
    let liveBillingCycle = savedSetting.billingCycle || 'MONTHLY';
    let liveFeatures = savedSetting.features || { posEnabled: true, invoicingEnabled: true };
    let serverMessage = '';

    let isServerOnline = true;

    // 2. Real-time Ping / Heartbeat to Licensing Server
    try {
      const pingRes = await fetch(`${licensingServerUrl}/api/license/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: savedSetting.licenseKey,
          domain: host,
        }),
        cache: 'no-store',
      });

      if (pingRes.ok) {
        const pingData = await pingRes.json();
        if (pingData.success) {
          liveStatus = pingData.status;
          serverMessage = pingData.message || '';
          if (pingData.license?.validUntil) {
            liveValidUntil = new Date(pingData.license.validUntil);
          }
          if (pingData.license?.businessName) {
            liveBusinessName = pingData.license.businessName;
          }
          if (pingData.license?.planName) {
            livePlanName = pingData.license.planName;
          }
          if (pingData.license?.billingCycle) {
            liveBillingCycle = pingData.license.billingCycle;
          }
          if (pingData.license?.features) {
            liveFeatures = pingData.license.features;
          }

          // Update local DB with real-time status & plan details from licensing authority
          savedSetting.status = liveStatus;
          savedSetting.validUntil = liveValidUntil;
          savedSetting.planName = livePlanName;
          savedSetting.billingCycle = liveBillingCycle;
          savedSetting.features = liveFeatures;
          savedSetting.lastPingAt = new Date();
          if (pingData.token) savedSetting.signedToken = pingData.token;
          await savedSetting.save();
        }
      } else {
        const pingData = await pingRes.json().catch(() => null);
        liveStatus = 'INVALID';
        serverMessage = pingData?.message || 'License key not found or invalid on licensing server.';
        savedSetting.status = 'INVALID';
        savedSetting.lastPingAt = new Date();
        await savedSetting.save();
      }
    } catch (pingErr) {
      console.warn(`[License Client] Could not ping licensing authority at ${licensingServerUrl}:`, pingErr);
      isServerOnline = false;
      liveStatus = 'INVALID';
      serverMessage = 'Unable to connect to the NEXUS Licensing Service. Please verify your connection or contact support.';
      savedSetting.status = 'INVALID';
      await savedSetting.save().catch(() => null);
    }

    const clientState = computeClientLicenseState({
      licenseKey: savedSetting.licenseKey,
      businessName: liveBusinessName,
      domain: savedSetting.domain,
      planName: livePlanName,
      billingCycle: liveBillingCycle,
      features: liveFeatures,
      status: liveStatus,
      validUntil: liveValidUntil,
      issuedAt: savedSetting.issuedAt,
      lastPingAt: savedSetting.lastPingAt,
      token: savedSetting.signedToken,
      message: serverMessage,
      serverOnline: isServerOnline,
    });

    // Check if requester is logged in as admin
    const adminToken =
      request.cookies.get('__Host-admin_token')?.value ||
      request.cookies.get('admin_token')?.value;
    const isAdmin = Boolean(adminToken && adminToken.trim().length > 0);

    // Non-admin callers receive only safe operational status (prevents public leakage of licenseKey, token, licensingServerUrl)
    if (!isAdmin && clientState.isValid && !clientState.isLocked) {
      return NextResponse.json({
        success: true,
        isActivated: clientState.isActivated,
        license: {
          isValid: clientState.isValid,
          status: clientState.status,
          isLocked: clientState.isLocked,
          features: clientState.features,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isActivated: true,
      license: {
        ...clientState,
        supportEmail,
        supportPhone,
      },
      plans,
      razorpayKeyId,
      manualPaymentConfig,
      licensingServerUrl,
    });
  } catch (error: any) {
    console.error('License Status Check Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check license status' },
      { status: 500 }
    );
  }
}
