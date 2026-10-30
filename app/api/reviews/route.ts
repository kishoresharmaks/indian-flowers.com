import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Review from '@/models/Review';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { DEFAULT_CUSTOMER_REVIEWS } from '@/lib/defaultReviews';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    try {
      await Review.createIndexes();
    } catch (e) {}

    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';
    const filter = fetchAll && isAuthenticatedAdmin(request) ? {} : { featured: { $ne: false } };

    let reviews = await Review.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Auto-seed default reviews if database table is completely empty
    if ((!reviews || reviews.length === 0) && !fetchAll) {
      const totalInDb = await Review.countDocuments();
      if (totalInDb === 0) {
        try {
          await Review.insertMany(
            DEFAULT_CUSTOMER_REVIEWS.map((r, idx) => ({
              customerName: r.customerName,
              location: r.location,
              comment: r.comment,
              rating: r.rating,
              productName: r.productName,
              featured: true,
              order: idx + 1,
            }))
          );
          reviews = await Review.find({ featured: { $ne: false } })
            .sort({ order: 1, createdAt: -1 })
            .lean();
        } catch (seedErr) {
          console.warn('Could not auto-seed reviews:', seedErr);
        }
      }
      if (!reviews || reviews.length === 0) {
        return NextResponse.json({
          success: true,
          count: DEFAULT_CUSTOMER_REVIEWS.length,
          data: DEFAULT_CUSTOMER_REVIEWS,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reviews', data: DEFAULT_CUSTOMER_REVIEWS },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const body = await request.json();
    const { customerName, location, comment, rating, avatar, productName, featured, order } = body;

    if (!customerName || !comment) {
      return NextResponse.json(
        { success: false, message: 'Name and review comment are required' },
        { status: 400 }
      );
    }

    const review = await Review.create({
      customerName: customerName.trim(),
      location: location ? location.trim() : 'USA',
      comment: comment.trim(),
      rating: Number(rating) || 5,
      avatar: avatar || '',
      productName: productName ? productName.trim() : '',
      featured: featured !== false,
      order: Number(order) || 0,
    });

    return NextResponse.json(
      { success: true, message: 'Review created successfully', data: review },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
