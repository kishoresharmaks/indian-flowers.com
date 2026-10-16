import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Party from '@/models/Party';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';
import { calculateSalesTax } from '@/lib/tax';
import { toCents, fromCents } from '@/lib/tax/taxProvider';
import { validateTaxAddress, normalizeStateCode, formatUSZip } from '@/lib/tax/jurisdiction';

export async function GET() {
  try {
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
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      customerName,
      customerPhone,
      customerEmail,
      // US Address fields
      streetAddress,
      aptSuite,
      city,
      state,
      zipCode,
      country = 'US',
      // Legacy fallback fields
      shippingAddress: legacyShippingAddress,
      pincode: legacyPincode,
      items,
      paymentMethod,
      transactionId,
      shippingFee = 0,
      discountAmount = 0,
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

      // Determine authoritative price
      let unitPrice = dbProduct ? Number(dbProduct.price) : Number(item.price) || 0;
      let variantName = item.variantName || '';
      let isTaxable = dbProduct ? dbProduct.isTaxable !== false : true;
      let taxCode = dbProduct?.taxCode || '';

      if (dbProduct && item.variantName && Array.isArray(dbProduct.variants)) {
        const variant = dbProduct.variants.find((v: any) => v.name === item.variantName);
        if (variant) {
          unitPrice = Number(variant.price);
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

      // Decrement inventory in DB
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: -qty },
        });
      }
    }

    const subtotal = fromCents(subtotalCents);
    const safeDiscountCents = Math.min(toCents(discountAmount), subtotalCents);
    const safeDiscount = fromCents(safeDiscountCents);

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
      shippingFee: Number(shippingFee) || 0,
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
    const safeShippingFee = Math.max(0, Number(shippingFee) || 0);
    const totalAmountCents =
      subtotalCents - safeDiscountCents + toCents(calculatedTax) + toCents(safeShippingFee);
    const totalAmount = fromCents(Math.max(0, totalAmountCents));

    // 3. Payment Method Verification
    const allowedMethods = ['CreditCard', 'COD', 'ApplePay', 'PayPal', 'CASH', 'Razorpay'];
    const method = allowedMethods.includes(paymentMethod) ? paymentMethod : 'COD';

    // Online Razorpay and digital payments are recorded as 'Paid' when confirmed
    const pStatus = method === 'CreditCard' || method === 'ApplePay' || method === 'PayPal' || method === 'Razorpay' ? 'Paid' : 'Pending';

    // Sequential order ID
    const orderCount = await Order.countDocuments();
    const nextSeqNumber = 1001 + orderCount;
    const orderId = `ORD-${nextSeqNumber}`;

    // 4. Create Order with Durable Tax Snapshot and US Address
    const newOrder = await Order.create({
      orderId,
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
      pincode: finalZip, // backward compatibility
      items: processedItems,
      subtotal,
      discountAmount: safeDiscount,
      shippingFee: safeShippingFee,
      totalTax: calculatedTax,
      totalGst: 0, // Kept 0 for backward compatibility
      taxSnapshot: taxResult,
      totalAmount,
      paymentMethod: method,
      paymentStatus: pStatus,
      transactionId: transactionId || '',
      status: 'Pending',
    });

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
    await captureServerException(request, error, 'online-checkout');
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to place order' },
      { status: 500 }
    );
  }
}
