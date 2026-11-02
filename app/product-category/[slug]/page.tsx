import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import CategoryClientPage from './CategoryClientPage';
import { getSiteUrl } from '@/lib/siteUrl';
import { fetchCursorPaginatedProducts, buildProductFilter } from '@/lib/cursorPagination';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ResolvedTarget {
  type: 'category' | 'subcategory';
  category: any;
  subcategory?: any;
  categoryName: string;
  categorySlug: string;
  subcategoryName?: string;
  subcategorySlug?: string;
  parentCategory?: {
    name: string;
    slug: string;
  };
}

async function resolveSlug(cleanSlug: string): Promise<ResolvedTarget | null> {
  // 1. Direct parent category match
  let cat = await Category.findOne({ slug: cleanSlug }).lean();
  if (!cat && (cleanSlug === 'strings-leaves' || cleanSlug === 'strings-and-leaves')) {
    cat = await Category.findOne({
      $or: [{ slug: 'strings-and-leaves' }, { slug: 'strings-leaves' }],
    }).lean();
  }
  if (!cat) {
    const allCategories = await Category.find({}).lean();
    cat = allCategories.find((c: any) => slugify(c.name) === cleanSlug) || null;
  }

  if (cat) {
    return {
      type: 'category',
      category: cat,
      categoryName: cat.name,
      categorySlug: cat.slug || cleanSlug,
    };
  }

  // 2. Subcategory match across all categories
  const allCategories = await Category.find({}).lean();
  for (const c of allCategories) {
    const sub = (c.subcategories || []).find(
      (s: any) =>
        (s.slug && s.slug.toLowerCase() === cleanSlug) ||
        slugify(s.name) === cleanSlug
    );
    if (sub) {
      return {
        type: 'subcategory',
        category: c,
        subcategory: sub,
        categoryName: sub.name,
        categorySlug: cleanSlug,
        subcategoryName: sub.name,
        subcategorySlug: sub.slug || cleanSlug,
        parentCategory: {
          name: c.name,
          slug: c.slug || slugify(c.name),
        },
      };
    }
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const cleanSlug = (params.slug || '').toLowerCase().trim();

  try {
    await connectToDatabase();
    const resolved = await resolveSlug(cleanSlug);

    if (resolved) {
      if (resolved.type === 'subcategory') {
        const title = `${resolved.subcategoryName} — Handcrafted ${resolved.parentCategory?.name} | Indian Flowers USA`;
        const description = `Shop authentic handcrafted ${resolved.subcategoryName} from our ${resolved.parentCategory?.name} collection. Delivered cold-chain across all 50 US States. Guaranteed fresh for weddings, pujas, and celebrations.`;
        const canonicalUrl = `${siteUrl}/product-category/${cleanSlug}`;

        return {
          title,
          description,
          keywords: [
            resolved.subcategoryName || '',
            resolved.parentCategory?.name || '',
            'Indian Flowers USA',
            'Fresh Garlands USA',
            'Wedding Flowers',
            'Pooja Flowers Delivery',
          ],
          alternates: { canonical: canonicalUrl },
          openGraph: {
            title: `${resolved.subcategoryName} | Indian-Flowers.com`,
            description,
            url: canonicalUrl,
            siteName: 'Indian-Flowers.com',
            images: [
              {
                url:
                  resolved.subcategory?.image ||
                  resolved.category?.image ||
                  '/images/banners/hero-wedding-1920x650.jpg',
                width: 1200,
                height: 630,
                alt: `${resolved.subcategoryName} — Indian-Flowers.com`,
              },
            ],
            locale: 'en_US',
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: `${resolved.subcategoryName} — Indian-Flowers.com`,
            description,
          },
          robots: { index: true, follow: true },
        };
      } else {
        const title = `${resolved.categoryName} — Indian Flowers & Garlands USA`;
        const description = `Shop authentic ${resolved.categoryName} online with fast nationwide delivery across the United States. Fresh jasmine, handcrafted garlands, temple flowers, and pooja essentials.`;
        const canonicalUrl = `${siteUrl}/product-category/${cleanSlug}`;

        return {
          title,
          description,
          keywords: [
            resolved.categoryName,
            'Indian Flowers USA',
            'Fresh Garlands USA',
            'Wedding Flowers',
            'Pooja Flowers Delivery',
            'Temple Flowers',
          ],
          alternates: { canonical: canonicalUrl },
          openGraph: {
            title: `${resolved.categoryName} | Indian-Flowers.com`,
            description,
            url: canonicalUrl,
            siteName: 'Indian-Flowers.com',
            images: [
              {
                url: resolved.category?.image || '/images/banners/hero-wedding-1920x650.jpg',
                width: 1200,
                height: 630,
                alt: `${resolved.categoryName} — Indian-Flowers.com`,
              },
            ],
            locale: 'en_US',
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: `${resolved.categoryName} — Indian-Flowers.com`,
            description,
          },
          robots: { index: true, follow: true },
        };
      }
    }
  } catch (err) {
    // Fallback below
  }

  const fallbackName = slugToName(cleanSlug);
  return {
    title: `${fallbackName} — Indian Flowers & Garlands USA`,
    description: `Shop fresh Indian flowers and garlands delivered across the United States.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const siteUrl = getSiteUrl();
  const cleanSlug = (params.slug || '').toLowerCase().trim();

  let resolved: ResolvedTarget | null = null;
  let categoryDisplayName = slugToName(cleanSlug);
  let categoryDescription = '';
  let initialProducts: any[] = [];
  let initialNextCursor: string | null = null;
  let initialHasMore = false;
  let totalCount = 0;
  let parentTotalCount = 0;
  let subcategoriesWithCounts: {
    name: string;
    slug: string;
    image?: string;
    count: number;
  }[] = [];

  try {
    await connectToDatabase();
    resolved = await resolveSlug(cleanSlug);

    if (resolved) {
      if (resolved.type === 'subcategory') {
        categoryDisplayName = resolved.subcategoryName || resolved.categoryName;
        const parentSlug = resolved.parentCategory!.slug;

        // Fetch products for this subcategory
        const paginated = await fetchCursorPaginatedProducts({
          categorySlug: parentSlug,
          subcategory: resolved.subcategoryName,
          limit: 16,
          sortBy: 'featured',
          excludeSeo: true,
        });

        initialProducts = paginated.data;
        initialNextCursor = paginated.nextCursor;
        initialHasMore = paginated.hasMore;
        totalCount = paginated.totalCount;

        // Fetch sibling subcategory counts and parent total count for pills
        const [parentCount, ...subCounts] = await Promise.all([
          Product.countDocuments(buildProductFilter({ categorySlug: parentSlug, excludeSeo: true })),
          ...(resolved.category.subcategories || []).map((sub: any) =>
            Product.countDocuments(
              buildProductFilter({
                categorySlug: parentSlug,
                subcategory: sub.name,
                excludeSeo: true,
              })
            )
          ),
        ]);

        parentTotalCount = parentCount;
        subcategoriesWithCounts = (resolved.category.subcategories || []).map(
          (sub: any, idx: number) => ({
            name: sub.name,
            slug: sub.slug || slugify(sub.name),
            image: sub.image || '',
            count: subCounts[idx],
          })
        );
      } else {
        // Parent category
        categoryDisplayName = resolved.categoryName;
        const catSlug = resolved.categorySlug;

        const paginated = await fetchCursorPaginatedProducts({
          categorySlug: catSlug,
          limit: 16,
          sortBy: 'featured',
          excludeSeo: true,
        });

        initialProducts = paginated.data;
        initialNextCursor = paginated.nextCursor;
        initialHasMore = paginated.hasMore;
        totalCount = paginated.totalCount;
        parentTotalCount = totalCount;

        // Fetch child subcategory counts for pills
        const subCounts = await Promise.all(
          (resolved.category.subcategories || []).map((sub: any) =>
            Product.countDocuments(
              buildProductFilter({
                categorySlug: catSlug,
                subcategory: sub.name,
                excludeSeo: true,
              })
            )
          )
        );

        subcategoriesWithCounts = (resolved.category.subcategories || []).map(
          (sub: any, idx: number) => ({
            name: sub.name,
            slug: sub.slug || slugify(sub.name),
            image: sub.image || '',
            count: subCounts[idx],
          })
        );
      }
    } else {
      // Fallback: check if products exist under this slug directly
      const paginated = await fetchCursorPaginatedProducts({
        categorySlug: cleanSlug,
        limit: 16,
        sortBy: 'featured',
        excludeSeo: true,
      });

      initialProducts = paginated.data;
      initialNextCursor = paginated.nextCursor;
      initialHasMore = paginated.hasMore;
      totalCount = paginated.totalCount;
      parentTotalCount = totalCount;

      if (initialProducts.length === 0) {
        notFound();
      }
    }
  } catch (err) {
    if ((err as any)?.digest?.includes('NEXT_NOT_FOUND')) {
      throw err;
    }
    console.error(`Error loading category ${cleanSlug}:`, err);
  }

  const canonicalUrl = `${siteUrl}/product-category/${cleanSlug}`;

  // Structured Data (JSON-LD)
  const breadcrumbItems: any[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Collections',
      item: `${siteUrl}/shop`,
    },
  ];

  if (resolved?.type === 'subcategory' && resolved.parentCategory) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: resolved.parentCategory.name,
      item: `${siteUrl}/product-category/${resolved.parentCategory.slug}`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 4,
      name: categoryDisplayName,
      item: canonicalUrl,
    });
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: categoryDisplayName,
      item: canonicalUrl,
    });
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryDisplayName,
    url: canonicalUrl,
    description: `Shop authentic ${categoryDisplayName} online with fast nationwide delivery across the United States.`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: initialProducts.map((prod: any, idx: number) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${siteUrl}/product/${prod.slug || prod._id}`,
        name: prod.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <CategoryClientPage
        categorySlug={resolved?.categorySlug || cleanSlug}
        categoryName={categoryDisplayName}
        categoryDescription={categoryDescription}
        initialProducts={initialProducts}
        initialNextCursor={initialNextCursor}
        initialHasMore={initialHasMore}
        initialTotalCount={totalCount}
        isSubcategory={resolved?.type === 'subcategory'}
        subcategoryName={resolved?.subcategoryName}
        currentSlug={cleanSlug}
        parentCategory={
          resolved?.parentCategory
            ? {
                name: resolved.parentCategory.name,
                slug: resolved.parentCategory.slug,
                totalCount: parentTotalCount,
              }
            : resolved?.type === 'category'
            ? {
                name: resolved.categoryName,
                slug: resolved.categorySlug,
                totalCount: totalCount,
              }
            : undefined
        }
        subcategories={subcategoriesWithCounts}
      />
    </>
  );
}
