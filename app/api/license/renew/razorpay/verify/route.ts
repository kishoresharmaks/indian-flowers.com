import { NextRequest, NextResponse } from 'next/server';
import { getConfiguredLicenseKey, getLicensingServerUrl } from '@/lib/licensing/licenseClient';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      transactionId,
      licenseKey = getConfiguredLicenseKey(),
    } = body;

    const licensingServerUrl = getLicensingServerUrl() || 'http://localhost:4000';

    const res = await fetch(`${licensingServerUrl}/api/license/renew/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        transactionId,
        licenseKey,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      await captureServerEvent(request, 'license_renewal_verified', {
        plan_id: planId,
        payment_provider: 'razorpay',
      }, 'store-license');
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    await captureServerException(request, error, 'store-license');
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to verify payment with Licensing Server' },
      { status: 500 }
    );
  }
}
