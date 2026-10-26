import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Party from '@/models/Party';
import Customer from '@/models/Customer';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';
import { calculateSalesTax } from '@/lib/tax';
import { toCents, fromCents } from '@/lib/tax/taxProvider';
import { validateTaxAddress, normalizeStateCode, formatUSZip } from '@/lib/tax/jurisdiction';
import { getCustomerFromToken } from '@/lib/customerAuth';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { releaseInventory, reserveInventory, type InventoryReservation } from '@/lib/inventory';
import { randomUUID } from 'crypto';
import {
  getLoyaltyConfig,
  calculatePointsEarned,
  calculatePointsDiscount,
  creditOrderPoints,
  debitOrderPoints,
} from '@/lib/loyalty/loyaltyEngine';

export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let reservedInventory: InventoryReservation[] = [];
  try {
    await connectToDatabase();

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

    const body = await request.json();

    const {
      customerName,
      customerPhone,
      customerEmail,
      // US Address fields
      streetAddress,
      aptSuite,
      city,
      district,
      state,
      zipCode,
      country = 'US',
      // Legacy fallback fields
      shippingAddress: legacyShippingAddress,
      pincode: legacyPincode,
      items,
      paymentMethod,
      shippingFee = 0,
      deliveryMode,
      redeemPoints = 0,
    } = body;

    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer details and at least one order item are required.' },
        { status: 400 }
      );
    }

    // Determine and normalize address fields
    const finalStreet = (streetAddress || legacyShippingAddress || '').trim();
    const finalApt = (aptSuite || '').trim();
    const finalCity = (city || '').trim();
    const finalState = state ? (normalizeStateCode(state) || state.trim().toUpperCase()) : '';
    const finalZip = zipCode ? formatUSZip(zipCode) : (legacyPincode || '').trim();

    // Construct unified shipping address string for display & legacy views
    let fullShippingAddress = finalStreet;
    if (finalApt) fullShippingAddress += `, ${finalApt}`;
    if (finalCity) fullShippingAddress += `, ${finalCity}`;
    if (finalState) fullShippingAddress += `, ${finalState}`;
    if (finalZip) fullShippingAddress += ` ${finalZip}`;

    // Validate US address if structured fields provided
    if (streetAddress || city || state || zipCode) {
      const addressValidation = validateTaxAddress({
        streetAddress: finalStreet,
        city: finalCity,
        state: finalState,
        zipCode: finalZip,
      });

      if (!addressValidation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid shipping address: ${addressValidation.errors.join(' ')}`,
          },
          { status: 400 }
        );
      }
    } else if (!finalStreet) {
      return NextResponse.json(
        { success: false, message: 'Shipping address is required.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Product Pricing & Verification from Database
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map<string, any>(dbProducts.map((p: any) => [String(p._id), p]));

    const processedItems: any[] = [];
    const taxItems: any[] = [];
    let subtotalCents = 0;

    for (const item of items) {
      const dbProduct = productMap.get(String(item.productId));
      const qty = Math.max(1, Number(item.quantity) || 1);

      if (!dbProduct) {
        return NextResponse.json(
          { success: false, message: `Product ${item.productId || item.name || ''} no longer exists.` },
          { status: 400 }
        );
      }

      // Determine authoritative price
      let unitPrice = Number(dbProduct.price);
      let variantName = item.variantName || '';
      let isTaxable = dbProduct.isTaxable !== false;
      let taxCode = dbProduct?.taxCode || '';

      if (dbProduct && item.variantName && Array.isArray(dbProduct.variants)) {
        const variant = dbProduct.variants.find((v: any) => v.name === item.variantName);
        if (!variant) {
          return NextResponse.json({ success: false, message: 'Selected product variant is unavailable.' }, { status: 400 });
        }
        unitPrice = Number(variant.price);
        variantName = variant.name;
      } else if (dbProduct && !variantName && Array.isArray(dbProduct.variants) && dbProduct.variants.length > 0) {
        const variant = dbProduct.variants.find((v: any) => Number(v.price) === Number(unitPrice));
        if (variant) {
          variantName = variant.name;
        }
      }

      const lineSubtotalCents = toCents(unitPrice) * qty;
      subtotalCents += lineSubtotalCents;

      processedItems.push({
        productId: String(item.productId || ''),
        name: dbProduct?.name || item.name || 'Item',
        variantName,
        price: unitPrice,
        quantity: qty,
        isTaxable,
        taxCode,
        gst: 0, // Legacy support
        image: dbProduct?.image || item.image || '',
      });

      taxItems.push({
        productId: String(item.productId || ''),
        name: dbProduct?.name || item.name || 'Item',
        variantName,
        quantity: qty,
        unitPrice,
        lineSubtotal: fromCents(lineSubtotalCents),
        isTaxable,
        taxCode,
      });

    }

    const subtotal = fromCents(subtotalCents);

    const finalCustomerId = String(authenticatedCustomer._id);

    // Calculate loyalty points redemption discount if requested by customer
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

    // Dynamic Location-Based FedEx Shipping Fee Verification
    let safeShippingFee = Math.max(0, Number(shippingFee) || 0);
    if (deliveryMode?.id === 'fedex-shipping' && (finalZip || finalState)) {
      try {
        const { getFedExRates } = await import('@/lib/shipping/fedexClient');
        const fedexQuote = await getFedExRates({
          destination: {
            streetAddress: finalStreet,
            city: finalCity,
            state: finalState,
            zipCode: finalZip,
            country: country || 'US',
          },
          items: processedItems,
        });
        if (fedexQuote?.recommendedRate?.amount) {
          safeShippingFee = fedexQuote.recommendedRate.amount;
        }
      } catch (err) {
        console.warn('FedEx dynamic calculation in orders POST:', err);
      }
    }

    // 2. Authoritative Server-side US Sales Tax Calculation
    const taxResult = await calculateSalesTax({
      shippingAddress: {
        streetAddress: finalStreet,
        aptSuite: finalApt,
        city: finalCity,
        state: finalState,
        zipCode: finalZip,
        country: country || 'US',
      },
      items: taxItems,
      discountAmount: safeDiscount,
      shippingFee: safeShippingFee,
    });

    if (!taxResult.success && taxResult.status === 'UNSUPPORTED_JURISDICTION') {
      return NextResponse.json(
        {
          success: false,
          message: taxResult.errorMessage || 'Unable to calculate verified sales tax for this address.',
        },
        { status: 400 }
      );
    }

    const calculatedTax = taxResult.taxAmount || 0;
    const totalAmountCents =
      subtotalCents - totalDiscountCents + toCents(calculatedTax) + toCents(safeShippingFee);
    const totalAmount = fromCents(Math.max(0, totalAmountCents));

    // 3. Payment Method Verification
    if (paymentMethod !== 'COD') {
      return NextResponse.json(
        { success: false, message: 'Online payments must be created through the verified payment endpoint.' },
        { status: 400 }
      );
    }
    const method = 'COD';
    const pStatus = 'Pending';
    const orderId = `ORD-${randomUUID()}`;

    // Calculate points earned on net merchandise spend
    const netMerchandiseSpend = Math.max(0, subtotal - fromCents(totalDiscountCents));
    const pointsEarned = calculatePointsEarned(netMerchandiseSpend, loyaltyConfig);

    reservedInventory = await reserveInventory(
      processedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantName: item.variantName || undefined,
      }))
    );

    // 4. Create Order with Durable Tax Snapshot and US Address
    const newOrder = await Order.create({
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
      pincode: finalZip, // backward compatibility
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
      totalGst: 0, // Kept 0 for backward compatibility
      taxSnapshot: taxResult,
      totalAmount,
      paymentMethod: method,
      paymentStatus: pStatus,
      transactionId: '',
      status: 'Pending',
    });

    // Debit redeemed points from customer profile if points claimed
    if (finalCustomerId && pointsToRedeem > 0) {
      try {
        await debitOrderPoints(finalCustomerId, orderId, pointsToRedeem, fromCents(pointsDiscountCents));
      } catch (loyaltyErr) {
        console.error('Failed to debit redeemed loyalty points:', loyaltyErr);
      }
    }

    // Note: Earned reward points are credited ONLY after the order is Delivered or Completed (handled in order status updates).

    // 5. Auto-sync Customer into Party Directory for billing & accounting
    if (customerPhone && customerPhone !== '0000000000') {
      try {
        await Party.findOneAndUpdate(
          { phone: customerPhone.trim() },
          {
            $setOnInsert: { partyType: 'CUSTOMER', openingBalance: 0, currentBalance: 0 },
            $set: {
              name: customerName.trim(),
              phone: customerPhone.trim(),
              email: (customerEmail || '').trim(),
              address: fullShippingAddress,
            },
          },
          { upsert: true, new: true }
        );
      } catch (partyErr) {
        console.error('Failed to sync party', partyErr);
      }
    }

    // 6. Safe Customer Profile Synchronization (Strictly derived from authenticated session)
    if (authenticatedCustomer && finalStreet && finalCity && finalState && finalZip) {
      try {
        const hasNoSavedAddress = !authenticatedCustomer.address || authenticatedCustomer.address.trim() === '';
        const hasNoSavedPhone = !authenticatedCustomer.phone || authenticatedCustomer.phone.trim() === '' || authenticatedCustomer.phone === '0000000000';
        const explicitSaveRequested = Boolean(body.saveAddressToProfile);

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
        console.error('Failed to sync customer profile from checkout:', profileErr);
      }
    }

    await captureServerEvent(
      request,
      'online_order_placed',
      {
        order_id: orderId,
        item_count: items.length,
        subtotal,
        total_tax: calculatedTax,
        total_amount: totalAmount,
        payment_method: method,
      },
      `order:${String(newOrder._id)}`
    );

    return NextResponse.json(
      { success: true, message: 'Order created successfully', data: newOrder },
      { status: 201 }
    );
  } catch (error: any) {
    if (reservedInventory.length > 0) await releaseInventory(reservedInventory);
    await captureServerException(request, error, 'online-checkout');
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to place order' },
      { status: 500 }
    );
  }
}
