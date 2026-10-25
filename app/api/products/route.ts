import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('search');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');

    let filter: any = {
      name: { $not: /arugampul|bilva|vilva|durva grass/i },
    };
    if (query && query.trim()) {
      const sanitizedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$and = [
        { name: { $not: /arugampul|bilva|vilva|durva grass/i } },
        {
          $or: [
            { name: { $regex: sanitizedQuery, $options: 'i' } },
            { description: { $regex: sanitizedQuery, $options: 'i' } },
          ],
        },
      ];
      delete filter.name;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (subcategory && subcategory !== 'All') {
      filter.subcategory = subcategory;
    }

    // Ensure database indexes exist
    try {
      await Product.createIndexes();
    } catch (idxErr) {
      // Ignore index creation warnings if already created
    }

    // Use indexed sort, allowDiskUse(true), and .lean() for maximum performance
    const products = await Product.find(filter).sort({ createdAt: -1 }).allowDiskUse(true).lean();
    
    return NextResponse.json(
      { success: true, count: products.length, data: products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const body = await request.json();

    const { name, description, image, mrp, price, quantity, gst, category, subcategory, variants } = body;

    // Validation
    if (!name || !description || !image || mrp === undefined || price === undefined || quantity === undefined || gst === undefined) {
      return NextResponse.json(
        { success: false, message: 'Please provide all required product fields (name, description, image, mrp, price, quantity, gst)' },
        { status: 400 }
      );
    }

    const numMrp = Number(mrp);
    const numPrice = Number(price);
    const numQuantity = Number(quantity);
    const numGst = Number(gst);

    const discount = numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;

    const formattedVariants = Array.isArray(variants) ? variants.map((v: any) => ({
      name: v.name,
      mrp: Number(v.mrp),
      price: Number(v.price),
      quantity: Number(v.quantity !== undefined ? v.quantity : 10),
      discount: Number(v.mrp) > Number(v.price) ? Math.round(((Number(v.mrp) - Number(v.price)) / Number(v.mrp)) * 100) : 0,
    })) : [];

    const newProduct = await Product.create({
      name,
      description,
      image,
      mrp: numMrp,
      price: numPrice,
      discount,
      quantity: numQuantity,
      gst: numGst,
      category: category || 'General',
      subcategory: subcategory || '',
      variants: formattedVariants,
    });

    await captureServerEvent(request, 'product_created', {
      product_id: String(newProduct._id),
      category: category || 'General',
      price: numPrice,
      initial_quantity: numQuantity,
      variant_count: formattedVariants.length,
    }, 'admin-catalog');

    return NextResponse.json(
      { success: true, message: 'Product created successfully', data: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    await captureServerException(request, error, 'admin-catalog');
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
