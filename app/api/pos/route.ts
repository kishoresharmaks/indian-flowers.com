import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Party from '@/models/Party';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';
import { formatCurrency } from '@/lib/currency';
import { calculateSalesTax } from '@/lib/tax';

export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      items,
      customerName = 'Walk-in Guest',
      customerPhone = '0000000000',
      customerEmail = '',
      paymentMethod = 'CASH',
      discountType = 'FLAT',
      discountValue = 0,
      cashReceived = 0,
      transactionId = '',
      cashierName = 'Admin Cashier',
      cashierId = 'admin',
    } = body;

    // 1. Basic Payload Validations
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'POS billing cart cannot be empty.' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'COD') {
      return NextResponse.json(
        { success: false, message: 'Cash on Delivery (COD) is not valid for POS counter sales.' },
        { status: 400 }
      );
    }

    if (!['CASH', 'CreditCard', 'Razorpay'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment method for POS sale.' },
        { status: 400 }
      );
    }

    // 2. Fetch Authoritative Products & Perform Server-Side Recalculations
    const verifiedItems: any[] = [];
    const taxItems: any[] = [];
    let calculatedSubtotalCents = 0;

    for (const rawItem of items) {
      const product = await Product.findById(rawItem.productId).lean();
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found (ID: ${rawItem.productId})` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Number(rawItem.quantity || 1));
      let itemPrice = product.price;
      let variantName = '';

      if (rawItem.variantName && product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v) => v.name === rawItem.variantName);
        if (variant) {
          itemPrice = variant.price;
          variantName = variant.name;
        }
      } else if (!variantName && product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v) => Number(v.price) === Number(rawItem.price || product.price));
        if (variant) {
          variantName = variant.name;
        }
      }

      const lineSubtotalCents = Math.round(Number(itemPrice) * 100) * qty;
      calculatedSubtotalCents += lineSubtotalCents;

      const isTaxable = product.isTaxable !== false;

      verifiedItems.push({
        productId: String(product._id),
        name: product.name,
        variantName,
        price: itemPrice,
        quantity: qty,
        isTaxable,
        taxCode: product.taxCode || '',
        gst: 0,
        image: product.image,
      });

      taxItems.push({
        productId: String(product._id),
        name: product.name,
        variantName,
        quantity: qty,
        unitPrice: itemPrice,
        lineSubtotal: lineSubtotalCents / 100,
        isTaxable,
      });
    }

    const calculatedSubtotal = calculatedSubtotalCents / 100;

    // 3. Server-side Discount Recalculation
    let discountAmountCents = 0;
    const numericDiscountValue = Math.max(0, Number(discountValue || 0));

    if (discountType === 'PERCENTAGE') {
      discountAmountCents = Math.round(calculatedSubtotalCents * (numericDiscountValue / 100));
    } else {
      discountAmountCents = Math.round(numericDiscountValue * 100);
    }
    // Cap discount to not exceed subtotal
    discountAmountCents = Math.min(discountAmountCents, calculatedSubtotalCents);
    const discountAmount = discountAmountCents / 100;

    // 4. US Sales Tax Calculation for Counter Sale
    const taxResult = await calculateSalesTax({
      shippingAddress: {
        streetAddress: 'Counter POS Sale',
        city: 'Storefront',
        state: process.env.NEXT_PUBLIC_COMPANY_STATE || 'CA',
        zipCode: process.env.NEXT_PUBLIC_COMPANY_ZIP || '94538',
        country: 'US',
      },
      items: taxItems,
      discountAmount,
    });

    const calculatedTotalTax = taxResult.taxAmount || 0;
    const calculatedFinalTotalCents = Math.max(
      0,
      calculatedSubtotalCents - discountAmountCents + Math.round(calculatedTotalTax * 100)
    );
    const calculatedFinalTotal = calculatedFinalTotalCents / 100;

    // 4. Server-side CASH / Card Payment Validation
    let finalCashReceived = 0;
    let finalChangeReturned = 0;

    if (paymentMethod === 'CASH') {
      finalCashReceived = Number(cashReceived || 0);
      if (finalCashReceived < calculatedFinalTotal) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient cash received. Required: ${formatCurrency(calculatedFinalTotal)}, Received: ${formatCurrency(finalCashReceived)}`,
          },
          { status: 400 }
        );
      }
      finalChangeReturned = Math.round(finalCashReceived - calculatedFinalTotal);
    } else {
      // CreditCard / External Terminal / Electronic Payment
      finalCashReceived = calculatedFinalTotal;
      finalChangeReturned = 0;
    }

    // 5. Atomic Concurrency-Safe Stock Deduction with Automatic Rollback
    const deductedItems: { productId: string; variantName: string; quantity: number }[] = [];

    for (const item of verifiedItems) {
      let updateResult: any;

      if (item.variantName) {
        // Atomic update for variant stock & total stock
        updateResult = await Product.updateOne(
          {
            _id: item.productId,
            'variants.name': item.variantName,
            'variants.quantity': { $gte: item.quantity },
          },
          {
            $inc: {
              'variants.$.quantity': -item.quantity,
              quantity: -item.quantity,
            },
          }
        );
      } else {
        // Atomic update for main product stock
        updateResult = await Product.updateOne(
          { _id: item.productId, quantity: { $gte: item.quantity } },
          { $inc: { quantity: -item.quantity } }
        );
      }

      if (updateResult.modifiedCount === 0) {
        // Stock deduction failed due to insufficient stock -> ROLLBACK previously deducted items!
        for (const rollbackItem of deductedItems) {
          if (rollbackItem.variantName) {
            await Product.updateOne(
              { _id: rollbackItem.productId, 'variants.name': rollbackItem.variantName },
              {
                $inc: {
                  'variants.$.quantity': rollbackItem.quantity,
                  quantity: rollbackItem.quantity,
                },
              }
            );
          } else {
            await Product.updateOne(
              { _id: rollbackItem.productId },
              { $inc: { quantity: rollbackItem.quantity } }
            );
          }
        }

        return NextResponse.json(
          {
            success: false,
            message: `Stock reservation failed: Insufficient quantity available for "${item.name}${item.variantName ? ` (${item.variantName})` : ''}".`,
          },
          { status: 400 }
        );
      }

      deductedItems.push({
        productId: item.productId,
        variantName: item.variantName,
        quantity: item.quantity,
      });
    }

    // 6. Generate Unique POS Invoice Number (BH-POS-YYYYMMDD-XXXXXX)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const posCountToday = await Order.countDocuments({
      orderType: 'POS',
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      },
    });

    const invoiceNumber = `BH-POS-${dateStr}-${String(posCountToday + 1).padStart(4, '0')}`;
    const orderId = `ORD-POS-${Date.now()}`;

    // 7. Save POS Order to Database
    const newOrder = await Order.create({
      orderId,
      invoiceNumber,
      orderType: 'POS',
      customerName: customerName.trim() || 'Walk-in Guest',
      customerPhone: customerPhone.trim() || '0000000000',
      customerEmail: customerEmail.trim() === 'pos@beeshubfarmland.com' ? '' : customerEmail.trim(),
      streetAddress: 'Counter POS Sale',
      city: 'Storefront',
      state: process.env.NEXT_PUBLIC_COMPANY_STATE || 'CA',
      zipCode: process.env.NEXT_PUBLIC_COMPANY_ZIP || '94538',
      country: 'US',
      shippingAddress: 'Nexus Ecom Counter Sale',
      pincode: '94538',
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      totalTax: calculatedTotalTax,
      totalGst: 0,
      taxSnapshot: taxResult,
      discountType,
      discountValue: numericDiscountValue,
      discountAmount,
      totalAmount: calculatedFinalTotal,
      paymentMethod,
      paymentStatus: 'Paid',
      transactionId: transactionId.trim(),
      cashReceived: finalCashReceived,
      changeReturned: finalChangeReturned,
      cashierName,
      cashierId,
      status: 'Completed',
    });

    // Auto-sync Customer into Party Directory for billing & accounting
    if (customerPhone && customerPhone !== '0000000000') {
      try {
        await Party.findOneAndUpdate(
          { phone: customerPhone.trim() },
          {
            $setOnInsert: { partyType: 'CUSTOMER', openingBalance: 0, currentBalance: 0 },
            $set: {
              name: customerName.trim(),
              phone: customerPhone.trim(),
              email: customerEmail.trim(),
            },
          },
          { upsert: true, new: true }
        );
      } catch (partyErr) {
        console.error('Failed to sync party', partyErr);
      }
    }

    await captureServerEvent(request, 'pos_sale_completed', {
      order_id: orderId,
      invoice_number: invoiceNumber,
      item_count: verifiedItems.length,
      total_amount: calculatedFinalTotal,
      discount_amount: discountAmount,
      payment_method: paymentMethod,
    }, `cashier:${cashierId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'POS Sale completed successfully!',
        data: newOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POS Billing Error:', error);
    await captureServerException(request, error, 'pos-counter');
    return NextResponse.json(
      { success: false, message: error.message || 'Server error completing POS billing' },
      { status: 500 }
    );
  }
}
