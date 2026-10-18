import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { getCustomerFromToken } from '@/lib/customerAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = getCustomerFromToken(request);
    if (!session || !session.customerId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to view orders.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const orders = await Order.find({
      $or: [
        { customerId: session.customerId },
        { customerEmail: session.email.toLowerCase() },
      ],
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch customer orders' },
      { status: 500 }
    );
  }
}
