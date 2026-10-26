import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import Party from '@/models/Party';
import { verifyGoogleIdToken } from '@/lib/googleAuth';
import { signCustomerToken, setCustomerSessionCookie } from '@/lib/customerAuth';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

// In-memory sliding-window rate limiter per client IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: Request) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    'anonymous';

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { success: false, message: 'Too many authentication attempts. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { credential } = body;

    if (!credential || typeof credential !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Google credential token is required.' },
        { status: 400 }
      );
    }

    // 1. Cryptographically verify Google ID Token
    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(credential);
    } catch (verifyErr: any) {
      return NextResponse.json(
        { success: false, message: verifyErr.message || 'Google authentication failed. Please try again.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 2. Account Resolution Matrix
    // Step A: Search by verified, immutable googleId (sub)
    let customer = await Customer.findOne({ googleId: googleUser.sub });

    if (customer) {
      if (customer.isActive === false) {
        return NextResponse.json(
          { success: false, message: 'Your customer account is currently inactive. Please contact support.' },
          { status: 403 }
        );
      }

      // Sync avatar if missing
      if (!customer.avatar && googleUser.avatar) {
        customer.avatar = googleUser.avatar;
        await customer.save();
      }

      const token = signCustomerToken({
        id: String(customer._id),
        email: customer.email,
        name: customer.name,
      });

      const safeCustomer = {
        id: String(customer._id),
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        aptSuite: customer.aptSuite || '',
        city: customer.city || '',
        district: customer.district || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        country: customer.country || 'US',
        avatar: customer.avatar || '',
      };

      const response = NextResponse.json({
        success: true,
        message: 'Signed in successfully with Google!',
        customer: safeCustomer,
      });

      setCustomerSessionCookie(response, token);

      await captureServerEvent(
        request,
        'customer_logged_in_google',
        { customer_id: safeCustomer.id },
        `customer:${safeCustomer.id}`
      );

      return response;
    }

    // Step B: Search by email to prevent account takeover
    const existingByEmail = await Customer.findOne({ email: googleUser.email });

    if (existingByEmail) {
      if (existingByEmail.isActive === false) {
        return NextResponse.json(
          { success: false, message: 'An account with this email exists but is inactive. Please contact support.' },
          { status: 403 }
        );
      }

      // Existing email/password customer — require explicit password verification before linking
      return NextResponse.json(
        {
          success: false,
          requirePasswordLink: true,
          email: googleUser.email,
          message:
            'An existing account was found for this email address. Please enter your account password to securely link Google Sign-In.',
        },
        { status: 409 }
      );
    }

    // Step C: Create new Google customer (Zero friction, 1-click)
    const newCustomer = await Customer.create({
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.sub,
      avatar: googleUser.avatar,
      authProvider: 'google',
      isActive: true,
      role: 'CUSTOMER',
      phone: '',
      passwordHash: '',
      address: '',
      aptSuite: '',
      city: '',
      district: '',
      state: '',
      zipCode: '',
      country: 'US',
    });

    // Idempotent Party Directory synchronization (keyed on email since phone may not be known yet)
    try {
      await Party.findOneAndUpdate(
        { email: googleUser.email },
        {
          $setOnInsert: { partyType: 'CUSTOMER', openingBalance: 0, currentBalance: 0 },
          $set: {
            name: newCustomer.name,
            email: googleUser.email,
            phone: '0000000000',
            address: '',
          },
        },
        { upsert: true, new: true }
      );
    } catch (partyErr) {
      console.warn('Party sync warning during Google customer creation:', partyErr);
    }

    const token = signCustomerToken({
      id: String(newCustomer._id),
      email: newCustomer.email,
      name: newCustomer.name,
    });

    const safeCustomer = {
      id: String(newCustomer._id),
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone || '',
      address: newCustomer.address || '',
      aptSuite: newCustomer.aptSuite || '',
      city: newCustomer.city || '',
      district: newCustomer.district || '',
      state: newCustomer.state || '',
      zipCode: newCustomer.zipCode || '',
      country: newCustomer.country || 'US',
      avatar: newCustomer.avatar || '',
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Welcome to The Indian Flowers! Your account was created with Google.',
        customer: safeCustomer,
      },
      { status: 201 }
    );

    setCustomerSessionCookie(response, token);

    await captureServerEvent(
      request,
      'customer_registered_google',
      { customer_id: safeCustomer.id },
      `customer:${safeCustomer.id}`
    );

    return response;
  } catch (error: any) {
    await captureServerException(request, error, 'customer-google-auth');
    return NextResponse.json(
      { success: false, message: 'Google authentication service encountered an error. Please try again.' },
      { status: 500 }
    );
  }
}
