import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import EmailLog from '@/models/EmailLog';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const status = searchParams.get('status')?.trim() || '';
    const type = searchParams.get('type')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '30', 10)));

    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (type && type !== 'ALL') {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { to: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await EmailLog.countDocuments(filter);
    const logs = await EmailLog.find(filter)
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Summary counts for quick status bar
    const totalSent = await EmailLog.countDocuments({ status: 'SENT' });
    const totalSimulated = await EmailLog.countDocuments({ status: 'SIMULATED' });
    const totalFailed = await EmailLog.countDocuments({ status: 'FAILED' });

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalAll: totalSent + totalSimulated + totalFailed,
        sent: totalSent,
        simulated: totalSimulated,
        failed: totalFailed,
      },
    });
  } catch (error: any) {
    console.error('[API Admin Mail Logs GET] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch email sent logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await EmailLog.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Log deleted' });
    }

    // If query action=clear-simulated
    const action = searchParams.get('action');
    if (action === 'clear-simulated') {
      const res = await EmailLog.deleteMany({ status: 'SIMULATED' });
      return NextResponse.json({ success: true, message: `Removed ${res.deletedCount} simulated logs` });
    }

    return NextResponse.json({ success: false, message: 'Invalid delete request' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Admin Mail Logs DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete log' },
      { status: 500 }
    );
  }
}
