import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({
        success: true,
        query: '',
        products: [],
        categories: [],
        totalMatches: 0,
      });
    }

    await connectToDatabase();

    const terms = query
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => new RegExp(escapeRegex(term), 'i'));

    // Match all terms across product searchable fields
    const productConditions = terms.map((term) => ({
      $or: [
        { name: term },
        { category: term },
        { subCategory: term },
        { tags: term },
        { shortDescription: term },
      ],
    }));

    const productQuery = {
      isActive: { $ne: false },
      isSeoLanding: { $ne: true },
      hideFromHome: { $ne: true },
      $and: productConditions,
    };

    // Parallel fetch: top 6 products, count, and matching categories
    const [matchingProducts, totalMatches, allCategories] = await Promise.all([
      Product.find(productQuery)
        .select('_id name slug price salePrice image images category subCategory inStock isBestSeller isSeoLanding')
        .sort({ isSeoLanding: 1, inStock: -1, isBestSeller: -1, updatedAt: -1 })
        .limit(6)
        .lean(),
      Product.countDocuments(productQuery),
      Category.find({}).select('name slug subcategories').lean(),
    ]);

    // Find matching categories or subcategories
    const matchingCategories: Array<{
      name: string;
      slug: string;
      type: 'category' | 'subcategory';
      parentCategory?: string;
    }> = [];

    const queryLower = query.toLowerCase();

    for (const cat of allCategories) {
      const catSlug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (cat.name.toLowerCase().includes(queryLower)) {
        matchingCategories.push({
          name: cat.name,
          slug: catSlug,
          type: 'category',
        });
      }

      if (Array.isArray(cat.subcategories)) {
        for (const sub of cat.subcategories) {
          if (sub.name && sub.name.toLowerCase().includes(queryLower)) {
            matchingCategories.push({
              name: sub.name,
              slug: catSlug,
              type: 'subcategory',
              parentCategory: cat.name,
            });
          }
        }
      }

      if (matchingCategories.length >= 4) break;
    }

    return NextResponse.json({
      success: true,
      query,
      products: matchingProducts,
      categories: matchingCategories.slice(0, 4),
      totalMatches,
    });
  } catch (error: any) {
    console.error('Error in predictive search API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Search failed', products: [], categories: [], totalMatches: 0 },
      { status: 500 }
    );
  }
}
