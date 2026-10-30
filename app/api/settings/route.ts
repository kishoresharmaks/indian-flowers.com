import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Settings, { DEFAULT_DELIVERY_MODES, DEFAULT_PICKUP_HUBS } from '@/models/Settings';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { STORE_CURRENCY, STORE_LOCALE } from '@/lib/currency';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne({ key: 'global' }).lean();
    if (!settings) {
      const created = await Settings.create({
        key: 'global',
        enableRazorpay: true,
        enableCOD: true,
        currency: STORE_CURRENCY,
        locale: STORE_LOCALE,
      });
      settings = created.toObject();
    } else if (settings.currency !== STORE_CURRENCY || settings.locale !== STORE_LOCALE) {
      await Settings.updateOne(
        { key: 'global' },
        { $set: { currency: STORE_CURRENCY, locale: STORE_LOCALE } }
      );
      settings = await Settings.findOne({ key: 'global' }).lean();
    }
    if (!settings.deliveryModes || settings.deliveryModes.length === 0) {
      await Settings.updateOne({ key: 'global' }, { $set: { deliveryModes: DEFAULT_DELIVERY_MODES } });
      settings.deliveryModes = DEFAULT_DELIVERY_MODES;
    }
    if (!settings.pickupHubs || settings.pickupHubs.length === 0) {
      await Settings.updateOne({ key: 'global' }, { $set: { pickupHubs: DEFAULT_PICKUP_HUBS } });
      settings.pickupHubs = DEFAULT_PICKUP_HUBS;
    }
    return NextResponse.json(
      {
        success: true,
        data: isAuthenticatedAdmin(request)
          ? settings
          : {
              ...settings,
              razorpayKeySecret: undefined,
              fedexSecretKey: undefined,
              fedexAuthKey: undefined,
              bankAccountNo: undefined,
              bankRoutingNo: undefined,
              bankHolder: undefined,
              bankName: undefined,
              companyTaxId: undefined,
              stateTaxPermitId: undefined,
            },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const body = await request.json();
    const { enableRazorpay, enableCOD, razorpayKeyId, razorpayKeySecret } = body;

    const updateFields: any = {};
    if (typeof enableRazorpay === 'boolean') updateFields.enableRazorpay = enableRazorpay;
    if (typeof enableCOD === 'boolean') updateFields.enableCOD = enableCOD;
    if (typeof razorpayKeyId === 'string') updateFields.razorpayKeyId = razorpayKeyId.trim();
    if (typeof razorpayKeySecret === 'string') updateFields.razorpayKeySecret = razorpayKeySecret.trim();

    // FedEx Web Integration Solutions (WIS) Configuration
    if (typeof body.fedexEnabled === 'boolean') updateFields.fedexEnabled = body.fedexEnabled;
    if (typeof body.fedexAccountNumber === 'string') updateFields.fedexAccountNumber = body.fedexAccountNumber.trim();
    if (typeof body.fedexProductionMeterNumber === 'string') updateFields.fedexProductionMeterNumber = body.fedexProductionMeterNumber.trim();
    if (typeof body.fedexTestMeterNumber === 'string') updateFields.fedexTestMeterNumber = body.fedexTestMeterNumber.trim();
    if (typeof body.fedexAuthKey === 'string') updateFields.fedexAuthKey = body.fedexAuthKey.trim();
    if (typeof body.fedexSecretKey === 'string') updateFields.fedexSecretKey = body.fedexSecretKey.trim();
    if (body.fedexEnvironment === 'production' || body.fedexEnvironment === 'test') {
      updateFields.fedexEnvironment = body.fedexEnvironment;
    }
    if (typeof body.fedexOriginZip === 'string') updateFields.fedexOriginZip = body.fedexOriginZip.trim();
    if (typeof body.fedexCompanyName === 'string') updateFields.fedexCompanyName = body.fedexCompanyName.trim();
    if (typeof body.fedexContactName === 'string') updateFields.fedexContactName = body.fedexContactName.trim();
    if (typeof body.fedexEmail === 'string') updateFields.fedexEmail = body.fedexEmail.trim();

    // Delivery Modes Configuration
    if (Array.isArray(body.deliveryModes)) {
      updateFields.deliveryModes = body.deliveryModes.map((dm: any, idx: number) => ({
        id: String(dm.id || `dm-${Date.now()}-${idx}`),
        name: String(dm.name || 'Delivery Method').trim().slice(0, 100),
        type: dm.type === 'pickup' ? 'pickup' : 'shipping',
        price: Math.max(0, Number(dm.price) || 0),
        description: String(dm.description || '').trim().slice(0, 300),
        pickupLocation: String(dm.pickupLocation || '').trim().slice(0, 200),
        estimatedDays: String(dm.estimatedDays || '').trim().slice(0, 100),
        active: dm.active !== false,
        order: Number(dm.order ?? idx),
      }));
    }

    // Pickup Hubs & Footer Locations Configuration
    if (Array.isArray(body.pickupHubs)) {
      updateFields.pickupHubs = body.pickupHubs.map((hub: any, idx: number) => ({
        id: String(hub.id || `hub-${Date.now()}-${idx}`),
        title: String(hub.title || 'Location Hub').trim().slice(0, 100),
        address: String(hub.address || '').trim().slice(0, 250),
        hours: String(hub.hours || '').trim().slice(0, 100),
        active: hub.active !== false,
        order: Number(hub.order ?? idx),
      }));
    }

    // Loyalty System Configurations
    if (typeof body.loyaltyEnabled === 'boolean') updateFields.loyaltyEnabled = body.loyaltyEnabled;
    if (typeof body.loyaltyRedemptionEnabled === 'boolean') updateFields.loyaltyRedemptionEnabled = body.loyaltyRedemptionEnabled;
    if (body.loyaltySpendAmount !== undefined) {
      updateFields.loyaltySpendAmount = Math.max(1, Number(body.loyaltySpendAmount) || 100);
    }
    if (body.loyaltyPointsEarned !== undefined) {
      updateFields.loyaltyPointsEarned = Math.max(1, Number(body.loyaltyPointsEarned) || 10);
    }
    if (body.loyaltyPointsPerDollar !== undefined) {
      updateFields.loyaltyPointsPerDollar = Math.max(0.1, Number(body.loyaltyPointsPerDollar) || 10);
    }
    if (body.loyaltyMinPointsToRedeem !== undefined) {
      updateFields.loyaltyMinPointsToRedeem = Math.max(0, Number(body.loyaltyMinPointsToRedeem) || 0);
    }
    if (body.loyaltyMaxRedemptionPercent !== undefined) {
      updateFields.loyaltyMaxRedemptionPercent = Math.min(100, Math.max(1, Number(body.loyaltyMaxRedemptionPercent) || 100));
    }

    const companyStringFields = [
      'siteName', 'tagline', 'businessName', 'domain', 'contactEmail', 'contactPhone',
      'companyAddress', 'companyCity', 'companyState', 'companyZip', 'companyCountry',
      'companyTaxId', 'stateTaxPermitId', 'bankName', 'bankAccountNo', 'bankRoutingNo', 'bankHolder',
      'logoDataUrl', 'timezone'
    ];
    for (const field of companyStringFields) {
      if (typeof body[field] === 'string') {
        updateFields[field] = body[field].trim().slice(0, field === 'logoDataUrl' ? 1000000 : field === 'tagline' ? 180 : 254);
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
