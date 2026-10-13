import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import LicenseSetting from '@/models/LicenseSetting';
import { getConfiguredLicenseKey, getLicensingServerUrl } from '@/lib/licensing/licenseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let {
      planId,
      utrNumber,
      payerName,
      payerUpiOrAccount,
      manualNotes,
      licenseKey,
    } = body;

    // If licenseKey was not explicitly passed in body, lookup from saved DB setting
    if (!licenseKey) {
      await connectToDatabase();
      const savedSetting = await LicenseSetting.findOne({ key: 'current_license' });
      licenseKey = savedSetting?.licenseKey || getConfiguredLicenseKey();
    }

    if (!licenseKey) {
      return NextResponse.json(
        { success: false, message: 'License key could not be determined for this store.' },
        { status: 400 }
      );
    }

    const licensingServerUrl = getLicensingServerUrl() || 'http://localhost:4000';

    const res = await fetch(`${licensingServerUrl}/api/license/renew/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        utrNumber,
        payerName,
        payerUpiOrAccount,
        manualNotes,
        licenseKey,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit manual payment to Licensing Server' },
      { status: 500 }
    );
  }
}
