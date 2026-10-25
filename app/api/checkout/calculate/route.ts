import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import { calculateSalesTax } from '@/lib/tax';
import { toCents, fromCents } from '@/lib/tax/taxProvider';
import { getFedExRates } from '@/lib/shipping/fedexClient';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      shippingAddress,
      items,
      shippingFee = 0,
      deliveryModeId,
      deliveryMode,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cart items are required for checkout calculation.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Product Validation from Database
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map<string, any>(dbProducts.map((p: any) => [String(p._id), p]));

    const verifiedItems: any[] = [];
    let calculatedSubtotalCents = 0;

    for (const item of items) {
      const dbProduct = productMap.get(String(item.productId));
      const qty = Math.max(1, Number(item.quantity) || 1);

      if (!dbProduct) {
        return NextResponse.json(
          { success: false, message: `Product ${item.productId || item.name || ''} no longer exists.` },
          { status: 400 }
        );
      }

      // Price determination: check variant first, fallback to base price
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
      }

      const lineSubtotalCents = toCents(unitPrice) * qty;
      calculatedSubtotalCents += lineSubtotalCents;

      verifiedItems.push({
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

    const calculatedSubtotal = fromCents(calculatedSubtotalCents);
    const safeDiscountCents = 0; // Coupons are not implemented; never trust a client-supplied discount.
    const safeDiscount = fromCents(safeDiscountCents);

    // Dynamic Location-Based FedEx Shipping Calculation
    let fedexResult: any = null;
    let fedexError: string | null = null;
    const destZip = (shippingAddress?.zipCode || '').trim();
    const destState = (shippingAddress?.state || '').trim();
    const hasZip = Boolean(destZip && destZip.replace(/\D/g, '').length >= 5);

    if (hasZip) {
      try {
        const settings = await Settings.findOne({ key: 'global' }).lean();
        const customCreds = settings ? {
          accountNumber: settings.fedexAccountNumber,
          meterNumber: settings.fedexProductionMeterNumber,
          testMeterNumber: settings.fedexTestMeterNumber,
          authKey: settings.fedexAuthKey,
          secretKey: settings.fedexSecretKey,
          environment: settings.fedexEnvironment || 'production',
          originAddress: {
            street: settings.companyAddress || '14922 Bobcat lane',
            city: settings.companyCity || 'Fontana',
            state: settings.companyState || 'CA',
            zipCode: settings.fedexOriginZip || settings.companyZip || '92336',
            country: settings.companyCountry || 'US',
          },
        } : undefined;

        fedexResult = await getFedExRates(
          {
            destination: {
              streetAddress: shippingAddress?.streetAddress || '',
              city: shippingAddress?.city || '',
              state: destState,
              zipCode: destZip,
              country: shippingAddress?.country || 'US',
            },
            items: verifiedItems,
          },
          customCreds
        );
      } catch (err: any) {
        console.warn('FedEx rating calculation in checkout calculate failed:', err);
        fedexError = err?.message || 'Failed to fetch dynamic FedEx rates';
      }
    }

    // Determine authoritative shipping fee
    const activeDeliveryModeId = deliveryModeId || deliveryMode?.id || '';
    let effectiveShippingFee = Math.max(0, Number(shippingFee) || 0);

    if (activeDeliveryModeId === 'fedex-shipping') {
      if (hasZip && fedexResult?.recommendedRate) {
        effectiveShippingFee = fedexResult.recommendedRate.amount;
      } else if (hasZip && (!fedexResult || !fedexResult.success)) {
        // If there is failure in fetching dynamic pricing with entered ZIP, fallback to default stored in DB
        effectiveShippingFee = Math.max(0, Number(shippingFee) || 48.0);
      } else {
        // Do not charge or assume default FedEx pricing until ZIP code is entered
        effectiveShippingFee = 0;
      }
    }

    // Loyalty Points Redemption Evaluation
    const { getLoyaltyConfig, calculatePointsDiscount, calculatePointsEarned } = await import(
      '@/lib/loyalty/loyaltyEngine'
    );
    const loyaltyConfig = await getLoyaltyConfig();

    let pointsDiscount = 0;
    let actualPointsRedeemed = 0;

    if (body.redeemPoints && Number(body.redeemPoints) > 0) {
      let availablePoints = 0;
      const { getCustomerFromToken } = await import('@/lib/customerAuth');
      const customerSession = getCustomerFromToken(request as any);
      const effectiveCustId = customerSession?.customerId;
      if (effectiveCustId) {
        const CustomerModel = (await import('@/models/Customer')).default;
        const custDoc = await CustomerModel.findById(effectiveCustId).lean();
        if (custDoc) {
          availablePoints = custDoc.pointsBalance || 0;
        }
      }

      const pointsToRedeemAttempt = Math.min(Number(body.redeemPoints) || 0, availablePoints);
      const discountCalculation = calculatePointsDiscount(
        pointsToRedeemAttempt,
        calculatedSubtotal,
        loyaltyConfig
      );
      if (discountCalculation.isValid) {
        pointsDiscount = discountCalculation.discountAmount;
        actualPointsRedeemed = discountCalculation.pointsUsed;
      }
    }

    const totalDiscountCents = safeDiscountCents + toCents(pointsDiscount);
    const totalDiscount = fromCents(totalDiscountCents);

    // 2. Authoritative US Sales Tax Calculation
    const taxRequest = {
      shippingAddress: {
        streetAddress: shippingAddress?.streetAddress || '',
        aptSuite: shippingAddress?.aptSuite || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        zipCode: shippingAddress?.zipCode || '',
        country: shippingAddress?.country || 'US',
      },
      items: verifiedItems,
      discountAmount: totalDiscount,
      shippingFee: effectiveShippingFee,
    };

    const taxResult = await calculateSalesTax(taxRequest);

    const safeShippingFee = Math.max(0, effectiveShippingFee);
    const totalAmountCents =
      calculatedSubtotalCents - totalDiscountCents + toCents(taxResult.taxAmount) + toCents(safeShippingFee);
    const totalAmount = fromCents(Math.max(0, totalAmountCents));

    // Calculate estimated reward points customer will earn upon payment
    const estimatedPointsEarned = calculatePointsEarned(totalAmount, loyaltyConfig);

    return NextResponse.json({
      success: true,
      data: {
        subtotal: calculatedSubtotal,
        discountAmount: safeDiscount,
        pointsDiscount,
        pointsRedeemed: actualPointsRedeemed,
        estimatedPointsEarned,
        shippingFee: safeShippingFee,
        taxAmount: taxResult.taxAmount,
        totalAmount,
        taxSnapshot: taxResult,
        loyaltyConfig,
        fedexRates: fedexResult,
        fedexFetchFailed: hasZip && (!fedexResult || !fedexResult.success),
        hasZipEntered: hasZip,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to calculate checkout totals' },
      { status: 500 }
    );
  }
}
