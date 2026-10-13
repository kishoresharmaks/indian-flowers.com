import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CustomOrder from '@/models/CustomOrder';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await request.json();

    const allowedUpdates: any = {};
    if (body.status) allowedUpdates.status = body.status;
    if (body.adminNotes !== undefined) allowedUpdates.adminNotes = body.adminNotes;

    const updated = await CustomOrder.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Custom order inquiry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update custom order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    const deleted = await CustomOrder.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Custom order inquiry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete custom order' },
      { status: 500 }
    );
  }
}
