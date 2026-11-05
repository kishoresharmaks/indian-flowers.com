import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { stripe } from '@/lib/stripe';
import { fulfillStripeCheckoutSession } from '@/lib/stripeFulfillment';

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

    // 1. Check if order already persisted in MongoDB
    const order = await Order.findOne({ stripeSessionId: sessionId }).lean();
    if (order) {
      return NextResponse.json({
        success: true,
        pending: false,
        order,
      });
    }

    // 2. Synchronous On-Demand Reconcile with Stripe
    // If webhook hasn't arrived (e.g. STRIPE_WEBHOOK_SECRET not set yet or delivery delay),
    // retrieve the session directly from Stripe. If paid/complete, fulfill immediately!
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'line_items.data.price.product'],
      });

      if (session.payment_status === 'paid' || session.status === 'complete') {
        const fulfilledOrder = await fulfillStripeCheckoutSession(session);
        if (fulfilledOrder) {
          return NextResponse.json({
            success: true,
            pending: false,
            order: fulfilledOrder,
          });
        }
      }
    } catch (stripeErr: any) {
      console.warn('[Order By Session] Stripe session retrieve notice:', stripeErr.message);
    }

    // 3. Order truly unpaid or asynchronous payment pending
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
