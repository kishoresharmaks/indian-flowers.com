import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Banner from '@/models/Banner';

export async function GET() {
  try {
    await connectToDatabase();
    try {
      await Banner.createIndexes();
    } catch (e) {}

    const banners = await Banner.find({ active: { $ne: false } })
      .sort({ order: 1, createdAt: -1 })
      .allowDiskUse(true)
      .lean();
    return NextResponse.json(
      { success: true, count: banners.length, data: banners },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { title, eyebrow, description, ctaText, image, link, badgeText, order } = body;

    if (!title || !image) {
      return NextResponse.json(
        { success: false, message: 'Banner title and image are required' },
        { status: 400 }
      );
    }

    const banner = await Banner.create({
      title,
      eyebrow: eyebrow || '',
      description: description || '',
      ctaText: ctaText || 'Shop Now',
      image,
      link: link || '',
      badgeText: badgeText || '',
      order: order || 0,
      active: true,
    });
    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create banner' },
      { status: 500 }
    );
  }
}
