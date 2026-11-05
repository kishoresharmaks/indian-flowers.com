import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { calculateSalesTax, TaxLineItem } from '@/lib/tax';
import { toCents, fromCents } from '@/lib/tax/taxProvider';
import { validateCheckoutForm } from '@/lib/checkoutValidation';
import { getCustomerFromToken } from '@/lib/customerAuth';
import { getLoyaltyConfig, calculatePointsDiscount } from '@/lib/loyalty/loyaltyEngine';
import { stripe, isStripeConfigured } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Stripe payment gateway is not configured on the server. Please select Cash on Delivery or contact support.',
        },
        { status: 503 }
      );
    }

    await connectToDatabase();

    // 1. Enforce Customer Authentication
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
      deliveryDate,
      acknowledgedDeliveryTimeframe,
      redeemPoints = 0,
      customerName,
      customerPhone,
      customerEmail,
      streetAddress,
      aptSuite,
      city,
      district,
      state,
      zipCode,
    } = body;

    // 2. Strict Pre-flight Address & Date Validation
    const validation = validateCheckoutForm(
      {
        customerName,
        customerPhone,
        customerEmail: customerEmail || authenticatedCustomer.email,
        streetAddress,
        aptSuite,
        city,
        state,
        zipCode,
        deliveryDate,
        acknowledgedDeliveryTimeframe,
      },
      items?.length || 0
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.firstErrorMessage || 'Please verify all required customer and shipping details.',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // 3. Authoritative Pricing from Database
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map<string, any>(dbProducts.map((p: any) => [String(p._id), p]));

    let calculatedSubtotalCents = 0;
    const stripeLineItems: any[] = [];
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
          return NextResponse.json(
            { success: false, message: `Selected variant for "${dbProd.name}" is no longer available.` },
            { status: 400 }
          );
        }
        unitPrice = variant.price;
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitCents = toCents(unitPrice);
      calculatedSubtotalCents += unitCents * qty;

      // Attach item metadata per ACT-02 to bypass session-level 500-char limits
      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: unitCents,
          product_data: {
            name: variantName ? `${dbProd.name} (${variantName})` : dbProd.name,
            images: dbProd.image ? [dbProd.image.startsWith('http') ? dbProd.image : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://indian-flowers.com'}${dbProd.image}`] : [],
            metadata: {
              productId: String(dbProd._id),
              variantName: String(variantName || ''),
            },
          },
        },
        quantity: qty,
      });

      taxItems.push({
        productId: String(dbProd._id),
        name: variantName ? `${dbProd.name} (${variantName})` : dbProd.name,
        quantity: qty,
        unitPrice,
        lineSubtotal: unitPrice * qty,
        isTaxable: dbProd.isTaxable !== false,
        taxCode: dbProd.taxCode || '',
      });
    }

    const subtotalUSD = fromCents(calculatedSubtotalCents);
    const finalCustomerId = String(authenticatedCustomer._id);

    // 4. Loyalty Points Redemption Calculation
    const loyaltyConfig = await getLoyaltyConfig();
    let pointsToRedeem = 0;
    let pointsDiscountUSD = 0;

    if (finalCustomerId && Number(redeemPoints) > 0) {
      const availablePoints = authenticatedCustomer.pointsBalance || 0;
      const requestedPoints = Math.min(Math.floor(Number(redeemPoints)), availablePoints);

      if (requestedPoints > 0) {
        const loyaltyCalc = calculatePointsDiscount(requestedPoints, subtotalUSD, loyaltyConfig);
        if (loyaltyCalc.isValid && loyaltyCalc.discountAmount > 0) {
          pointsToRedeem = loyaltyCalc.pointsUsed;
          pointsDiscountUSD = loyaltyCalc.discountAmount;
        }
      }
    }

    const pointsDiscountCents = Math.min(
      toCents(pointsDiscountUSD),
      calculatedSubtotalCents
    );

    // 5. Authoritative US Sales Tax Calculation
    const taxResult = await calculateSalesTax({
      shippingAddress: {
        streetAddress: (streetAddress || '').trim(),
        aptSuite: (aptSuite || '').trim(),
        city: (city || '').trim(),
        state: (state || '').trim().toUpperCase(),
        zipCode: (zipCode || '').trim(),
        country: 'US',
      },
      items: taxItems,
      shippingFee: Number(shippingFee) || 0,
      discountAmount: fromCents(pointsDiscountCents),
    });

    const taxAmountUSD = taxResult.taxAmount || 0;
    const taxAmountCents = toCents(taxAmountUSD);
    const shippingFeeCents = toCents(Number(shippingFee) || 0);

    // Add Shipping Fee Line Item
    if (shippingFeeCents > 0) {
      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: shippingFeeCents,
          product_data: {
            name: deliveryMode?.name ? `Shipping: ${deliveryMode.name}` : 'Standard Shipping Fee',
            metadata: {
              deliveryModeId: String(deliveryMode?.id || ''),
              type: 'shipping_fee',
            },
          },
        },
        quantity: 1,
      });
    }

    // Add Sales Tax Line Item
    if (taxAmountCents > 0) {
      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: taxAmountCents,
          product_data: {
            name: `US Sales Tax (${state?.trim().toUpperCase() || 'State'})`,
            metadata: {
              type: 'sales_tax',
            },
          },
        },
        quantity: 1,
      });
    }

    // 6. Handle Loyalty Points Discount via Single-Use Coupon (ACT-03)
    let discountsArray: any[] | undefined = undefined;
    if (pointsDiscountCents > 0) {
      const ephemeralCoupon = await stripe.coupons.create({
        amount_off: pointsDiscountCents,
        currency: 'usd',
        duration: 'once',
        name: `Redeemed ${pointsToRedeem} Loyalty Points`,
      });
      discountsArray = [{ coupon: ephemeralCoupon.id }];
    }

    // 7. Base URLs
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://indian-flowers.com';

    // 8. Create Stripe Hosted Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: stripeLineItems,
      discounts: discountsArray,
      customer_email: (customerEmail || authenticatedCustomer.email || '').trim(),
      client_reference_id: finalCustomerId,
      metadata: {
        customerId: finalCustomerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: (customerEmail || authenticatedCustomer.email || '').trim(),
        streetAddress: (streetAddress || '').trim(),
        aptSuite: (aptSuite || '').trim(),
        city: (city || '').trim(),
        district: (district || '').trim(),
        state: (state || '').trim().toUpperCase(),
        zipCode: (zipCode || '').trim(),
        deliveryDate: (deliveryDate || '').trim(),
        acknowledgedDeliveryTimeframe: acknowledgedDeliveryTimeframe ? 'true' : 'false',
        deliveryModeId: String(deliveryMode?.id || ''),
        deliveryModeName: String(deliveryMode?.name || ''),
        shippingFeeCents: String(shippingFeeCents),
        taxAmountCents: String(taxAmountCents),
        pointsRedeemed: String(pointsToRedeem),
        pointsDiscountCents: String(pointsDiscountCents),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout_cancelled=1&drawer=open`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[Stripe Create Session Error]:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Unable to initialize Stripe checkout session. Please try again.',
      },
      { status: 500 }
    );
  }
}
