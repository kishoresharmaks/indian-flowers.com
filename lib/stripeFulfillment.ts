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

    let itemImage = productObj?.images?.[0] || '';
    if (itemImage.includes('/uploads/')) {
      itemImage = '/uploads/' + itemImage.split('/uploads/')[1];
    } else if (itemImage.includes('/wp-content/')) {
      itemImage = '/wp-content/' + itemImage.split('/wp-content/')[1];
    }

    processedItems.push({
      productId,
      name: productObj?.name || item.description || 'Indian Floral Item',
      variantName,
      price: unitPrice,
      quantity: qty,
      isTaxable: true,
      taxCode: '',
      gst: 0,
      image: itemImage,
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

    // Asynchronous Order Confirmation Email (via active email provider with brand template)
    if (orderData.customerEmail) {
      try {
        const { sendEmailViaMsg91 } = await import('@/lib/msg91');
        const { renderOrderConfirmationEmail } = await import('@/lib/emailTemplate');
        
        const rendered = renderOrderConfirmationEmail({
          orderId: createdOrder.orderId,
          customerName: orderData.customerName,
          deliveryDate: orderData.deliveryDate,
          totalAmount: orderData.totalAmount,
          items: (orderData.items || []).map((i: any) => ({
            name: i.name || i.title || 'Fresh Floral Item',
            quantity: Number(i.quantity) || 1,
            price: Number(i.price) || 0,
            variant: i.variant?.name || i.variantName,
          })),
          subtotal: orderData.subtotal,
          shippingFee: orderData.shippingFee,
          tax: orderData.totalTax,
          shippingAddress: orderData.shippingAddress || fullShippingAddress,
        });

        sendEmailViaMsg91({
          to: [{ name: orderData.customerName, email: orderData.customerEmail }],
          subject: rendered.subject,
          htmlContent: rendered.html,
          textContent: rendered.text,
        }).catch((e: any) =>
          console.warn('[Stripe Fulfillment] Non-critical email send failure:', e.message)
        );
      } catch {
        // Optional
      }
    }

    // Asynchronous Admin Order Alert Email (11-column tabular layout to adminNotificationEmail via active provider)
    try {
      const { sendAdminOrderAlertEmail } = await import('@/lib/msg91');
      sendAdminOrderAlertEmail({
        orderId: createdOrder.orderId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        orderDate: createdOrder.createdAt || new Date(),
        deliveryDate: orderData.deliveryDate,
        deliveryMethod: orderData.deliveryMode?.name || orderData.deliveryMode?.type || 'FedEx Priority Overnight',
        deliveryMode: orderData.deliveryMode,
        shippingAddress: orderData.shippingAddress || fullShippingAddress,
        items: orderData.items,
        subtotal: orderData.subtotal,
        shippingFee: orderData.shippingFee,
        totalTax: orderData.totalTax,
        totalAmount: orderData.totalAmount,
        paymentMethod: 'Stripe',
        paymentStatus: 'Paid',
      }).catch((e: any) =>
        console.warn('[Stripe Fulfillment] Non-critical admin email send failure:', e?.message || e)
      );
    } catch {
      // Optional
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
