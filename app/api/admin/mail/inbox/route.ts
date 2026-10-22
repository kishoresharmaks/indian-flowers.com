import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import CustomOrder from '@/models/CustomOrder';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export interface UnifiedInboxItem {
  id: string;
  source: 'CONTACT_FORM' | 'CUSTOM_ORDER';
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subject: string;
  message: string;
  eventDate?: string;
  extraDetails?: Record<string, any>;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  createdAt: string;
}

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const source = searchParams.get('source')?.trim() || 'ALL'; // ALL, CONTACT_FORM, CUSTOM_ORDER
    const status = searchParams.get('status')?.trim() || 'ALL'; // ALL, NEW, IN_PROGRESS, RESOLVED, ARCHIVED

    // 1. Fetch Contact Messages
    const contactMessages = await ContactMessage.find().sort({ createdAt: -1 }).lean();

    // 2. Fetch Custom Orders (Floral Inquiries)
    const customOrders = await CustomOrder.find().sort({ createdAt: -1 }).lean();

    // Transform into unified structure
    const unifiedItems: UnifiedInboxItem[] = [];

    contactMessages.forEach((msg: any) => {
      unifiedItems.push({
        id: String(msg._id),
        source: 'CONTACT_FORM',
        referenceId: msg.referenceId,
        customerName: msg.name,
        customerEmail: msg.email,
        customerPhone: msg.phone,
        subject: msg.subject,
        message: msg.message,
        eventDate: msg.eventDate || '',
        status: (msg.status === 'NEW' ? 'NEW' : msg.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'RESOLVED') as any,
        createdAt: new Date(msg.createdAt).toISOString(),
      });
    });

    customOrders.forEach((co: any) => {
      // Map custom order status: 'PENDING' -> 'NEW', 'REVIEWED' -> 'IN_PROGRESS', 'CONFIRMED' -> 'RESOLVED'
      let mappedStatus: UnifiedInboxItem['status'] = 'NEW';
      if (co.status === 'PENDING') mappedStatus = 'NEW';
      else if (co.status === 'REVIEWED') mappedStatus = 'IN_PROGRESS';
      else if (co.status === 'CONFIRMED' || co.status === 'COMPLETED') mappedStatus = 'RESOLVED';
      else if (co.status === 'CANCELLED') mappedStatus = 'ARCHIVED';

      unifiedItems.push({
        id: String(co._id),
        source: 'CUSTOM_ORDER',
        referenceId: co.inquiryId,
        customerName: co.customerName,
        customerEmail: co.customerEmail,
        customerPhone: co.customerPhone,
        subject: `Custom Floral Request: ${co.occasion}`,
        message: co.requirements,
        eventDate: co.eventDate || '',
        extraDetails: {
          occasion: co.occasion,
          cityState: co.cityState,
          budget: co.budget,
          nativeStatus: co.status,
        },
        status: mappedStatus,
        createdAt: new Date(co.createdAt).toISOString(),
      });
    });

    // Sort combined by descending createdAt
    unifiedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply filtering
    let filtered = unifiedItems;

    if (source !== 'ALL') {
      filtered = filtered.filter((item) => item.source === source);
    }

    if (status !== 'ALL') {
      filtered = filtered.filter((item) => item.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.customerName?.toLowerCase().includes(search) ||
          item.customerEmail?.toLowerCase().includes(search) ||
          item.customerPhone?.toLowerCase().includes(search) ||
          item.referenceId?.toLowerCase().includes(search) ||
          item.subject?.toLowerCase().includes(search) ||
          item.message?.toLowerCase().includes(search)
      );
    }

    // Stats
    const totalNew = unifiedItems.filter((i) => i.status === 'NEW').length;
    const totalInProgress = unifiedItems.filter((i) => i.status === 'IN_PROGRESS').length;
    const totalResolved = unifiedItems.filter((i) => i.status === 'RESOLVED').length;

    return NextResponse.json({
      success: true,
      data: filtered,
      stats: {
        totalAll: unifiedItems.length,
        new: totalNew,
        inProgress: totalInProgress,
        resolved: totalResolved,
      },
    });
  } catch (error: any) {
    console.error('[API Admin Mail Inbox GET] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch inbox messages' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, source, status } = body;

    if (!id || !source || !status) {
      return NextResponse.json({ success: false, message: 'Missing id, source, or status' }, { status: 400 });
    }

    if (source === 'CONTACT_FORM') {
      await ContactMessage.findByIdAndUpdate(id, { $set: { status } });
    } else if (source === 'CUSTOM_ORDER') {
      // Map inbox status back to custom order status
      let nativeStatus = 'PENDING';
      if (status === 'NEW') nativeStatus = 'PENDING';
      else if (status === 'IN_PROGRESS') nativeStatus = 'REVIEWED';
      else if (status === 'RESOLVED') nativeStatus = 'CONFIRMED';
      else if (status === 'ARCHIVED') nativeStatus = 'CANCELLED';

      await CustomOrder.findByIdAndUpdate(id, { $set: { status: nativeStatus } });
    }

    return NextResponse.json({ success: true, message: 'Status updated successfully' });
  } catch (error: any) {
    console.error('[API Admin Mail Inbox PATCH] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update message status' },
      { status: 500 }
    );
  }
}
