import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { sendTestEmail } from '@/lib/msg91';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    const body = await req.json();
    const targetEmail = body.targetEmail?.trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid recipient email address' },
        { status: 400 }
      );
    }

    const result = await sendTestEmail(targetEmail);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      simulated: result.simulated,
      logId: result.logId,
      data: result.data,
    });
  } catch (error: any) {
    console.error('[API Admin Mail Test] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error occurred while executing test email' },
      { status: 500 }
    );
  }
}
