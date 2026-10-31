import mongoose from 'mongoose';
import Product, { IProduct } from '@/models/Product';

export interface CursorPayload {
  id: string;
  val?: string | number | Date;
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name';

export interface PaginateOptions {
  categorySlug?: string;
  subcategory?: string;
  search?: string;
  sortBy?: SortOption;
  cursor?: string | null;
  limit?: number;
  excludeSeo?: boolean;
  includeInactive?: boolean;
}

export interface PaginatedResult<T = any> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

/**
 * Encode an item's cursor token into a URL-safe Base64 string
 */
export function encodeCursor(item: any, sortField: string = 'createdAt'): string {
  if (!item || !item._id) return '';
  const payload: CursorPayload = {
    id: item._id.toString(),
  };

  if (sortField === 'price') {
    payload.val = Number(item.price) || 0;
  } else if (sortField === 'name') {
    payload.val = String(item.name || '').trim();
  } else {
    // Default: createdAt Date timestamp
    const dateVal = item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString();
    payload.val = dateVal;
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Decode an opaque URL-safe Base64 cursor token
 */
export function decodeCursor(cursorStr?: string | null): CursorPayload | null {
  if (!cursorStr || typeof cursorStr !== 'string') return null;
  try {
    const raw = Buffer.from(cursorStr.trim(), 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Build MongoDB sort specification and range filter for cursor-based pagination
 */
export function getSortConfig(sortBy: SortOption = 'featured') {
  switch (sortBy) {
    case 'price-asc':
      return {
        sortField: 'price',
        isAscending: true,
        mongoSort: { price: 1, _id: 1 } as const,
      };
    case 'price-desc':
      return {
        sortField: 'price',
        isAscending: false,
        mongoSort: { price: -1, _id: -1 } as const,
      };
    case 'name':
      return {
        sortField: 'name',
        isAscending: true,
        mongoSort: { name: 1, _id: 1 } as const,
      };
    case 'featured':
    default:
      return {
        sortField: 'createdAt',
        isAscending: false,
        mongoSort: { createdAt: -1, _id: -1 } as const,
      };
  }
}

/**
 * Executes a cursor-based paginated search on the Product collection
 */
export async function fetchCursorPaginatedProducts({
  categorySlug,
  subcategory,
  search,
  sortBy = 'featured',
  cursor,
  limit = 16,
  excludeSeo = true,
  includeInactive = false,
}: PaginateOptions): Promise<PaginatedResult> {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 16), 48);
  const { sortField, isAscending, mongoSort } = getSortConfig(sortBy);

  // 1. Build Base Match Filter
  const baseConditions: any[] = [];

  // Exclude disabled products from public storefront
  if (!includeInactive) {
    baseConditions.push({
      isActive: { $ne: false },
    });
  }

  // Exclude programmatic city/state SEO landing products from regular browsing
  if (excludeSeo) {
    baseConditions.push({
      isSeoLanding: { $ne: true },
      hideFromHome: { $ne: true },
    });
  }

  // Category filter
  if (categorySlug && categorySlug.toLowerCase() !== 'all') {
    const cleanCat = categorySlug.toLowerCase().trim();
    const slugVariants = new Set<string>([cleanCat]);

    if (cleanCat === 'strings-and-leaves' || cleanCat === 'strings-leaves') {
      slugVariants.add('strings-and-leaves');
      slugVariants.add('strings-leaves');
    } else if (cleanCat.includes('-and-')) {
      slugVariants.add(cleanCat.replace(/-and-/g, '-'));
    }

    const catSlugList = Array.from(slugVariants);
    const escapedCat = cleanCat.replace(/-/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const catConditions: any[] = [
      { categorySlug: { $in: catSlugList } },
      { parentCategorySlug: { $in: catSlugList } },
      { 'categories.slug': { $in: catSlugList } },
      { category: new RegExp(`^${escapedCat}$`, 'i') },
    ];

    if (escapedCat.includes(' and ')) {
      catConditions.push({ category: new RegExp(`^${escapedCat.replace(/ and /gi, ' & ')}$`, 'i') });
      catConditions.push({ category: new RegExp(`^${escapedCat.replace(/ and /gi, '\\s*(&|and)\\s*')}$`, 'i') });
    }

    if (cleanCat === 'strings-and-leaves' || cleanCat === 'strings-leaves') {
      catConditions.push({ category: /^STRINGS\s*(&|and|-)\s*LEAVES$/i });
    }

    baseConditions.push({
      $or: catConditions,
    });
  }

  // Subcategory filter
  if (subcategory && subcategory.toLowerCase() !== 'all') {
    const cleanSub = subcategory.trim();
    const escapedSub = cleanSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const slugSub = cleanSub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    baseConditions.push({
      $or: [
        { subcategory: new RegExp(`^${escapedSub}$`, 'i') },
        { categorySlug: slugSub },
        { 'categories.slug': slugSub },
        { category: new RegExp(`^${escapedSub}$`, 'i') },
      ],
    });
  }

  // Search filter
  if (search && search.trim()) {
    const sanitizedQuery = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    baseConditions.push({
      $or: [
        { name: { $regex: sanitizedQuery, $options: 'i' } },
        { description: { $regex: sanitizedQuery, $options: 'i' } },
        { category: { $regex: sanitizedQuery, $options: 'i' } },
        { subcategory: { $regex: sanitizedQuery, $options: 'i' } },
        { tags: { $regex: sanitizedQuery, $options: 'i' } },
      ],
    });
  }

  // Base filter for counting and query
  const countFilter = baseConditions.length > 0 ? { $and: baseConditions } : {};

  // 2. Decode and Apply Cursor Condition
  const decodedCursor = decodeCursor(cursor);
  const queryConditions = [...baseConditions];

  if (decodedCursor && decodedCursor.id) {
    try {
      const cursorObjectId = new mongoose.Types.ObjectId(decodedCursor.id);

      if (sortField === 'price') {
        const cursorPrice = Number(decodedCursor.val) || 0;
        if (isAscending) {
          queryConditions.push({
            $or: [
              { price: { $gt: cursorPrice } },
              { price: cursorPrice, _id: { $gt: cursorObjectId } },
            ],
          });
        } else {
          queryConditions.push({
            $or: [
              { price: { $lt: cursorPrice } },
              { price: cursorPrice, _id: { $lt: cursorObjectId } },
            ],
          });
        }
      } else if (sortField === 'name') {
        const cursorName = String(decodedCursor.val || '');
        if (isAscending) {
          queryConditions.push({
            $or: [
              { name: { $gt: cursorName } },
              { name: cursorName, _id: { $gt: cursorObjectId } },
            ],
          });
        } else {
          queryConditions.push({
            $or: [
              { name: { $lt: cursorName } },
              { name: cursorName, _id: { $lt: cursorObjectId } },
            ],
          });
        }
      } else {
        // createdAt (Date)
        const cursorDate = decodedCursor.val ? new Date(decodedCursor.val) : new Date();
        queryConditions.push({
          $or: [
            { createdAt: { $lt: cursorDate } },
            { createdAt: cursorDate, _id: { $lt: cursorObjectId } },
          ],
        });
      }
    } catch (cursorErr) {
      console.warn('Invalid cursor provided, falling back to page 1:', cursorErr);
    }
  }

  const finalQuery = queryConditions.length > 0 ? { $and: queryConditions } : {};

  // 3. Parallel Query Execution: Products (Limit + 1) and Total Count
  const [rawProducts, totalCount] = await Promise.all([
    Product.find(finalQuery)
      .sort(mongoSort as any)
      .limit(safeLimit + 1)
      .lean(),
    Product.countDocuments(countFilter),
  ]);

  const hasMore = rawProducts.length > safeLimit;
  const products = hasMore ? rawProducts.slice(0, safeLimit) : rawProducts;

  let nextCursor: string | null = null;
  if (hasMore && products.length > 0) {
    const lastItem = products[products.length - 1];
    nextCursor = encodeCursor(lastItem, sortField);
  }

  return {
    data: JSON.parse(JSON.stringify(products)),
    nextCursor,
    hasMore,
    totalCount,
  };
}
