import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Banner from '@/models/Banner';
import Review from '@/models/Review';
import Settings from '@/models/Settings';
import {
  SEED_CATEGORIES,
  SEED_BANNERS,
  SEED_REVIEWS,
  SEED_PRODUCTS,
} from '@/lib/seedData';

export const dynamic = 'force-dynamic';

async function runSeed() {
  await connectToDatabase();

  // 1. Seed or Update Store Settings
  const settings = await Settings.findOneAndUpdate(
    { key: 'global' },
    {
      siteName: 'Indian-Flowers.com',
      tagline: 'Fresh Indian Flowers Delivered Across USA',
      businessName: 'Indian-Flowers.com',
      domain: 'indian-flowers.com',
      contactEmail: 'support@indian-flowers.com',
      contactPhone: '+1 (510) 579-5199',
      currency: 'USD',
      locale: 'en-US',
      timezone: 'America/New_York',
      enableCOD: true,
      enableRazorpay: true,
    },
    { upsert: true, new: true }
  );

  // 2. Clear old categories and seed the exact 4 categories
  await Category.deleteMany({});
  const categoryResults = await Category.insertMany(SEED_CATEGORIES);

  // 3. Clear old banners and seed the 3 hero sliders
  await Banner.deleteMany({});
  const bannerResults = await Banner.insertMany(SEED_BANNERS);

  // 4. Seed Reviews
  await Review.deleteMany({});
  const reviewResults = await Review.insertMany(SEED_REVIEWS);

  // 5. Clear old products and seed the exact 20 products (5 per category)
  await Product.deleteMany({});
  const productResults = await Product.insertMany(
    SEED_PRODUCTS.map(({ _id, ...rest }) => rest)
  );

  return {
    success: true,
    message: 'Database seeded successfully with 4 categories, 20 products, 3 sliders, and local images!',
    counts: {
      categories: categoryResults.length,
      banners: bannerResults.length,
      reviews: reviewResults.length,
      products: productResults.length,
    },
    settings: {
      siteName: settings.siteName,
      currency: settings.currency,
      phone: settings.contactPhone,
    },
  };
}

export async function POST() {
  try {
    const result = await runSeed();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await runSeed();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
