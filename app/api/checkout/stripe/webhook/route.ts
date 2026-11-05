import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { fulfillStripeCheckoutSession } from '@/lib/stripeFulfillment';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[Stripe Webhook] Missing signature or STRIPE_WEBHOOK_SECRET.');
    return NextResponse.json(
      { error: 'Webhook configuration error or missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook signature error: ${err.message}` }, { status: 400 });
  }

  // Handle successful checkout completion
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    // Fulfill ONLY when payment status is not 'unpaid'
    if (session.payment_status === 'unpaid') {
      console.log(`[Stripe Webhook] Session ${session.id} completed but unpaid; awaiting payment.`);
      return NextResponse.json({ received: true, status: 'unpaid_waiting' });
    }

    try {
      const order = await fulfillStripeCheckoutSession(session);
      return NextResponse.json({ received: true, orderId: order?.orderId });
    } catch (dbError: any) {
      console.error('[Stripe Webhook Fulfillment Error]:', dbError);
      return NextResponse.json({ error: dbError.message || 'Database error' }, { status: 500 });
    }
  }

  // Acknowledge other unhandled event types
  return NextResponse.json({ received: true });
}
