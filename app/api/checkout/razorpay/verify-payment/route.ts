import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Party from '@/models/Party';
import { getRazorpayConfig, verifyRazorpaySignature } from '@/lib/razorpay';
import { calculateSalesTax, TaxLineItem } from '@/lib/tax';
import { toCents, fromCents } from '@/lib/tax/taxProvider';
import { validateTaxAddress, normalizeStateCode, formatUSZip } from '@/lib/tax/jurisdiction';
import { captureServerEvent } from '@/lib/telemetry';

export async function POST(request: Request) {
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
        { success: false, message: 'Missing Razorpay payment verification parameters.' },
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
        { success: false, message: 'Invalid Razorpay payment signature.' },
        { status: 400 }
      );
    }

    // 2. Validate Order Details Payload
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
      state,
      zipCode,
      country = 'US',
      items,
      shippingFee = 0,
      discountAmount = 0,
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
        if (matchingVariant) {
          authoritativePrice = matchingVariant.price;
        }
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
    const safeDiscount = Math.max(0, Number(discountAmount) || 0);
    const safeDiscountCents = toCents(safeDiscount);

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
      subtotalCents - safeDiscountCents + toCents(calculatedTax) + toCents(safeShippingFee);
    const totalAmount = fromCents(Math.max(0, totalAmountCents));

    // 6. Generate Sequential Order ID
    const orderCount = await Order.countDocuments();
    const nextSeqNumber = 1001 + orderCount;
    const orderId = `ORD-${nextSeqNumber}`;

    // 7. Persist Confirmed & Paid Order
    const newOrder = await Order.create({
      orderId,
      orderType: 'ONLINE',
      invoiceNumber: orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: (customerEmail || '').trim(),
      streetAddress: finalStreet,
      aptSuite: finalApt,
      city: finalCity,
      state: finalState,
      zipCode: finalZip,
      country: country || 'US',
      shippingAddress: fullShippingAddress,
      pincode: finalZip,
      items: processedItems,
      subtotal,
      discountAmount: safeDiscount,
      shippingFee: safeShippingFee,
      totalTax: calculatedTax,
      totalGst: 0,
      taxSnapshot: taxResult,
      totalAmount,
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      transactionId: razorpay_payment_id,
      status: 'Processing',
    });

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

    captureServerEvent('razorpay_order_created', {
      orderId: newOrder.orderId,
      totalAmount: newOrder.totalAmount,
      paymentId: razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Razorpay payment verified and order created successfully.',
      data: newOrder,
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
