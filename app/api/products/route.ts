import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { fetchCursorPaginatedProducts, SortOption } from '@/lib/cursorPagination';
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
    const categorySlug = searchParams.get('categorySlug');
    const subcategory = searchParams.get('subcategory');
    const slug = searchParams.get('slug');
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');
    const sortBy = (searchParams.get('sortBy') as SortOption) || 'featured';
    const excludeSeo = searchParams.get('includeSeo') !== 'true';
    const forHome = searchParams.get('forHome') === 'true';
    const isPaginated = searchParams.has('cursor') || searchParams.has('limit') || searchParams.has('paginate') || searchParams.has('sortBy');
    const includeInactive = searchParams.get('includeInactive') === 'true' && isAuthenticatedAdmin(request as any);

    // 1. Single product slug lookup
    if (slug) {
      const queryCond: any = { slug: slug.toLowerCase().trim() };
      if (!includeInactive) {
        queryCond.isActive = { $ne: false };
      }
      const product = await Product.findOne(queryCond).lean();
      if (!product) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: product });
    }

    // 2. Cursor-based paginated search (used by /product-category/[slug] and /shop)
    if (isPaginated && limitParam !== 'all') {
      const result = await fetchCursorPaginatedProducts({
        categorySlug: categorySlug || category || undefined,
        subcategory: subcategory || undefined,
        search: query || undefined,
        sortBy,
        cursor,
        limit: limitParam ? parseInt(limitParam, 10) : 16,
        excludeSeo,
        includeInactive,
      });

      return NextResponse.json(
        {
          success: true,
          count: result.data.length,
          data: result.data,
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
          totalCount: result.totalCount,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }

    // 3. Unpaginated fallback (for Homepage showcases or Admin inventory)
    const conditions: any[] = [];
    if (!includeInactive) {
      conditions.push({ isActive: { $ne: false } });
    }
    if (forHome || excludeSeo) {
      conditions.push({
        isSeoLanding: { $ne: true },
        hideFromHome: { $ne: true },
      });
    }
    if (query && query.trim()) {
      const sanitizedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      conditions.push({
        $or: [
          { name: { $regex: sanitizedQuery, $options: 'i' } },
          { description: { $regex: sanitizedQuery, $options: 'i' } },
          { category: { $regex: sanitizedQuery, $options: 'i' } },
          { subcategory: { $regex: sanitizedQuery, $options: 'i' } },
          { tags: { $regex: sanitizedQuery, $options: 'i' } },
        ],
      });
    }
    if (categorySlug && categorySlug !== 'All') {
      conditions.push({
        $or: [
          { categorySlug: categorySlug.toLowerCase() },
          { parentCategorySlug: categorySlug.toLowerCase() },
          { 'categories.slug': categorySlug.toLowerCase() },
        ],
      });
    } else if (category && category !== 'All') {
      const sanitizedCat = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      conditions.push({ category: { $regex: new RegExp(`^${sanitizedCat}$`, 'i') } });
    }
    if (subcategory && subcategory !== 'All') {
      const sanitizedSub = subcategory.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      conditions.push({ subcategory: { $regex: new RegExp(`^${sanitizedSub}$`, 'i') } });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

    // Ensure database indexes exist
    try {
      await Product.createIndexes();
    } catch (idxErr) {
      // Ignore index creation warnings if already created
    }

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

    const {
      name,
      slug,
      wpId,
      description,
      image,
      images,
      mrp,
      price,
      quantity,
      gst,
      category,
      categorySlug,
      categories,
      tags,
      subcategory,
      variants,
      attributes,
      isActive,
    } = body;

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

    const generatedSlug = slug
      ? slug.toLowerCase().trim()
      : name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const generatedCatSlug = categorySlug
      ? categorySlug.toLowerCase().trim()
      : (category || 'General').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const newProduct = await Product.create({
      name,
      slug: generatedSlug,
      wpId: wpId ? Number(wpId) : undefined,
      description,
      image,
      images: Array.isArray(images) ? images : [image],
      mrp: numMrp,
      price: numPrice,
      discount,
      quantity: numQuantity,
      gst: numGst,
      category: category || 'General',
      categorySlug: generatedCatSlug,
      categories: Array.isArray(categories) ? categories : [],
      tags: Array.isArray(tags) ? tags : [],
      subcategory: subcategory || '',
      variants: formattedVariants,
      attributes: Array.isArray(attributes) ? attributes : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
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
