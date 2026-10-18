import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import { getCustomerFromToken } from '@/lib/customerAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = getCustomerFromToken(request);
    if (!session || !session.customerId) {
      return NextResponse.json({ success: false, customer: null }, { status: 200 });
    }

    await connectToDatabase();
    const customer = await Customer.findById(session.customerId).lean();
    if (!customer || customer.isActive === false) {
      return NextResponse.json({ success: false, customer: null }, { status: 200 });
    }

    const { getLoyaltyConfig } = await import('@/lib/loyalty/loyaltyEngine');
    const loyaltyConfig = await getLoyaltyConfig();

    const safeCustomer = {
      id: String(customer._id),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      aptSuite: customer.aptSuite || '',
      city: customer.city,
      district: customer.district || '',
      state: customer.state,
      zipCode: customer.zipCode,
      country: customer.country || 'US',
      pointsBalance: customer.pointsBalance || 0,
      totalPointsEarned: customer.totalPointsEarned || 0,
      totalPointsRedeemed: customer.totalPointsRedeemed || 0,
      pointsHistory: Array.isArray(customer.pointsHistory) ? customer.pointsHistory : [],
      createdAt: customer.createdAt,
    };

    return NextResponse.json({
      success: true,
      customer: safeCustomer,
      loyaltyConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, customer: null }, { status: 200 });
  }
}
