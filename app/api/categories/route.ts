import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({}).sort({ order: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, count: categories.length, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, image, order } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      if (image || order !== undefined) {
        if (image) existing.image = image;
        if (order !== undefined) existing.order = order;
        await existing.save();
      }
      return NextResponse.json(
        { success: true, message: 'Category updated', data: existing },
        { status: 200 }
      );
    }

    const category = await Category.create({
      name: name.trim(),
      image: image || '',
      order: order || 0,
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
