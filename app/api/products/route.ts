import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('search');
    const category = searchParams.get('category');

    let filter: any = {};
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') {
      filter.category = category;
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

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { name, description, image, mrp, price, quantity, gst, category, variants } = body;

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
