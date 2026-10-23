import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const { id } = params;

    const body = await request.json();
    const { name, image, order } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Subcategory name is required' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    if (!Array.isArray(category.subcategories)) {
      category.subcategories = [];
    }

    const trimmedName = name.trim();
    const existingIndex = category.subcategories.findIndex(
      (sub: any) => sub.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing subcategory
      category.subcategories[existingIndex].name = trimmedName;
      if (image !== undefined) category.subcategories[existingIndex].image = image;
      if (order !== undefined) category.subcategories[existingIndex].order = order;
      category.subcategories[existingIndex].slug = slugify(trimmedName);
    } else {
      // Add new subcategory
      category.subcategories.push({
        name: trimmedName,
        slug: slugify(trimmedName),
        image: image || '',
        order: order !== undefined ? Number(order) : category.subcategories.length,
      });
    }

    await category.save();

    return NextResponse.json({
      success: true,
      message: 'Subcategory saved successfully',
      data: category,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save subcategory' },
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
    const { searchParams } = new URL(request.url);
    const subId = searchParams.get('subId');
    const subName = searchParams.get('name');

    if (!subId && !subName) {
      return NextResponse.json(
        { success: false, message: 'Subcategory subId or name is required' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    if (Array.isArray(category.subcategories)) {
      category.subcategories = category.subcategories.filter((sub: any) => {
        if (subId && sub._id && String(sub._id) === String(subId)) return false;
        if (subName && sub.name && sub.name.toLowerCase() === subName.trim().toLowerCase()) return false;
        return true;
      });
      await category.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Subcategory deleted successfully',
      data: category,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete subcategory' },
      { status: 500 }
    );
  }
}
