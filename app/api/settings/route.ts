import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Settings from '@/models/Settings';
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
    return NextResponse.json(
      {
        success: true,
        data: isAuthenticatedAdmin(request)
          ? settings
          : { ...settings, razorpayKeySecret: undefined },
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
