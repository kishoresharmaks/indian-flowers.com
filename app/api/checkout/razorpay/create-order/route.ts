import { NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { calculateSalesTax, TaxLineItem } from '@/lib/tax';
import { toCents, fromCents } from '@/lib/tax/taxProvider';
import { validateCheckoutForm } from '@/lib/checkoutValidation';
import { getCustomerFromToken } from '@/lib/customerAuth';
import { getLoyaltyConfig, calculatePointsDiscount } from '@/lib/loyalty/loyaltyEngine';

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // Enforce Customer Authentication: Only authenticated logged-in customers can checkout
    const customerSession = getCustomerFromToken(request);
    if (!customerSession || !customerSession.customerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required. Please sign in or register to complete checkout.',
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
      items,
      shippingFee = 0,
      deliveryMode,
      redeemPoints = 0,
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
            'Please verify all required customer and shipping details before proceeding with payment.',
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
      let variantName = item.variantName || '';
      if (item.variantName && Array.isArray(dbProd.variants)) {
        const variant = dbProd.variants.find((v: any) => v.name === item.variantName);
        if (!variant) {
          return NextResponse.json({ success: false, message: 'Selected variant is no longer available.' }, { status: 400 });
        }
        unitPrice = variant.price;
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      const lineSubtotal = unitPrice * qty;
      calculatedSubtotal += lineSubtotal;

      taxItems.push({
        productId: String(item.productId),
        name: variantName ? `${dbProd.name} (${variantName})` : dbProd.name,
        quantity: qty,
        unitPrice,
        lineSubtotal,
        isTaxable: dbProd.isTaxable !== false,
        taxCode: dbProd.taxCode || '',
      });
    }

    const finalCustomerId = String(authenticatedCustomer._id);
    const loyaltyConfig = await getLoyaltyConfig();
    let pointsDiscountUSD = 0;

    if (finalCustomerId && Number(redeemPoints) > 0) {
      const availablePoints = authenticatedCustomer.pointsBalance || 0;
      const requestedPoints = Math.min(Math.floor(Number(redeemPoints)), availablePoints);

      if (requestedPoints > 0) {
        const loyaltyCalc = calculatePointsDiscount(requestedPoints, calculatedSubtotal, loyaltyConfig);
        if (loyaltyCalc.isValid && loyaltyCalc.discountAmount > 0) {
          pointsDiscountUSD = loyaltyCalc.discountAmount;
        }
      }
    }

    const couponDiscountCents = 0; // Coupons are not implemented; never trust a client-supplied discount.
    const pointsDiscountCents = Math.min(
      toCents(pointsDiscountUSD),
      Math.max(0, toCents(calculatedSubtotal) - couponDiscountCents)
    );
    const totalDiscountCents = couponDiscountCents + pointsDiscountCents;
    const safeDiscount = fromCents(totalDiscountCents);

    // Dynamic FedEx Shipping Verification
    let safeShipping = Math.max(0, Number(shippingFee) || 0);
    const deliveryModeId = deliveryMode?.id || '';

    if (deliveryModeId === 'fedex-shipping' && (zipCode || state)) {
      try {
        const { getFedExRates } = await import('@/lib/shipping/fedexClient');
        const fedexQuote = await getFedExRates({
          destination: {
            streetAddress: streetAddress || '',
            city: city || '',
            state: state || '',
            zipCode: zipCode || '',
            country: 'US',
          },
          items: taxItems,
        });
        if (fedexQuote?.recommendedRate?.amount) {
          safeShipping = fedexQuote.recommendedRate.amount;
        }
      } catch (err) {
        console.warn('FedEx dynamic calculation in razorpay create-order:', err);
      }
    }

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
      shippingFee: safeShipping,
      discountAmount: safeDiscount,
    });

    const calculatedTax = taxResult.taxAmount || 0;

    const totalCents =
      toCents(calculatedSubtotal) -
      totalDiscountCents +
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
    return NextResponse.json(
      {
        success: false,
        message: 'Online card checkout is temporarily unavailable. Please try another card or select Cash on Delivery to complete your order.',
      },
      { status: 500 }
    );
  }
}
