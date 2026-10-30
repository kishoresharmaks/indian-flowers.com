import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { stripHtmlTags } from '@/lib/htmlUtils';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow long runtime for media downloads

const WP_API_BASE = 'https://indian-flowers.com/wp-json/wc/store/v1';

async function downloadMediaLocally(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    // e.g. /wp-content/uploads/2026/08/carnation-garland.webp
    let relativePath = urlObj.pathname;
    if (!relativePath.startsWith('/wp-content/uploads/')) {
      return url; // External CDN or non-wp-content, return as-is
    }

    const localFilePath = path.join(process.cwd(), 'public', relativePath.replace(/^\//, ''));
    const dir = path.dirname(localFilePath);

    // Check if already on disk
    try {
      await fs.access(localFilePath);
      return relativePath; // File already exists
    } catch {
      // Need to download
    }

    await fs.mkdir(dir, { recursive: true });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Antigravity-Importer/1.0',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(localFilePath, buffer);
      return relativePath;
    }

    return relativePath; // Store relative path even if download fails for resilient local serving
  } catch (err) {
    console.warn(`Could not mirror media ${url}:`, err);
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }
}

// GET: Inspect status and counts from WooCommerce
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${WP_API_BASE}/products?per_page=1`, {
      headers: { 'User-Agent': 'Antigravity-Audit/1.0' },
      cache: 'no-store',
    });

    const totalProducts = Number(res.headers.get('x-wp-total')) || 1946;
    const totalPagesAt100 = Math.ceil(totalProducts / 100);

    await connectToDatabase();
    const localProductCount = await Product.countDocuments();
    const localWpCount = await Product.countDocuments({ wpId: { $exists: true } });
    const localCategoryCount = await Category.countDocuments();

    return NextResponse.json({
      success: true,
      remote: {
        source: WP_API_BASE,
        totalProducts,
        totalPagesAt100,
      },
      local: {
        totalProducts: localProductCount,
        importedWpProducts: localWpCount,
        totalCategories: localCategoryCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Batch Import a Specific Page (e.g. page=1, per_page=100)
function resolveParentCategory(slug: string): { parentSlug: string; subName: string } {
  const map: Record<string, { parentSlug: string; subName: string }> = {
    'jasmine-flower': { parentSlug: 'strings-and-leaves', subName: 'Strings / Jasmine Strings' },
    'green-leafs': { parentSlug: 'strings-and-leaves', subName: 'Pooja Leaves' },
    'green-leaf': { parentSlug: 'strings-and-leaves', subName: 'Pooja Leaves' },
    'pooja-leaves': { parentSlug: 'strings-and-leaves', subName: 'Pooja Leaves' },
    'pooja-flowers': { parentSlug: 'strings-and-leaves', subName: 'Pooja Flowers' },
    'pooja-flowers-pooja-flowers': { parentSlug: 'strings-and-leaves', subName: 'Pooja Flowers' },
    'banana-leaves': { parentSlug: 'strings-and-leaves', subName: 'Banana Leaves' },
    'coconut': { parentSlug: 'strings-and-leaves', subName: 'Coconut' },
    'decor-items': { parentSlug: 'strings-and-leaves', subName: 'Decor Items' },
    'strings-and-leaves': { parentSlug: 'strings-and-leaves', subName: 'Strings / Jasmine Strings' },

    'wedding-garlands': { parentSlug: 'wedding-garlands', subName: 'Wedding Garlands' },
    'rose-petal-garlands': { parentSlug: 'wedding-garlands', subName: 'Rose Petal Garlands' },
    'button-rose-garlands': { parentSlug: 'wedding-garlands', subName: 'Button Rose Garlands' },
    'lilly-garlands': { parentSlug: 'wedding-garlands', subName: 'Lilly Garlands' },
    'tube-rose-garlands': { parentSlug: 'wedding-garlands', subName: 'Lilly Garlands' },
    'carnation-garlands': { parentSlug: 'wedding-garlands', subName: 'Carnation Garlands' },
    'exchange-garlands': { parentSlug: 'wedding-garlands', subName: 'Exchange Garlands' },
    'north-indian-garlands': { parentSlug: 'wedding-garlands', subName: 'North Indian Garlands' },
    'indian-wedding-garlands': { parentSlug: 'wedding-garlands', subName: 'Indian Wedding Garlands' },
    'indian-wedding-garlands-in-bay-area': { parentSlug: 'wedding-garlands', subName: 'Wedding Garlands' },
    'veni': { parentSlug: 'wedding-garlands', subName: 'Veni, Jadai' },

    'house-warming-garlands': { parentSlug: 'house-warming-garlands', subName: 'Door Garlands' },
    'button-rose-door-garlands': { parentSlug: 'house-warming-garlands', subName: 'Button Rose Door Garlands' },
    'coconut-thoranam': { parentSlug: 'house-warming-garlands', subName: 'Coconut Thoranam' },
    'mango-leaves-thoranam': { parentSlug: 'house-warming-garlands', subName: 'Mango Leaves Thoranam' },
    'button-rose-string': { parentSlug: 'house-warming-garlands', subName: 'Button Rose String' },

    'temple-and-pooja-garlands': { parentSlug: 'temple-garlands', subName: 'Temple and Pooja Garlands' },
    'temple-garlands': { parentSlug: 'temple-garlands', subName: 'Temple and Pooja Garlands' },
    'button-rose-pooja-garlands': { parentSlug: 'temple-garlands', subName: 'Button Rose Pooja Garlands' },
    'lilly-temple-garlands': { parentSlug: 'temple-garlands', subName: 'Lilly Garlands' },
    'nanthiyavattam-garlands': { parentSlug: 'temple-garlands', subName: 'Nanthiyavattam Garlands' },
    'vilvam-garlands': { parentSlug: 'temple-garlands', subName: 'Vilvam Garlands' },
    'vadamalli-garlands': { parentSlug: 'temple-garlands', subName: 'Vadamalli Garlands' },
  };
  return map[slug] || { parentSlug: slug, subName: '' };
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) {
      return unauthenticatedResponse();
    }

    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const page = Math.max(1, Number(body.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(body.perPage) || 50));
    const shouldDownloadImages = body.downloadImages !== false;

    console.log(`[WP-IMPORT] Fetching page ${page} (perPage: ${perPage}) from WooCommerce...`);

    const wpRes = await fetch(`${WP_API_BASE}/products?per_page=${perPage}&page=${page}`, {
      headers: { 'User-Agent': 'Antigravity-Importer/1.0' },
      cache: 'no-store',
    });

    if (!wpRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `WooCommerce API returned HTTP ${wpRes.status}: ${wpRes.statusText}`,
        },
        { status: wpRes.status }
      );
    }

    const totalProducts = Number(wpRes.headers.get('x-wp-total')) || 1946;
    const totalPages = Number(wpRes.headers.get('x-wp-totalpages')) || Math.ceil(totalProducts / perPage);
    const wpProducts: any[] = await wpRes.json();

    let createdCount = 0;
    let updatedCount = 0;
    const importedSlugs: string[] = [];

    for (const item of wpProducts) {
      try {
        const wpId = item.id;
        const name = (item.name || '').trim();
        const slug = (item.slug || '').toLowerCase().trim();

        if (!name || !slug) continue;

        // Prices: WooCommerce store API prices are in minor units (cents)
        const priceNum = Number(item.prices?.price || 0) / 100;
        const mrpNum = Number(item.prices?.regular_price || item.prices?.price || 0) / 100;
        const discount = mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

        // Images: Never store Base64! Store clean relative path or URL
        let mainImagePath = '/images/banners/hero-wedding-1920x650.jpg';
        const imageGalleryPaths: string[] = [];

        if (Array.isArray(item.images) && item.images.length > 0) {
          for (let i = 0; i < item.images.length; i++) {
            const imgSrc = item.images[i]?.src;
            if (imgSrc) {
              const processedPath = shouldDownloadImages
                ? await downloadMediaLocally(imgSrc)
                : new URL(imgSrc).pathname;

              if (i === 0) mainImagePath = processedPath;
              imageGalleryPaths.push(processedPath);
            }
          }
        }

        // Categories & Category Slugs
        const categoriesList = Array.isArray(item.categories)
          ? item.categories.map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: (c.slug || '').toLowerCase().trim(),
            }))
          : [];

        const primaryCat = categoriesList[0]?.name || 'Fresh Indian Flowers';
        const primaryCatSlug = categoriesList[0]?.slug || 'fresh-indian-flowers';

        // Auto-seed Category model if not already present
        if (categoriesList.length > 0) {
          try {
            await Category.updateOne(
              { slug: primaryCatSlug },
              {
                $setOnInsert: {
                  name: primaryCat,
                  slug: primaryCatSlug,
                  image: mainImagePath,
                  order: 0,
                  subcategories: [],
                },
              },
              { upsert: true }
            );
          } catch (catErr) {
            // Ignore duplicate category upsert race
          }
        }

        // Tags
        const tags = Array.isArray(item.tags) ? item.tags.map((t: any) => t.name) : [];

        // Attributes & Variants
        const attributes = Array.isArray(item.attributes)
          ? item.attributes.map((attr: any) => ({
              name: attr.name,
              terms: Array.isArray(attr.terms) ? attr.terms.map((term: any) => term.name) : [],
            }))
          : [];

        // Build Variants from size/options
        const variants: any[] = [];
        if (Array.isArray(item.attributes)) {
          const sizeAttr = item.attributes.find((a: any) =>
            a.name?.toLowerCase().includes('size') || a.name?.toLowerCase().includes('length')
          );
          if (sizeAttr && Array.isArray(sizeAttr.terms)) {
            sizeAttr.terms.forEach((term: any, idx: number) => {
              // Parse price addition if term contains e.g. "+$20.00"
              let variantPrice = priceNum;
              const priceMatch = term.name.match(/\+\$(\d+(\.\d+)?)/);
              if (priceMatch) {
                variantPrice += parseFloat(priceMatch[1]);
              }
              variants.push({
                name: term.name,
                mrp: variantPrice,
                price: variantPrice,
                quantity: 10,
                discount: 0,
              });
            });
          }
        }

        // Upsert Product Document in MongoDB Atlas
        const existing = await Product.findOne({
          $or: [{ wpId }, { slug }],
        });

        const rawDescription = item.description || item.short_description || name;
        const plainSummary = stripHtmlTags(item.short_description || item.description || name).slice(0, 260);

        const parentResolution = resolveParentCategory(primaryCatSlug);

        const updatePayload: any = {
          name,
          slug,
          wpId,
          description: rawDescription,
          descriptionHtml: rawDescription,
          shortDescription: plainSummary,
          image: mainImagePath,
          images: imageGalleryPaths,
          price: priceNum,
          mrp: mrpNum,
          discount,
          quantity: item.is_in_stock ? 15 : 0,
          isTaxable: true,
          category: primaryCat,
          categorySlug: primaryCatSlug,
          parentCategorySlug: parentResolution.parentSlug,
          subcategory: parentResolution.subName || undefined,
          categories: categoriesList,
          tags,
          variants: variants.length > 0 ? variants : existing?.variants || [],
          attributes,
          isActive: item.status ? item.status === 'publish' : true,
        };

        if (existing) {
          await Product.updateOne({ _id: existing._id }, { $set: updatePayload });
          updatedCount++;
        } else {
          await Product.create(updatePayload);
          createdCount++;
        }

        importedSlugs.push(slug);
      } catch (itemErr: any) {
        console.error(`Error importing product ${item.name || item.id}:`, itemErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      page,
      perPage,
      totalPages,
      totalProducts,
      batchCount: wpProducts.length,
      createdCount,
      updatedCount,
      importedSlugsSample: importedSlugs.slice(0, 5),
    });
  } catch (error: any) {
    console.error('WooCommerce import error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}
