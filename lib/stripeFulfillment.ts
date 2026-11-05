import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import { reserveInventory } from '@/lib/inventory';
import { stripe } from '@/lib/stripe';
import { fromCents } from '@/lib/tax/taxProvider';
import Stripe from 'stripe';

/**
 * Fulfills a completed Stripe Checkout Session idempotently.
 * Used both by the asynchronous Stripe Webhook and synchronous post-checkout reconciliation.
 */
export async function fulfillStripeCheckoutSession(session: Stripe.Checkout.Session): Promise<any> {
  await connectToDatabase();

  // 1. Idempotency Check: if order already created for this session, return it
  const existingOrder = await Order.findOne({ stripeSessionId: session.id }).lean();
  if (existingOrder) {
    return existingOrder;
  }

  // Only fulfill if payment has actually been authorized/paid
  if (session.payment_status === 'unpaid') {
    return null;
  }

  // 2. Fetch Line Items if not populated
  let lineItems = session.line_items?.data;
  if (!lineItems || lineItems.length === 0) {
    const lineItemsResponse = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
      limit: 100,
    });
    lineItems = lineItemsResponse.data;
  }

  const processedItems: any[] = [];
  for (const item of lineItems) {
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
    try {
      await reserveInventory(
        processedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantName: item.variantName || undefined,
        })),
        dbSession || undefined
      );
    } catch (invErr) {
      console.warn('[Stripe Fulfillment] Inventory reservation notice:', invErr);
    }

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

    console.log(`[Stripe Fulfillment] Order ${createdOrder.orderId} created for session ${session.id}`);

    // Asynchronous Order Confirmation Email (via active email provider)
    if (orderData.customerEmail) {
      try {
        const { sendEmailViaMsg91 } = await import('@/lib/msg91');
        sendEmailViaMsg91({
          to: [{ name: orderData.customerName, email: orderData.customerEmail }],
          subject: `Order Confirmation #${createdOrder.orderId} - Indian-Flowers.com`,
          htmlContent: `<p>Dear ${orderData.customerName},</p><p>Thank you for ordering with <strong>Indian-Flowers.com</strong>! Your payment has been received and your order <strong>#${createdOrder.orderId}</strong> has been confirmed.</p><p><strong>Delivery Date:</strong> ${orderData.deliveryDate || 'Guaranteed Fresh Delivery'}<br/><strong>Total Amount:</strong> $${orderData.totalAmount.toFixed(2)}</p><p>Best regards,<br/>The Indian Flowers Team</p>`,
          textContent: `Dear ${orderData.customerName},\n\nThank you for ordering with Indian-Flowers.com! Your payment has been received and your order #${createdOrder.orderId} has been confirmed.\n\nDelivery Date: ${orderData.deliveryDate || 'Guaranteed Fresh Delivery'}\nTotal Amount: $${orderData.totalAmount.toFixed(2)}\n\nBest regards,\nThe Indian Flowers Team`,
        }).catch((e: any) =>
          console.warn('[Stripe Fulfillment] Non-critical email send failure:', e.message)
        );
      } catch {
        // Optional
      }
    }

    return createdOrder.toObject ? createdOrder.toObject() : createdOrder;
  } catch (txError: any) {
    if (dbSession) {
      await dbSession.abortTransaction();
    }
    console.error('[Stripe Fulfillment Transaction Error]:', txError);
    throw txError;
  } finally {
    if (dbSession) {
      await dbSession.endSession();
    }
  }
}
