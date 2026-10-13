import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, message: 'Phone number, email, or order ID is required to track order' },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();

    const orders = await Order.find({
      $or: [
        { customerPhone: { $regex: cleanQuery, $options: 'i' } },
        { customerEmail: { $regex: cleanQuery, $options: 'i' } },
        { orderId: { $regex: cleanQuery, $options: 'i' } },
      ],
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to track order' },
      { status: 500 }
    );
  }
}
