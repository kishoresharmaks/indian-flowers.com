import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('code') || searchParams.get('q') || '').trim();
    const variantName = (searchParams.get('variant') || '').trim();

    if (!query) {
      return NextResponse.json({ success: false, message: 'Code or query is required' }, { status: 400 });
    }

    await connectToDatabase();

    let product: any = null;

    // 1. Check if valid ObjectId
    if (mongoose.isValidObjectId(query)) {
      product = await Product.findById(query).lean();
    }

    // 2. Lookup by slug
    if (!product) {
      product = await Product.findOne({ slug: query.toLowerCase() }).lean();
    }

    // 3. Lookup by Product Code in name/slug (e.g. CG27, RP85, DG04)
    if (!product) {
      const cleanCode = query.replace(/[-\s]/g, '');
      const escapedCleanCode = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const codeRegex = new RegExp(`(^|[^A-Za-z0-9])${escapedCleanCode}([^A-Za-z0-9]|$)`, 'i');
      product = await Product.findOne({
        $or: [{ name: codeRegex }, { slug: codeRegex }],
      }).lean();
    }

    // 4. Case-insensitive search on name
    if (!product) {
      product = await Product.findOne({
        name: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      }).lean();
    }

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found for given code' }, { status: 404 });
    }

    let resolvedTitle = product.name;
    if (variantName) {
      resolvedTitle = `${product.name} (${variantName})`;
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        title: resolvedTitle,
        image: product.image,
        variants: product.variants || [],
        price: product.price,
        mrp: product.mrp,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to lookup product' },
      { status: 500 }
    );
  }
}
