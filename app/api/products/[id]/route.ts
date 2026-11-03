import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    let product = null;
    product = await Product.findOne({ slug: id.toLowerCase().trim() }).lean();

    if (!product && mongoose.isValidObjectId(id)) {
      product = await Product.findById(id).lean();
    }

    if (!product) {
      // Fallback lookup by exact or hyphenated name
      product = await Product.findOne({
        $or: [
          { name: new RegExp(`^${id.replace(/-/g, ' ')}$`, 'i') },
          { name: new RegExp(`^${id}$`, 'i') },
        ],
      }).lean();
    }

    if (!product || (product.isActive === false && !isAuthenticatedAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch product' },
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

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request as any)) return unauthenticatedResponse();
    await connectToDatabase();
    const { id } = params;
    const body = await request.json();

    if (body.mrp && body.price) {
      body.discount = Math.round(((body.mrp - body.price) / body.mrp) * 100);
    }

    if (body.slug !== undefined) {
      const sanitizedSlug = body.slug
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!sanitizedSlug) {
        return NextResponse.json(
          { success: false, message: 'Product slug cannot be empty' },
          { status: 400 }
        );
      }

      const conflict = await Product.findOne({
        slug: sanitizedSlug,
        _id: { $ne: id },
      });
      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            message: `Product slug "${sanitizedSlug}" is already in use by "${conflict.name}"`,
          },
          { status: 400 }
        );
      }
      body.slug = sanitizedSlug;
    }

    if (body.image) {
      if (!Array.isArray(body.images) || body.images.length === 0) {
        body.images = [body.image];
      } else if (body.images[0] !== body.image) {
        body.images = [body.image, ...body.images.filter((img: string) => img !== body.image)];
      }
    }

    if (body.category && typeof body.category === 'string') {
      const generatedSlug = body.category
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!body.categorySlug) {
        body.categorySlug = generatedSlug;
      }
      if (!body.parentCategorySlug) {
        body.parentCategorySlug = body.categorySlug;
      }
    }

    if (body.subcategory !== undefined) {
      body.subcategorySlug = body.subcategory
        ? body.subcategory
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : '';
    }

    // Auto-synchronize categories array to eliminate stale cross-category taxonomy pollution
    if (body.category || body.categorySlug || body.subcategory !== undefined) {
      const current = await Product.findOne(
        mongoose.isValidObjectId(id) ? { _id: id } : { slug: id }
      ).lean();

      if (current) {
        const effectiveCat = (body.category || (current as any).category || '').trim();
        const effectiveCatSlug = (body.categorySlug || (current as any).categorySlug || '').trim();
        const effectiveSub =
          body.subcategory !== undefined
            ? body.subcategory
            : (current as any).subcategory || '';
        const effectiveSubSlug =
          body.subcategorySlug !== undefined
            ? body.subcategorySlug
            : (current as any).subcategorySlug || '';

        if (effectiveCat && effectiveCatSlug) {
          const syncedCategories: Array<{ id?: number; name: string; slug: string }> = [
            { name: effectiveCat, slug: effectiveCatSlug },
          ];
          if (effectiveSub && effectiveSub.trim()) {
            const subSlug =
              effectiveSubSlug ||
              effectiveSub
                .toString()
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            syncedCategories.push({ name: effectiveSub.trim(), slug: subSlug });
          }
          body.categories = syncedCategories;
        }
      }
    }

    let updatedProduct = null;
    if (mongoose.isValidObjectId(id)) {
      updatedProduct = await Product.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      });
    } else {
      updatedProduct = await Product.findOneAndUpdate({ slug: id }, body, {
        new: true,
        runValidators: true,
      });
    }

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}
