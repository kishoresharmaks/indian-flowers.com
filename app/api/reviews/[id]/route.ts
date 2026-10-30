import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Review from '@/models/Review';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const { id } = params;
    const body = await request.json();

    const updateFields: any = {};
    if (typeof body.customerName === 'string') updateFields.customerName = body.customerName.trim();
    if (typeof body.location === 'string') updateFields.location = body.location.trim();
    if (typeof body.comment === 'string') updateFields.comment = body.comment.trim();
    if (body.rating !== undefined) updateFields.rating = Math.max(1, Math.min(5, Number(body.rating) || 5));
    if (typeof body.productName === 'string') updateFields.productName = body.productName.trim();
    if (typeof body.avatar === 'string') updateFields.avatar = body.avatar.trim();
    if (typeof body.featured === 'boolean') updateFields.featured = body.featured;
    if (body.order !== undefined) updateFields.order = Number(body.order) || 0;

    let updated = null;
    if (mongoose.isValidObjectId(id)) {
      updated = await Review.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update review' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const { id } = params;

    let deleted = null;
    if (mongoose.isValidObjectId(id)) {
      deleted = await Review.findByIdAndDelete(id);
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete review' },
      { status: 500 }
    );
  }
}
