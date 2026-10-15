import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Subscriber from '@/models/Subscriber';

export const dynamic = 'force-dynamic';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email format (e.g. name@example.com).' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if subscriber already exists
    const existing = await Subscriber.findOne({ email });

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({
          success: true,
          alreadySubscribed: true,
          message: 'You are already subscribed to Indian Flowers updates!',
        });
      } else {
        existing.status = 'active';
        await existing.save();
        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your newsletter subscription has been reactivated.',
        });
      }
    }

    // Create new subscriber
    const newSubscriber = await Subscriber.create({
      email,
      source: body?.source || 'storefront_newsletter',
      status: 'active',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for subscribing! You will receive exclusive floral deals and festival updates.',
        subscriber: {
          id: newSubscriber._id,
          email: newSubscriber.email,
          createdAt: newSubscriber.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Unable to subscribe at this moment. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve subscribers.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Subscriber ID is required.' },
        { status: 400 }
      );
    }
    await connectToDatabase();
    await Subscriber.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Subscriber removed.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to remove subscriber.' },
      { status: 500 }
    );
  }
}

