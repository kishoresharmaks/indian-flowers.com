import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import Party from '@/models/Party';
import { signCustomerToken, setCustomerSessionCookie } from '@/lib/customerAuth';
import { validateCustomerRegistration } from '@/lib/checkoutValidation';
import { normalizeStateCode, formatUSZip } from '@/lib/tax/jurisdiction';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      name,
      phone,
      email,
      address,
      aptSuite = '',
      city,
      district = '',
      state,
      zipCode,
      password,
      confirmPassword,
    } = body;

    // Validate registration payload against US standards
    const validation = validateCustomerRegistration({
      name,
      phone,
      email,
      address,
      aptSuite,
      city,
      district,
      state,
      zipCode,
      password,
      confirmPassword,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.firstErrorMessage || 'Please correct the highlighted form errors.',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    const cleanState = normalizeStateCode(state) || String(state).trim().toUpperCase();
    const cleanZip = formatUSZip(zipCode);

    // Check if customer already exists
    const existing = await Customer.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'An account with this email address already exists. Please sign in.',
          errors: { email: 'Email address is already registered.' },
        },
        { status: 409 }
      );
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create Customer
    const newCustomer = await Customer.create({
      name: String(name).trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      address: String(address).trim(),
      aptSuite: String(aptSuite || '').trim(),
      city: String(city).trim(),
      district: String(district || '').trim(),
      state: cleanState,
      zipCode: cleanZip,
      country: 'US',
      isActive: true,
      role: 'CUSTOMER',
    });

    // Auto-sync into Party directory for unified billing and accounting
    try {
      const fullShippingAddress = `${newCustomer.address}${
        newCustomer.aptSuite ? ', ' + newCustomer.aptSuite : ''
      }, ${newCustomer.city}, ${newCustomer.state} ${newCustomer.zipCode}`;

      await Party.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $setOnInsert: { partyType: 'CUSTOMER', openingBalance: 0, currentBalance: 0 },
          $set: {
            name: newCustomer.name,
            phone: cleanPhone,
            email: cleanEmail,
            address: fullShippingAddress,
          },
        },
        { upsert: true, new: true }
      );
    } catch (partyErr) {
      console.warn('Could not sync customer to Party directory:', partyErr);
    }

    // Sign JWT token
    const token = signCustomerToken({
      id: String(newCustomer._id),
      email: newCustomer.email,
      name: newCustomer.name,
    });

    const safeCustomer = {
      id: String(newCustomer._id),
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      aptSuite: newCustomer.aptSuite || '',
      city: newCustomer.city,
      district: newCustomer.district || '',
      state: newCustomer.state,
      zipCode: newCustomer.zipCode,
      country: newCustomer.country || 'US',
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Welcome to The Indian Flowers.',
        customer: safeCustomer,
      },
      { status: 201 }
    );

    setCustomerSessionCookie(response, token);

    await captureServerEvent(request, 'customer_registered', {
      customer_id: safeCustomer.id,
      state: safeCustomer.state,
    }, `customer:${safeCustomer.id}`);

    return response;
  } catch (error: any) {
    await captureServerException(request, error, 'customer-registration');
    return NextResponse.json(
      { success: false, message: error.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
