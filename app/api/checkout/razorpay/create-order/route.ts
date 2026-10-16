import { NextResponse } from 'next/server';
import { createRazorpayOrder, getRazorpayConfig } from '@/lib/razorpay';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { calculateSalesTax, TaxLineItem } from '@/lib/tax';
import { toCents, fromCents } from '@/lib/tax/taxProvider';
import { validateCheckoutForm } from '@/lib/checkoutValidation';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      items,
      shippingFee = 0,
      discountAmount = 0,
      customerName,
      streetAddress,
      aptSuite,
      city,
      state,
      zipCode,
      customerEmail,
      customerPhone,
    } = body;

    // Strict Pre-flight Form Validation
    const validation = validateCheckoutForm(
      {
        customerName,
        customerPhone,
        customerEmail,
        streetAddress,
        aptSuite,
        city,
        state,
        zipCode,
      },
      items?.length || 0
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.firstErrorMessage ||
            'Please verify all required customer and shipping details before loading Razorpay checkout.',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // 1. Authoritative Product Pricing from Database
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map<string, any>(dbProducts.map((p: any) => [String(p._id), p]));

    let calculatedSubtotal = 0;
    const taxItems: TaxLineItem[] = [];

    for (const item of items) {
      const dbProd = productMap.get(String(item.productId));
      if (!dbProd) {
        return NextResponse.json(
          { success: false, message: `Product ${item.name || item.productId} no longer exists.` },
          { status: 400 }
        );
      }

      let unitPrice = dbProd.price;
      if (item.variantName && dbProd.variants && dbProd.variants.length > 0) {
        const variant = dbProd.variants.find((v: any) => v.name === item.variantName);
        if (variant) unitPrice = variant.price;
      }

      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      calculatedSubtotal += unitPrice * quantity;

      taxItems.push({
        productId: String(item.productId),
        name: dbProd.name || item.name || 'Item',
        quantity,
        unitPrice,
        lineSubtotal: unitPrice * quantity,
        isTaxable: dbProd.isTaxable !== false,
        taxCode: dbProd.taxCode || '',
      });
    }

    // 2. Authoritative US Sales Tax Calculation
    const taxResult = await calculateSalesTax({
      shippingAddress: {
        streetAddress: streetAddress || '',
        aptSuite: aptSuite || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        country: 'US',
      },
      items: taxItems,
      shippingFee: Number(shippingFee) || 0,
      discountAmount: Number(discountAmount) || 0,
    });

    const calculatedTax = taxResult.taxAmount || 0;
    const safeShipping = Math.max(0, Number(shippingFee) || 0);
    const safeDiscount = Math.max(0, Number(discountAmount) || 0);

    const totalCents =
      toCents(calculatedSubtotal) -
      toCents(safeDiscount) +
      toCents(calculatedTax) +
      toCents(safeShipping);

    if (totalCents <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid order total.' },
        { status: 400 }
      );
    }

    const razorpayOrder = await createRazorpayOrder({
      amountCents: totalCents,
      currency: 'USD',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayOrder.keyId,
      isMock: razorpayOrder.isMock,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    const errorDesc =
      error.error?.description ||
      error.description ||
      error.message ||
      'Failed to create Razorpay order';
    return NextResponse.json(
      { success: false, message: errorDesc },
      { status: 500 }
    );
  }
}
