import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    if (!sessionId) {
      return NextResponse.json({ success: false, message: 'Session ID is required.' }, { status: 400 });
    }

    await connectToDatabase();

    const order = await Order.findOne({ stripeSessionId: sessionId }).lean();

    if (order) {
      return NextResponse.json({
        success: true,
        pending: false,
        order,
      });
    }

    // Order not yet persisted by webhook (reconciliation in progress)
    return NextResponse.json(
      {
        success: false,
        pending: true,
        message: 'Order confirmation is currently being finalized.',
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('[Order By Session Lookup Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to look up order by session.' },
      { status: 500 }
    );
  }
}
