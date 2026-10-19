import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Review from '@/models/Review';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export async function GET() {
  try {
    await connectToDatabase();
    try {
      await Review.createIndexes();
    } catch (e) {}

    const reviews = await Review.find({ featured: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const body = await request.json();
    const { customerName, location, comment, rating, avatar, productName } = body;

    if (!customerName || !comment) {
      return NextResponse.json(
        { success: false, message: 'Name and review comment are required' },
        { status: 400 }
      );
    }

    const review = await Review.create({
      customerName: customerName.trim(),
      location: location || 'USA',
      comment: comment.trim(),
      rating: rating || 5,
      avatar: avatar || '',
      productName: productName || '',
      featured: true,
    });

    return NextResponse.json(
      { success: true, message: 'Review submitted successfully', data: review },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
