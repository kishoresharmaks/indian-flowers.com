import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && !isAuthenticatedAdmin(request)) {
      return unauthenticatedResponse();
    }

    await connectToDatabase();

    // Aggregate counts of SEO landing products by normalized image path
    const counts = await Product.aggregate([
      {
        $match: {
          $or: [{ isSeoLanding: true }, { hideFromHome: true }]
        }
      },
      {
        $project: {
          normImage: { $toLower: { $trim: { input: '$image' } } }
        }
      },
      {
        $group: {
          _id: '$normImage',
          count: { $sum: 1 }
        }
      }
    ]);

    const imageCountMap: Record<string, number> = {};
    counts.forEach((c) => {
      if (c._id) {
        imageCountMap[c._id] = c.count;
      }
    });

    return NextResponse.json({
      success: true,
      totalSeoProducts: counts.reduce((acc, c) => acc + c.count, 0),
      counts: imageCountMap
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch SEO page counts' },
      { status: 500 }
    );
  }
}
