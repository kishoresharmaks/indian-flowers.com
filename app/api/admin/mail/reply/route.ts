import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import CustomOrder from '@/models/CustomOrder';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { sendManualReplyEmail } from '@/lib/msg91';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const { to, recipientName, subject, messageBody, inquiryReference, source, id } = body;

    if (!to || !to.includes('@')) {
      return NextResponse.json({ success: false, message: 'Valid recipient email is required' }, { status: 400 });
    }

    if (!messageBody || messageBody.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Reply message cannot be empty' }, { status: 400 });
    }

    // Send reply email via MSG91 (with auto-logging)
    const result = await sendManualReplyEmail({
      to,
      recipientName: recipientName || 'Valued Customer',
      subject: subject || 'Regarding your floral inquiry',
      messageBody,
      inquiryReference,
    });

    // Mark message / inquiry as RESOLVED or IN_PROGRESS
    if (id && source) {
      if (source === 'CONTACT_FORM') {
        await ContactMessage.findByIdAndUpdate(id, { $set: { status: 'RESOLVED' } });
      } else if (source === 'CUSTOM_ORDER') {
        await CustomOrder.findByIdAndUpdate(id, { $set: { status: 'CONFIRMED' } });
      }
    }

    return NextResponse.json({
      success: result.success,
      message: result.message || 'Reply dispatched successfully',
      simulated: result.simulated,
      logId: result.logId,
    });
  } catch (error: any) {
    console.error('[API Admin Mail Reply POST] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to dispatch customer reply' },
      { status: 500 }
    );
  }
}
