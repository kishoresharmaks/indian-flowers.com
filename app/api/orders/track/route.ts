import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { getCustomerFromToken } from '@/lib/customerAuth';

export async function GET(request: NextRequest) {
  try {
    const customer = getCustomerFromToken(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to track an order.' },
        { status: 401 }
      );
    }
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
    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const orders = await Order.find({
      $and: [
        {
          $or: [
            { customerId: customer.customerId },
            { customerEmail: customer.email.toLowerCase() },
          ],
        },
        {
          $or: [
            { customerPhone: { $regex: escapedQuery, $options: 'i' } },
            { customerEmail: { $regex: escapedQuery, $options: 'i' } },
            { orderId: { $regex: escapedQuery, $options: 'i' } },
          ],
        },
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
