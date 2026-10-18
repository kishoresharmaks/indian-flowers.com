import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import Party from '@/models/Party';
import { getCustomerFromToken } from '@/lib/customerAuth';
import {
  validateCustomerName,
  validateCustomerPhone,
  validateStreetAddress,
  validateCity,
  validateDistrict,
  validateState,
  validateZipCode,
} from '@/lib/checkoutValidation';
import { normalizeStateCode, formatUSZip } from '@/lib/tax/jurisdiction';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const session = getCustomerFromToken(request);
    if (!session || !session.customerId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const customer = await Customer.findById(session.customerId);
    if (!customer || customer.isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Customer account not found or disabled.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, phone, address, aptSuite = '', city, district = '', state, zipCode } = body;

    const errors: Record<string, string> = {};

    const nameErr = validateCustomerName(name);
    if (nameErr) errors.name = nameErr;

    const phoneErr = validateCustomerPhone(phone);
    if (phoneErr) errors.phone = phoneErr;

    const addrErr = validateStreetAddress(address);
    if (addrErr) errors.address = addrErr;

    const cityErr = validateCity(city);
    if (cityErr) errors.city = cityErr;

    if (district !== undefined && district !== '') {
      const distErr = validateDistrict(district);
      if (distErr) errors.district = distErr;
    }

    const stateErr = validateState(state);
    if (stateErr) errors.state = stateErr;

    const zipErr = validateZipCode(zipCode);
    if (zipErr) errors.zipCode = zipErr;

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: Object.values(errors)[0] || 'Please fix highlighted errors.',
          errors,
        },
        { status: 400 }
      );
    }

    const cleanState = normalizeStateCode(state) || String(state).trim().toUpperCase();
    const cleanZip = formatUSZip(zipCode);

    customer.name = String(name).trim();
    customer.phone = String(phone).trim();
    customer.address = String(address).trim();
    customer.aptSuite = String(aptSuite || '').trim();
    customer.city = String(city).trim();
    customer.district = String(district || '').trim();
    customer.state = cleanState;
    customer.zipCode = cleanZip;

    await customer.save();

    // Sync Party
    try {
      const fullShippingAddress = `${customer.address}${
        customer.aptSuite ? ', ' + customer.aptSuite : ''
      }, ${customer.city}, ${customer.state} ${customer.zipCode}`;

      await Party.findOneAndUpdate(
        { phone: customer.phone },
        {
          $set: {
            name: customer.name,
            address: fullShippingAddress,
          },
        }
      );
    } catch (partyErr) {
      console.warn('Failed to update party from profile update:', partyErr);
    }

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

    await captureServerEvent(request, 'customer_profile_updated', {
      customer_id: safeCustomer.id,
    }, `customer:${safeCustomer.id}`);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      customer: safeCustomer,
    });
  } catch (error: any) {
    await captureServerException(request, error, 'customer-profile-update');
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
