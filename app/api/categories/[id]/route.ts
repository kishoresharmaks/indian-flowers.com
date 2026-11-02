import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const { id } = params;

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      data: deleted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const { id } = params;
    const body = await request.json();
    const { name, slug, image, order, showOnHome, subcategories } = body;

    const existingCat = await Category.findById(id);
    if (!existingCat) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { success: false, message: 'Category name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    // Slug validation and uniqueness
    if (slug !== undefined) {
      const sanitizedSlug = slugify(slug);
      if (!sanitizedSlug) {
        return NextResponse.json(
          { success: false, message: 'Category slug cannot be empty' },
          { status: 400 }
        );
      }

      const conflict = await Category.findOne({
        slug: sanitizedSlug,
        _id: { $ne: id },
      });
      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            message: `Category slug "${sanitizedSlug}" is already in use by "${conflict.name}"`,
          },
          { status: 400 }
        );
      }
      updateData.slug = sanitizedSlug;
    } else if (name !== undefined && !existingCat.slug) {
      updateData.slug = slugify(name);
    }

    if (image !== undefined) updateData.image = image;
    if (order !== undefined) updateData.order = order;
    if (showOnHome !== undefined) updateData.showOnHome = Boolean(showOnHome);
    if (subcategories !== undefined) updateData.subcategories = subcategories;

    const oldSlug = existingCat.slug;
    const newSlug = updateData.slug || oldSlug;
    const oldName = existingCat.name;
    const newName = updateData.name || oldName;

    const updated = await Category.findByIdAndUpdate(id, updateData, { new: true });

    // Cascade update to Product collection if categorySlug or category name changed
    if (oldSlug && newSlug && oldSlug !== newSlug) {
      await Product.updateMany(
        {
          $or: [
            { categorySlug: oldSlug },
            { parentCategorySlug: oldSlug },
            { 'categories.slug': oldSlug },
          ],
        },
        {
          $set: {
            categorySlug: newSlug,
            parentCategorySlug: newSlug,
            ...(newName !== oldName ? { category: newName } : {}),
          },
        }
      );
    } else if (newName !== oldName) {
      await Product.updateMany(
        { category: oldName },
        { $set: { category: newName } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}
