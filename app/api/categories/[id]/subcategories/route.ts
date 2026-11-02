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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const { id } = params;

    const body = await request.json();
    const { name, slug, image, order } = body;

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
    const targetSlug = slugify(slug || trimmedName);

    const existingIndex = category.subcategories.findIndex(
      (sub: any) => sub.name.toLowerCase() === trimmedName.toLowerCase()
    );

    // Validate that no other subcategory has this slug
    const slugConflictIndex = category.subcategories.findIndex(
      (sub: any, idx: number) => idx !== existingIndex && sub.slug?.toLowerCase() === targetSlug.toLowerCase()
    );
    if (slugConflictIndex >= 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Subcategory slug "${targetSlug}" is already in use by "${category.subcategories[slugConflictIndex].name}"`,
        },
        { status: 400 }
      );
    }

    if (existingIndex >= 0) {
      // Update existing subcategory
      category.subcategories[existingIndex].name = trimmedName;
      category.subcategories[existingIndex].slug = targetSlug;
      if (image !== undefined) category.subcategories[existingIndex].image = image;
      if (order !== undefined) category.subcategories[existingIndex].order = order;
    } else {
      // Add new subcategory
      category.subcategories.push({
        name: trimmedName,
        slug: targetSlug,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const { id } = params;

    const body = await request.json();
    const { subId, oldName, name, slug, image, order, targetCategoryId } = body;

    const sourceCategory = await Category.findById(id);
    if (!sourceCategory) {
      return NextResponse.json(
        { success: false, message: 'Source category not found' },
        { status: 404 }
      );
    }

    if (!Array.isArray(sourceCategory.subcategories)) {
      sourceCategory.subcategories = [];
    }

    // Find the subcategory in sourceCategory
    const subIndex = sourceCategory.subcategories.findIndex((sub: any) => {
      if (subId && sub._id && String(sub._id) === String(subId)) return true;
      if (oldName && sub.name && sub.name.toLowerCase() === oldName.trim().toLowerCase()) return true;
      if (name && sub.name && sub.name.toLowerCase() === name.trim().toLowerCase()) return true;
      return false;
    });

    if (subIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Subcategory not found in category' },
        { status: 404 }
      );
    }

    const currentSub = sourceCategory.subcategories[subIndex];
    const previousName = currentSub.name;
    const previousSlug = currentSub.slug;
    const newName = (name && name.trim()) || previousName;
    const newImage = image !== undefined ? image : currentSub.image || '';
    const newOrder = order !== undefined ? Number(order) : currentSub.order;
    const newSlug = slugify(slug || newName);

    // Case 1: Moving to another category
    if (targetCategoryId && String(targetCategoryId) !== String(id)) {
      const targetCategory = await Category.findById(targetCategoryId);
      if (!targetCategory) {
        return NextResponse.json(
          { success: false, message: 'Target category not found' },
          { status: 404 }
        );
      }

      if (!Array.isArray(targetCategory.subcategories)) {
        targetCategory.subcategories = [];
      }

      // Check conflict in target category
      const targetConflict = targetCategory.subcategories.find(
        (sub: any) =>
          sub.name.toLowerCase() !== newName.toLowerCase() &&
          sub.slug?.toLowerCase() === newSlug.toLowerCase()
      );
      if (targetConflict) {
        return NextResponse.json(
          {
            success: false,
            message: `Subcategory slug "${newSlug}" is already in use by "${targetConflict.name}" in ${targetCategory.name}`,
          },
          { status: 400 }
        );
      }

      // Remove from sourceCategory
      sourceCategory.subcategories.splice(subIndex, 1);
      await sourceCategory.save();

      // Check if subcategory with same name already in targetCategory
      const targetIndex = targetCategory.subcategories.findIndex(
        (sub: any) => sub.name.toLowerCase() === newName.toLowerCase()
      );

      if (targetIndex >= 0) {
        targetCategory.subcategories[targetIndex].name = newName;
        targetCategory.subcategories[targetIndex].slug = newSlug;
        targetCategory.subcategories[targetIndex].image = newImage;
        if (order !== undefined) targetCategory.subcategories[targetIndex].order = newOrder;
      } else {
        targetCategory.subcategories.push({
          _id: currentSub._id,
          name: newName,
          slug: newSlug,
          image: newImage,
          order: newOrder !== undefined ? newOrder : targetCategory.subcategories.length + 1,
        });
      }
      await targetCategory.save();

      // Automatically re-assign products in MongoDB
      const targetSlug = targetCategory.slug || slugify(targetCategory.name);
      const updateResult = await Product.updateMany(
        {
          $or: [
            { category: sourceCategory.name, subcategory: new RegExp(`^${previousName}$`, 'i') },
            { category: new RegExp(`^${previousName}$`, 'i'), subcategory: new RegExp(`^${previousName}$`, 'i') },
            { subcategory: new RegExp(`^${previousName}$`, 'i'), category: sourceCategory.name },
            { subcategory: new RegExp(`^${previousName}$`, 'i') },
          ],
        },
        {
          $set: {
            category: targetCategory.name,
            categorySlug: targetSlug,
            parentCategorySlug: targetSlug,
            subcategory: newName,
            categories: [
              { name: targetCategory.name, slug: targetSlug },
              { name: newName, slug: newSlug },
            ],
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Subcategory "${newName}" moved to "${targetCategory.name}" (${updateResult.modifiedCount} products updated)`,
        data: {
          sourceCategory,
          targetCategory,
          productsUpdated: updateResult.modifiedCount,
        },
      });
    }

    // Case 2: Update in-place in current category
    // Check if newSlug conflicts with any OTHER subcategory in current category
    const localConflict = sourceCategory.subcategories.find(
      (sub: any, idx: number) =>
        idx !== subIndex && sub.slug?.toLowerCase() === newSlug.toLowerCase()
    );
    if (localConflict) {
      return NextResponse.json(
        {
          success: false,
          message: `Subcategory slug "${newSlug}" is already in use by "${localConflict.name}"`,
        },
        { status: 400 }
      );
    }

    currentSub.name = newName;
    currentSub.slug = newSlug;
    currentSub.image = newImage;
    if (order !== undefined) currentSub.order = newOrder;

    sourceCategory.markModified('subcategories');
    await sourceCategory.save();

    // If name or slug changed, update products referencing this subcategory
    const isNameChanged = previousName.toLowerCase() !== newName.toLowerCase();
    const isSlugChanged = previousSlug && previousSlug.toLowerCase() !== newSlug.toLowerCase();

    if (isNameChanged || isSlugChanged) {
      await Product.updateMany(
        {
          category: sourceCategory.name,
          subcategory: new RegExp(`^${previousName}$`, 'i'),
        },
        {
          $set: {
            subcategory: newName,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: sourceCategory,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update subcategory' },
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
