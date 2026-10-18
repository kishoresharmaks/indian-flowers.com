import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import Order from '@/models/Order';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    // Fetch all registered customers
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();

    // Fetch all storefront orders to link order history
    const allOrders = await Order.find().sort({ createdAt: -1 }).lean();

    // Map customers with comprehensive stats & order histories
    const customersWithOrders = customers.map((c: any) => {
      const custId = c._id ? c._id.toString() : '';
      const custEmail = (c.email || '').toLowerCase().trim();
      const custPhone = (c.phone || '').replace(/\D/g, '');

      // Match orders linked by customerId or matching customerEmail/phone
      const userOrders = allOrders.filter((ord: any) => {
        if (ord.customerId && ord.customerId.toString() === custId) return true;
        if (ord.customerEmail && ord.customerEmail.toLowerCase().trim() === custEmail) return true;
        if (custPhone && ord.customerPhone && ord.customerPhone.replace(/\D/g, '') === custPhone) return true;
        return false;
      });

      const totalSpent = userOrders.reduce((sum: number, ord: any) => {
        if (ord.status === 'CANCELLED') return sum;
        return sum + (Number(ord.totalAmount) || 0);
      }, 0);

      const lastOrderDate = userOrders.length > 0 ? userOrders[0].createdAt : null;

      return {
        _id: custId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address || '',
        aptSuite: c.aptSuite || '',
        city: c.city || '',
        district: c.district || '',
        state: c.state || '',
        zipCode: c.zipCode || '',
        country: c.country || 'US',
        isActive: c.isActive !== false,
        role: c.role || 'CUSTOMER',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        totalOrders: userOrders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastOrderDate,
        orders: userOrders.map((ord: any) => ({
          _id: ord._id?.toString() || ord.orderId,
          orderId: ord.orderId,
          createdAt: ord.createdAt,
          totalAmount: ord.totalAmount,
          deliveryCharge: ord.deliveryCharge || 0,
          status: ord.status,
          paymentMethod: ord.paymentMethod,
          paymentStatus: ord.paymentStatus,
          deliveryAddress: ord.deliveryAddress || ord.streetAddress || '',
          district: ord.district || '',
          customerName: ord.customerName,
          customerPhone: ord.customerPhone,
          customerEmail: ord.customerEmail,
          items: Array.isArray(ord.items)
            ? ord.items.map((it: any) => ({
                productId: it.productId,
                name: it.name || it.title || 'Floral Item',
                price: Number(it.price) || 0,
                quantity: Number(it.quantity) || 1,
                image: it.image || '',
              }))
            : [],
        })),
      };
    });

    // Apply optional server-side search filter
    const filtered = search
      ? customersWithOrders.filter((c) => {
          const haystack = `${c.name} ${c.email} ${c.phone} ${c.city} ${c.district} ${c.state} ${c.zipCode}`.toLowerCase();
          return haystack.includes(search);
        })
      : customersWithOrders;

    const totalCustomersCount = customersWithOrders.length;
    const activeCount = customersWithOrders.filter((c) => c.isActive).length;
    const totalCustomerOrders = customersWithOrders.reduce((sum, c) => sum + c.totalOrders, 0);
    const totalCustomerRevenue = Math.round(customersWithOrders.reduce((sum, c) => sum + c.totalSpent, 0) * 100) / 100;

    return NextResponse.json({
      success: true,
      data: filtered,
      stats: {
        totalCustomers: totalCustomersCount,
        activeCustomers: activeCount,
        totalOrders: totalCustomerOrders,
        totalRevenue: totalCustomerRevenue,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin customers:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch customer data.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const { customerId, isActive, name, phone, address, aptSuite, city, district, state, zipCode } = body;

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Customer ID is required.' }, { status: 400 });
    }

    const updateFields: any = {};
    if (typeof isActive === 'boolean') updateFields.isActive = isActive;
    if (name) updateFields.name = name.trim();
    if (phone) updateFields.phone = phone.trim();
    if (address !== undefined) updateFields.address = address.trim();
    if (aptSuite !== undefined) updateFields.aptSuite = aptSuite.trim();
    if (city !== undefined) updateFields.city = city.trim();
    if (district !== undefined) updateFields.district = district.trim();
    if (state !== undefined) updateFields.state = state.trim();
    if (zipCode !== undefined) updateFields.zipCode = zipCode.trim();

    const updated = await Customer.findByIdAndUpdate(customerId, updateFields, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully.',
      customer: updated,
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update customer.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Customer ID required.' }, { status: 400 });
    }

    const deleted = await Customer.findByIdAndDelete(customerId);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Customer account deleted.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
