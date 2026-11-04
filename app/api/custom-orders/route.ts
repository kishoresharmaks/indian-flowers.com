import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CustomOrder from '@/models/CustomOrder';
import SaleDocument from '@/models/SaleDocument';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { sendFloralInquiryConfirmationEmail } from '@/lib/msg91';
import { isBeforeMinDeliveryDate, MIN_DELIVERY_LEAD_DAYS } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const rawOrders = await CustomOrder.find({}).sort({ createdAt: -1 }).lean();

    // Check if any custom order has an unlinked bill in SaleDocument, and auto-sync
    const orders = await Promise.all(
      rawOrders.map(async (ord: any) => {
        if ((!ord.invoiceNumber || !ord.invoiceId) && ord.inquiryId) {
          try {
            const matchedSale = await SaleDocument.findOne({
              notes: new RegExp(ord.inquiryId, 'i'),
            })
              .select('_id docNumber')
              .lean();
            if (matchedSale) {
              await CustomOrder.updateOne(
                { _id: ord._id },
                { $set: { invoiceId: String(matchedSale._id), invoiceNumber: matchedSale.docNumber } }
              );
              return {
                ...ord,
                invoiceId: String(matchedSale._id),
                invoiceNumber: matchedSale.docNumber,
              };
            }
          } catch {
            // Silent lookup fallback
          }
        }
        return ord;
      })
    );

    return NextResponse.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch custom orders' },
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
      customerEmail,
      customerPhone,
      productId,
      productCode,
      productTitle,
      variantName,
      quantity,
      address,
      size,
      preferredColor,
      deliveryDate,
      // Legacy fields
      cityState,
      eventDate,
      occasion,
      requirements,
      budget,
    } = body;

    const isProductCustomOrder = Boolean(productCode || productTitle);

    if (isProductCustomOrder) {
      // Validate Product Custom Order fields
      if (!customerPhone || !customerPhone.trim()) {
        return NextResponse.json(
          { success: false, message: 'Please provide a valid contact phone number.' },
          { status: 400 }
        );
      }

      if (!address || !address.trim()) {
        return NextResponse.json(
          { success: false, message: 'Please provide your full delivery address.' },
          { status: 400 }
        );
      }

      const orderDeliveryDate = (deliveryDate || eventDate || '').trim();
      if (!orderDeliveryDate) {
        return NextResponse.json(
          { success: false, message: 'Please select a preferred date of delivery.' },
          { status: 400 }
        );
      }

      // Check 10-day lock-in period
      if (isBeforeMinDeliveryDate(orderDeliveryDate, MIN_DELIVERY_LEAD_DAYS)) {
        return NextResponse.json(
          {
            success: false,
            message: `Delivery date must be at least ${MIN_DELIVERY_LEAD_DAYS} days in advance for custom fresh preparation. For urgent deliveries, please call +1 909-379-3678.`,
          },
          { status: 400 }
        );
      }

      const count = await CustomOrder.countDocuments();
      let inquiryId = `CST-${1001 + count}`;
      const existing = await CustomOrder.exists({ inquiryId });
      if (existing) {
        inquiryId = `CST-${1001 + count}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const finalTitle = (productTitle || productCode || 'Custom Floral Item').trim();
      const finalQuantity = Math.max(1, Number(quantity) || 1);

      const newCustomOrder = await CustomOrder.create({
        inquiryId,
        customerName: (customerName || 'Valued Customer').trim(),
        customerEmail: (customerEmail || '').trim(),
        customerPhone: customerPhone.trim(),
        productId: (productId || '').trim(),
        productCode: (productCode || '').trim(),
        productTitle: finalTitle,
        variantName: (variantName || '').trim(),
        quantity: finalQuantity,
        address: address.trim(),
        size: (size || '').trim(),
        preferredColor: (preferredColor || '').trim(),
        deliveryDate: orderDeliveryDate,
        cityState: (cityState || address).trim(),
        eventDate: orderDeliveryDate,
        occasion: (occasion || `Custom Order: ${finalTitle}`).trim(),
        requirements: (
          requirements ||
          `Custom order for ${finalTitle} (Qty: ${finalQuantity}). Size: ${size || 'Standard'}, Color: ${preferredColor || 'As pictured'}`
        ).trim(),
        budget: budget ? String(budget).trim() : '',
        status: 'NEW',
      });

      // Automated email confirmation if email provided
      if (newCustomOrder.customerEmail) {
        try {
          await sendFloralInquiryConfirmationEmail({
            customerName: newCustomOrder.customerName,
            customerEmail: newCustomOrder.customerEmail,
            customerPhone: newCustomOrder.customerPhone,
            cityState: newCustomOrder.cityState || newCustomOrder.address,
            eventDate: newCustomOrder.deliveryDate,
            occasion: newCustomOrder.occasion,
            requirements: `Product: ${newCustomOrder.productTitle} (Code: ${newCustomOrder.productCode || 'N/A'})\nQty: ${newCustomOrder.quantity}\nSize: ${newCustomOrder.size || 'Standard'}\nColor: ${newCustomOrder.preferredColor || 'Standard'}\nDelivery Address: ${newCustomOrder.address}`,
            budget: newCustomOrder.budget,
            inquiryId: newCustomOrder.inquiryId,
          });
        } catch (emailError) {
          console.warn('[CustomOrder] Email confirmation error:', emailError);
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Your custom order request has been received! We will contact you shortly with confirmation.',
          data: newCustomOrder,
        },
        { status: 201 }
      );
    }

    // Fallback: Legacy event inquiry form validation
    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !cityState ||
      !eventDate ||
      !occasion ||
      !requirements
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please fill in all required fields (Name, Email, Phone, City/State, Event Date, Occasion, and Requirements).',
        },
        { status: 400 }
      );
    }

    const count = await CustomOrder.countDocuments();
    let inquiryId = `CST-${1001 + count}`;
    const existing = await CustomOrder.exists({ inquiryId });
    if (existing) {
      inquiryId = `CST-${1001 + count}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const newCustomOrder = await CustomOrder.create({
      inquiryId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      cityState: cityState.trim(),
      address: cityState.trim(),
      eventDate: eventDate.trim(),
      deliveryDate: eventDate.trim(),
      occasion: occasion.trim(),
      requirements: requirements.trim(),
      budget: budget ? String(budget).trim() : '',
      status: 'NEW',
    });

    try {
      await sendFloralInquiryConfirmationEmail({
        customerName: newCustomOrder.customerName,
        customerEmail: newCustomOrder.customerEmail,
        customerPhone: newCustomOrder.customerPhone,
        cityState: newCustomOrder.cityState,
        eventDate: newCustomOrder.eventDate,
        occasion: newCustomOrder.occasion,
        requirements: newCustomOrder.requirements,
        budget: newCustomOrder.budget,
        inquiryId: newCustomOrder.inquiryId,
      });
    } catch (emailError) {
      console.warn('[CustomOrder] MSG91 email sending error:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your custom floral inquiry has been received! A confirmation has been sent to your email.',
        data: newCustomOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit custom order request' },
      { status: 500 }
    );
  }
}
