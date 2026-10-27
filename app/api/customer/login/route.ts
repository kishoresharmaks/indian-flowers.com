import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import { signCustomerToken, setCustomerSessionCookie } from '@/lib/customerAuth';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = checkRateLimit(`customer-login:${ip}`, 5, 60 * 1000);
    if (!allowed) {
      return rateLimitResponse(retryAfterSeconds);
    }

    await connectToDatabase();
    const body = await request.json();
    const { email, password } = body;

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail || typeof password !== 'string' || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email address and password.' },
        { status: 400 }
      );
    }

    const customer = await Customer.findOne({ email: cleanEmail }).select('+passwordHash');
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address or password.' },
        { status: 401 }
      );
    }

    if (customer.isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Your customer account is currently inactive. Please contact customer support.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, customer.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address or password.' },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = signCustomerToken({
      id: String(customer._id),
      email: customer.email,
      name: customer.name,
    });

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
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Signed in successfully. Welcome back!',
        customer: safeCustomer,
      },
      { status: 200 }
    );

    setCustomerSessionCookie(response, token);

    await captureServerEvent(request, 'customer_logged_in', {
      customer_id: safeCustomer.id,
    }, `customer:${safeCustomer.id}`);

    return response;
  } catch (error: any) {
    await captureServerException(request, error, 'customer-login');
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
