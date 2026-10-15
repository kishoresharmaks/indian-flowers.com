import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CustomOrder from '@/models/CustomOrder';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const orders = await CustomOrder.find({}).sort({ createdAt: -1 });
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
      cityState,
      eventDate,
      occasion,
      requirements,
      budget,
    } = body;

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

    // Generate inquiry ID (e.g., CST-1001)
    const count = await CustomOrder.countDocuments();
    const inquiryId = `CST-${1001 + count}`;

    const newCustomOrder = await CustomOrder.create({
      inquiryId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      cityState: cityState.trim(),
      eventDate: eventDate.trim(),
      occasion: occasion.trim(),
      requirements: requirements.trim(),
      budget: budget ? String(budget).trim() : '',
      status: 'NEW',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your custom floral inquiry has been received! Our wedding & pooja specialist will contact you shortly.',
        data: newCustomOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit custom floral inquiry' },
      { status: 500 }
    );
  }
}
