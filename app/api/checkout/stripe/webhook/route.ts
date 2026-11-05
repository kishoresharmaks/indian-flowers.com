import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import { reserveInventory } from '@/lib/inventory';
import { stripe } from '@/lib/stripe';
import { fromCents } from '@/lib/tax/taxProvider';
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
      await connectToDatabase();

      // 1. Idempotency Check (ACT-01)
      const existingOrder = await Order.findOne({ stripeSessionId: session.id });
      if (existingOrder) {
        console.log(`[Stripe Webhook] Session ${session.id} already fulfilled as order ${existingOrder.orderId}.`);
        return NextResponse.json({ received: true, already_processed: true });
      }

      // 2. Fetch Line Items with product metadata (ACT-02)
      const lineItemsResponse = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
        limit: 100,
      });

      const processedItems: any[] = [];
      for (const item of lineItemsResponse.data) {
        const productObj = item.price?.product as Stripe.Product | undefined;
        const meta = productObj?.metadata || {};

        // Skip non-merchandise line items (shipping, tax)
        if (meta.type === 'shipping_fee' || meta.type === 'sales_tax') {
          continue;
        }

        const productId = meta.productId;
        if (!productId) continue;

        const variantName = meta.variantName || '';
        const unitPrice = item.price?.unit_amount ? item.price.unit_amount / 100 : 0;
        const qty = item.quantity || 1;

        processedItems.push({
          productId,
          name: productObj?.name || item.description || 'Indian Floral Item',
          variantName,
          price: unitPrice,
          quantity: qty,
          isTaxable: true,
          taxCode: '',
          gst: 0,
          image: productObj?.images?.[0] || '',
        });
      }

      // 3. Extract Order Fulfillment Metadata
      const meta = session.metadata || {};
      const finalStreet = (meta.streetAddress || '').trim();
      const finalApt = (meta.aptSuite || '').trim();
      const finalCity = (meta.city || '').trim();
      const finalDistrict = (meta.district || '').trim();
      const finalState = (meta.state || '').trim().toUpperCase();
      const finalZip = (meta.zipCode || '').trim();

      let fullShippingAddress = finalStreet;
      if (finalApt) fullShippingAddress += `, ${finalApt}`;
      if (finalCity) fullShippingAddress += `, ${finalCity}`;
      if (finalState) fullShippingAddress += `, ${finalState}`;
      if (finalZip) fullShippingAddress += ` ${finalZip}`;

      const shippingFee = fromCents(Number(meta.shippingFeeCents) || 0);
      const totalTax = fromCents(Number(meta.taxAmountCents) || 0);
      const pointsRedeemed = Number(meta.pointsRedeemed) || 0;
      const pointsDiscount = fromCents(Number(meta.pointsDiscountCents) || 0);
      const totalAmount = (session.amount_total || 0) / 100;
      const subtotal = processedItems.reduce((acc, itm) => acc + itm.price * itm.quantity, 0);

      const orderId = `ORD-${randomUUID()}`;
      const finalCustomerId = meta.customerId || session.client_reference_id || undefined;

      // 4. Atomic MongoDB Session
      let dbSession: mongoose.ClientSession | null = null;
      try {
        dbSession = await mongoose.startSession();
        dbSession.startTransaction();
      } catch {
        dbSession = null;
      }

      try {
        // Reserve / Decrement Inventory
        await reserveInventory(
          processedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantName: item.variantName || undefined,
          })),
          dbSession || undefined
        );

        // Debit Customer Loyalty Points if redeemed
        if (pointsRedeemed > 0 && finalCustomerId) {
          await Customer.findByIdAndUpdate(
            finalCustomerId,
            { $inc: { pointsBalance: -pointsRedeemed } },
            { session: dbSession || undefined }
          );
        }

        // Create Order Document
        const orderData = {
          orderId,
          orderType: 'ONLINE',
          invoiceNumber: orderId,
          customerId: finalCustomerId,
          customerName: (meta.customerName || session.customer_details?.name || 'Valued Customer').trim(),
          customerPhone: (meta.customerPhone || session.customer_details?.phone || '').trim(),
          customerEmail: (meta.customerEmail || session.customer_details?.email || '').trim(),
          streetAddress: finalStreet,
          aptSuite: finalApt,
          city: finalCity,
          district: finalDistrict,
          state: finalState,
          zipCode: finalZip,
          country: 'US',
          shippingAddress: fullShippingAddress,
          pincode: finalZip,
          deliveryDate: (meta.deliveryDate || '').trim(),
          acknowledgedDeliveryTimeframe: meta.acknowledgedDeliveryTimeframe === 'true',
          items: processedItems,
          subtotal,
          discountAmount: pointsDiscount,
          pointsRedeemed,
          pointsDiscount,
          pointsEarned: 0,
          pointsAwarded: false,
          deliveryMode: meta.deliveryModeId
            ? {
                id: meta.deliveryModeId,
                name: meta.deliveryModeName || 'Standard Delivery',
                type: 'shipping',
                price: shippingFee,
              }
            : null,
          shippingFee,
          totalTax,
          totalGst: 0,
          totalAmount,
          paymentMethod: 'Stripe',
          paymentStatus: 'Paid',
          stripeSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          transactionId: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
          status: 'Processing',
        };

        const [createdOrder] = await Order.create([orderData], { session: dbSession || undefined });

        if (dbSession) {
          await dbSession.commitTransaction();
        }

        console.log(`[Stripe Webhook] Order ${createdOrder.orderId} successfully created for session ${session.id}`);

        // Async Order Confirmation Email (MSG91 / Brevo)
        if (orderData.customerEmail) {
          try {
            const { sendEmailViaMsg91 } = await import('@/lib/msg91');
            sendEmailViaMsg91({
              to: [{ name: orderData.customerName, email: orderData.customerEmail }],
              subject: `Order Confirmation #${createdOrder.orderId} - Indian-Flowers.com`,
              htmlContent: `<p>Dear ${orderData.customerName},</p><p>Thank you for ordering with <strong>Indian-Flowers.com</strong>! Your payment has been received and your order <strong>#${createdOrder.orderId}</strong> has been confirmed.</p><p><strong>Delivery Date:</strong> ${orderData.deliveryDate || 'Guaranteed Fresh Delivery'}<br/><strong>Total Amount:</strong> $${orderData.totalAmount.toFixed(2)}</p><p>Best regards,<br/>The Indian Flowers Team</p>`,
              textContent: `Dear ${orderData.customerName},\n\nThank you for ordering with Indian-Flowers.com! Your payment has been received and your order #${createdOrder.orderId} has been confirmed.\n\nDelivery Date: ${orderData.deliveryDate || 'Guaranteed Fresh Delivery'}\nTotal Amount: $${orderData.totalAmount.toFixed(2)}\n\nBest regards,\nThe Indian Flowers Team`,
            }).catch((e: any) =>
              console.warn('[Stripe Webhook] Non-critical email send failure:', e.message)
            );
          } catch {
            // Email service optional
          }
        }

        return NextResponse.json({ received: true, orderId: createdOrder.orderId });
      } catch (txError: any) {
        if (dbSession) {
          await dbSession.abortTransaction();
        }
        console.error('[Stripe Webhook Transaction Error]:', txError);
        return NextResponse.json({ error: txError.message || 'Transaction failed' }, { status: 500 });
      } finally {
        if (dbSession) {
          await dbSession.endSession();
        }
      }
    } catch (dbError: any) {
      console.error('[Stripe Webhook Database Error]:', dbError);
      return NextResponse.json({ error: dbError.message || 'Database error' }, { status: 500 });
    }
  }

  // Acknowledge other unhandled event types
  return NextResponse.json({ received: true });
}
