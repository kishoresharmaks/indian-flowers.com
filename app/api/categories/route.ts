import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const showOnHome = searchParams.get('showOnHome');

    const filter: any = {};
    if (showOnHome === 'true') {
      filter.showOnHome = true;
    } else if (showOnHome === 'false') {
      filter.showOnHome = false;
    }

    const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, count: categories.length, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const { name, image, order, showOnHome, subcategories } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      if (image !== undefined) existing.image = image;
      if (order !== undefined) existing.order = order;
      if (showOnHome !== undefined) existing.showOnHome = Boolean(showOnHome);
      if (subcategories !== undefined) existing.subcategories = subcategories;
      await existing.save();
      return NextResponse.json(
        { success: true, message: 'Category updated', data: existing },
        { status: 200 }
      );
    }

    const category = await Category.create({
      name: name.trim(),
      image: image || '',
      order: order || 0,
      showOnHome: showOnHome !== undefined ? Boolean(showOnHome) : false,
      subcategories: Array.isArray(subcategories) ? subcategories : [],
    });
    return NextResponse.json(
      { success: true, message: 'Category created successfully', data: category },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
