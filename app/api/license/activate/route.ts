import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import LicenseSetting from '@/models/LicenseSetting';
import Installation from '@/models/Installation';
import { getLicensingServerUrl, computeClientLicenseState } from '@/lib/licensing/licenseClient';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const installation = await Installation.findOne({ key: 'primary' }).lean();
    if (!installation || !['DATABASE_VERIFIED', 'LICENSE_ACTIVATED'].includes(installation.state)) {
      return NextResponse.json({ success: false, message: 'Verify the MongoDB connection before activating a license.' }, { status: 409 });
    }
    const body = await request.json();
    const { licenseKey } = body;

    if (!licenseKey || !licenseKey.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid License Key.' },
        { status: 400 }
      );
    }

    const cleanKey = String(licenseKey).trim().toUpperCase();
    const host = request.headers.get('host') || 'localhost';
    const licensingServerUrl = getLicensingServerUrl();

    // Ping standalone Licensing Server to activate
    let serverRes: Response;
    try {
      serverRes = await fetch(`${licensingServerUrl}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: cleanKey,
          domain: host,
        }),
        cache: 'no-store',
      });
    } catch (netErr: any) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot connect to Licensing Authority Server at ${licensingServerUrl}. Make sure the licensing server is online.`,
        },
        { status: 503 }
      );
    }

    const serverData = await serverRes.json();

    if (!serverRes.ok || !serverData.success) {
      return NextResponse.json(
        { success: false, message: serverData.message || 'License activation rejected by server.' },
        { status: serverRes.status || 400 }
      );
    }

    const lic = serverData.license;

    // Save activated license into e-commerce store database
    const updatedSetting = await LicenseSetting.findOneAndUpdate(
      { key: 'current_license' },
      {
        licenseKey: lic.licenseKey,
        businessName: lic.businessName,
        domain: lic.clientDomain,
        status: lic.status || 'ACTIVE',
        validUntil: new Date(lic.validUntil),
        issuedAt: new Date(lic.issuedAt),
        lastPingAt: new Date(),
        signedToken: serverData.token || '',
        activatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const clientState = computeClientLicenseState({
      licenseKey: updatedSetting.licenseKey,
      businessName: updatedSetting.businessName,
      domain: updatedSetting.domain,
      status: updatedSetting.status,
      validUntil: updatedSetting.validUntil,
      issuedAt: updatedSetting.issuedAt,
      lastPingAt: updatedSetting.lastPingAt,
      token: updatedSetting.signedToken,
    });

    await Installation.findOneAndUpdate({ key: 'primary' }, { state: 'LICENSE_ACTIVATED' });

    await captureServerEvent(request, 'license_activated', {
      license_status: clientState.status,
      has_expiration_date: Boolean(clientState.validUntil),
    }, 'store-license');

    return NextResponse.json({
      success: true,
      message: 'License activated successfully. Continue installation.',
      license: clientState,
    });
  } catch (error: any) {
    await captureServerException(request, error, 'store-license');
    return NextResponse.json(
      { success: false, message: 'License activation could not be completed. Verify the key and licensing service, then try again.' },
      { status: 500 }
    );
  }
}
