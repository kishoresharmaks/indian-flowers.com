import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import { verifyGoogleIdToken } from '@/lib/googleAuth';
import { signCustomerToken, setCustomerSessionCookie } from '@/lib/customerAuth';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { credential, password } = body;

    if (!credential || typeof credential !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Both Google credential token and account password are required to link accounts.' },
        { status: 400 }
      );
    }

    // 1. Verify Google ID Token
    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(credential);
    } catch (verifyErr: any) {
      return NextResponse.json(
        { success: false, message: verifyErr.message || 'Google token verification failed.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 2. Fetch existing customer by verified email
    const customer = await Customer.findOne({ email: googleUser.email }).select('+passwordHash');
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'No customer account found with this email address.' },
        { status: 404 }
      );
    }

    if (customer.isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Your account is currently inactive. Please contact customer support.' },
        { status: 403 }
      );
    }

    // If already linked to another Google ID
    if (customer.googleId && customer.googleId !== googleUser.sub) {
      return NextResponse.json(
        { success: false, message: 'This account is already linked to another Google account. Please contact support.' },
        { status: 409 }
      );
    }

    // 3. Verify customer's current password
    if (!customer.passwordHash) {
      return NextResponse.json(
        { success: false, message: 'Account has no password configured. Please use your standard login method.' },
        { status: 400 }
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, customer.passwordHash);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password. Account linking failed. Please try again.' },
        { status: 401 }
      );
    }

    // 4. Securely link Google account
    customer.googleId = googleUser.sub;
    customer.authProvider = 'both';
    if (!customer.avatar && googleUser.avatar) {
      customer.avatar = googleUser.avatar;
    }
    await customer.save();

    // 5. Sign JWT & Set session cookie
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
      message: 'Google account linked successfully! Welcome back.',
      customer: safeCustomer,
    });

    setCustomerSessionCookie(response, token);

    await captureServerEvent(
      request,
      'customer_account_linked_google',
      { customer_id: safeCustomer.id },
      `customer:${safeCustomer.id}`
    );

    return response;
  } catch (error: any) {
    await captureServerException(request, error, 'customer-google-auth-link');
    return NextResponse.json(
      { success: false, message: 'Failed to link account. Please try again.' },
      { status: 500 }
    );
  }
}
