import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Party from '@/models/Party';
import Customer from '@/models/Customer';
import { getRazorpayConfig, verifyRazorpaySignature } from '@/lib/razorpay';
import { calculateSalesTax, TaxLineItem } from '@/lib/tax';
import { toCents, fromCents } from '@/lib/tax/taxProvider';
import { validateTaxAddress, normalizeStateCode, formatUSZip } from '@/lib/tax/jurisdiction';
import { getCustomerFromToken } from '@/lib/customerAuth';
import { captureServerEvent } from '@/lib/telemetry';
import { releaseInventory, reserveInventory, type InventoryReservation } from '@/lib/inventory';
import { randomUUID } from 'crypto';
import {
  getLoyaltyConfig,
  calculatePointsEarned,
  calculatePointsDiscount,
  creditOrderPoints,
  debitOrderPoints,
} from '@/lib/loyalty/loyaltyEngine';

export async function POST(request: Request) {
  let reservedInventory: InventoryReservation[] = [];
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment verification parameters.' },
        { status: 400 }
      );
    }

    // 1. Verify Cryptographic Signature
    const config = await getRazorpayConfig();
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret: config.keySecret,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Payment verification failed. Security signature could not be validated.' },
        { status: 400 }
      );
    }

    // 2. Replay & Idempotency Protection: Ensure this payment ID was not already processed
    const existingOrder = await Order.findOne({ transactionId: razorpay_payment_id });
    if (existingOrder) {
      return NextResponse.json(
        {
          success: true,
          message: 'Payment already verified and order previously recorded.',
          data: existingOrder,
        },
        { status: 200 }
      );
    }

    // Enforce Customer Authentication: Only authenticated logged-in customers can place orders
    const customerSession = getCustomerFromToken(request);
    if (!customerSession || !customerSession.customerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required. Please sign in or register to complete your order.',
        },
        { status: 401 }
      );
    }

    const authenticatedCustomer = await Customer.findById(customerSession.customerId);
    if (!authenticatedCustomer || authenticatedCustomer.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer account not found or deactivated. Please sign in again.',
        },
        { status: 401 }
      );
    }

    // 3. Validate Order Details Payload
    if (!orderDetails) {
      return NextResponse.json(
        { success: false, message: 'Order details payload missing from verification request.' },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      streetAddress,
      aptSuite,
      city,
      district,
      state,
      zipCode,
      country = 'US',
      items,
      shippingFee = 0,
      deliveryMode,
      deliveryDate,
      acknowledgedDeliveryTimeframe,
      redeemPoints = 0,
    } = orderDetails;

    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer or item data for order creation.' },
        { status: 400 }
      );
    }

    // 3. Normalize Address
    const finalStreet = (streetAddress || '').trim();
    const finalApt = (aptSuite || '').trim();
    const finalCity = (city || '').trim();
    const finalState = state ? (normalizeStateCode(state) || state.trim().toUpperCase()) : '';
    const finalZip = zipCode ? formatUSZip(zipCode) : '';

    let fullShippingAddress = finalStreet;
    if (finalApt) fullShippingAddress += `, ${finalApt}`;
    if (finalCity) fullShippingAddress += `, ${finalCity}`;
    if (finalState) fullShippingAddress += `, ${finalState}`;
    if (finalZip) fullShippingAddress += ` ${finalZip}`;

    // 4. Authoritative Pricing from Database
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map<string, any>(dbProducts.map((p: any) => [String(p._id), p]));

    let subtotalCents = 0;
    const processedItems: any[] = [];
    const taxCalculationItems: TaxLineItem[] = [];

    for (const item of items) {
      const dbProduct = productMap.get(String(item.productId));
      if (!dbProduct) {
        return NextResponse.json(
          { success: false, message: `Product ${item.name || item.productId} no longer exists.` },
          { status: 400 }
        );
      }

      let authoritativePrice = dbProduct.price;
      if (item.variantName && dbProduct.variants && dbProduct.variants.length > 0) {
        const matchingVariant = dbProduct.variants.find((v: any) => v.name === item.variantName);
        if (!matchingVariant) {
          return NextResponse.json({ success: false, message: 'Selected product variant is unavailable.' }, { status: 400 });
        }
        authoritativePrice = matchingVariant.price;
      }

      const safeQuantity = Math.max(1, parseInt(item.quantity) || 1);
      const lineCents = toCents(authoritativePrice) * safeQuantity;
      subtotalCents += lineCents;

      processedItems.push({
        productId: String(dbProduct._id),
        name: dbProduct.name,
        variantName: item.variantName || '',
        price: authoritativePrice,
        quantity: safeQuantity,
        isTaxable: dbProduct.isTaxable !== false,
        taxCode: dbProduct.taxCode || '',
        gst: 0,
        image: dbProduct.image || '',
      });

      taxCalculationItems.push({
        productId: String(dbProduct._id),
        name: dbProduct.name,
        quantity: safeQuantity,
        unitPrice: authoritativePrice,
        lineSubtotal: authoritativePrice * safeQuantity,
        isTaxable: dbProduct.isTaxable !== false,
        taxCode: dbProduct.taxCode || '',
      });
    }

    const subtotal = fromCents(subtotalCents);

    const finalCustomerId = String(authenticatedCustomer._id);

    // Calculate loyalty points redemption discount if requested
    const loyaltyConfig = await getLoyaltyConfig();
    let pointsToRedeem = 0;
    let pointsDiscountUSD = 0;

    if (finalCustomerId && Number(redeemPoints) > 0) {
      const availablePoints = authenticatedCustomer.pointsBalance || 0;
      const requestedPoints = Math.min(Math.floor(Number(redeemPoints)), availablePoints);

      if (requestedPoints > 0) {
        const loyaltyCalc = calculatePointsDiscount(requestedPoints, subtotal, loyaltyConfig);
        if (loyaltyCalc.isValid && loyaltyCalc.discountAmount > 0) {
          pointsToRedeem = loyaltyCalc.pointsUsed;
          pointsDiscountUSD = loyaltyCalc.discountAmount;
        }
      }
    }

    const couponDiscountCents = 0; // Coupons are not implemented; never trust a client-supplied discount.
    const pointsDiscountCents = Math.min(
      toCents(pointsDiscountUSD),
      Math.max(0, subtotalCents - couponDiscountCents)
    );
    const totalDiscountCents = couponDiscountCents + pointsDiscountCents;
    const safeDiscount = fromCents(totalDiscountCents);

    // 5. Authoritative US Tax Calculation
    const taxResult = await calculateSalesTax({
      shippingAddress: {
        streetAddress: finalStreet,
        aptSuite: finalApt,
        city: finalCity,
        state: finalState,
        zipCode: finalZip,
        country: 'US',
      },
      items: taxCalculationItems,
      shippingFee: Number(shippingFee) || 0,
      discountAmount: safeDiscount,
    });

    const calculatedTax = taxResult.taxAmount || 0;
    const safeShippingFee = Math.max(0, Number(shippingFee) || 0);
    const totalAmountCents =
      subtotalCents - totalDiscountCents + toCents(calculatedTax) + toCents(safeShippingFee);
    const totalAmount = fromCents(Math.max(0, totalAmountCents));

    // 6. Generate a collision-resistant order ID.
    const orderId = `ORD-${randomUUID()}`;

    // Calculate points earned on net merchandise spend
    const netMerchandiseSpend = Math.max(0, subtotal - fromCents(totalDiscountCents));
    const pointsEarned = calculatePointsEarned(netMerchandiseSpend, loyaltyConfig);

    // Run inventory reservation and order creation inside an atomic MongoDB session/transaction
    let dbSession: mongoose.ClientSession | null = null;
    let createdOrder: any = null;
    try {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    } catch {
      // In standalone Mongo instances where transactions are not supported, fallback to non-transactional mode
      dbSession = null;
    }

    try {
      reservedInventory = await reserveInventory(
        processedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantName: item.variantName || undefined,
        })),
        dbSession || undefined
      );

      // 7. Persist Confirmed & Paid Order
      const orderData = {
        orderId,
        orderType: 'ONLINE',
        invoiceNumber: orderId,
        customerId: finalCustomerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: (customerEmail || '').trim(),
        streetAddress: finalStreet,
        aptSuite: finalApt,
        city: finalCity,
        district: (district || '').trim(),
        state: finalState,
        zipCode: finalZip,
        country: country || 'US',
        shippingAddress: fullShippingAddress,
        pincode: finalZip,
        deliveryDate: (deliveryDate || '').trim(),
        acknowledgedDeliveryTimeframe: Boolean(acknowledgedDeliveryTimeframe),
        items: processedItems,
        subtotal,
        discountAmount: safeDiscount,
        pointsRedeemed: pointsToRedeem,
        pointsDiscount: fromCents(pointsDiscountCents),
        pointsEarned,
        pointsAwarded: false, // Loyalty points are awarded ONLY AFTER order is Delivered
        deliveryMode: deliveryMode ? {
          id: String(deliveryMode.id || ''),
          name: String(deliveryMode.name || ''),
          type: String(deliveryMode.type || 'shipping'),
          price: Number(deliveryMode.price) || 0,
          description: String(deliveryMode.description || ''),
          pickupLocation: String(deliveryMode.pickupLocation || ''),
          estimatedDays: String(deliveryMode.estimatedDays || ''),
        } : null,
        shippingFee: safeShippingFee,
        totalTax: calculatedTax,
        totalGst: 0,
        taxSnapshot: taxResult,
        totalAmount,
        paymentMethod: 'Razorpay',
        paymentStatus: 'Paid',
        transactionId: razorpay_payment_id,
        status: 'Processing',
      };

      const [newOrder] = dbSession
        ? await Order.create([orderData], { session: dbSession })
        : [await Order.create(orderData)];
      createdOrder = newOrder;

      if (dbSession) {
        await dbSession.commitTransaction();
      }
    } catch (orderTxError) {
      if (dbSession) {
        await dbSession.abortTransaction();
      }
      throw orderTxError;
    } finally {
      if (dbSession) {
        await dbSession.endSession();
      }
    }

    // Debit redeemed points from customer profile
    if (finalCustomerId && pointsToRedeem > 0) {
      try {
        await debitOrderPoints(finalCustomerId, orderId, pointsToRedeem, fromCents(pointsDiscountCents));
      } catch (loyaltyErr) {
        console.error('Failed to debit redeemed loyalty points:', loyaltyErr);
      }
    }

    // Note: Earned reward points are credited ONLY after the order is Delivered or Completed (handled in order status updates).

    // 8. Auto-sync Customer into Party Directory
    try {
      let party = await Party.findOne({ phone: customerPhone.trim() });
      if (!party) {
        party = await Party.create({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: (customerEmail || '').trim(),
          type: 'CUSTOMER',
          address: fullShippingAddress,
          openingBalance: 0,
          currentBalance: 0,
        });
      }
    } catch (partyErr) {
      console.warn('Failed to upsert Party record for customer:', partyErr);
    }

    // 9. Safe Customer Profile Synchronization (Strictly derived from authenticated session)
    if (authenticatedCustomer && finalStreet && finalCity && finalState && finalZip) {
      try {
        const hasNoSavedAddress = !authenticatedCustomer.address || authenticatedCustomer.address.trim() === '';
        const hasNoSavedPhone = !authenticatedCustomer.phone || authenticatedCustomer.phone.trim() === '' || authenticatedCustomer.phone === '0000000000';
        const explicitSaveRequested = Boolean(orderDetails?.saveAddressToProfile);

        let profileModified = false;
        if (hasNoSavedAddress || explicitSaveRequested) {
          authenticatedCustomer.address = finalStreet;
          authenticatedCustomer.aptSuite = finalApt;
          authenticatedCustomer.city = finalCity;
          authenticatedCustomer.district = (district || '').trim();
          authenticatedCustomer.state = finalState;
          authenticatedCustomer.zipCode = finalZip;
          authenticatedCustomer.country = country || 'US';
          profileModified = true;
        }
        if ((hasNoSavedPhone || explicitSaveRequested) && customerPhone && customerPhone !== '0000000000') {
          authenticatedCustomer.phone = customerPhone.trim();
          profileModified = true;
        }
        if (profileModified) {
          await authenticatedCustomer.save();
        }
      } catch (profileErr) {
        console.error('Failed to sync customer profile from card checkout:', profileErr);
      }
    }

    captureServerEvent('razorpay_order_created', {
      orderId: createdOrder?.orderId || orderId,
      totalAmount: createdOrder?.totalAmount || totalAmount,
      paymentId: razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order created successfully.',
      data: createdOrder,
    });
  } catch (error: any) {
    if (reservedInventory.length > 0) await releaseInventory(reservedInventory);
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Payment verification failed. If your card was charged, please contact customer support.',
      },
      { status: 500 }
    );
  }
}
