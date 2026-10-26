import { Suspense } from 'react';
import type { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import ShopClientPage from './ShopClientPage';
import { getSiteUrl } from '@/lib/siteUrl';
import { fetchCursorPaginatedProducts } from '@/lib/cursorPagination';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/shop`;

  return {
    title: 'Shop Fresh Indian Flowers, Garlands & Pooja Essentials | Indian-Flowers.com USA',
    description:
      'Browse our complete catalog of fresh Indian flowers, handcrafted wedding garlands, jasmine strands (Mallipoo), temple pooja leaves, and ceremonial essentials with nationwide USA delivery.',
    keywords: [
      'Shop Indian Flowers',
      'Buy Wedding Garlands USA',
      'Fresh Jasmine Delivery USA',
      'Temple Flowers Online',
      'Pooja Essentials USA',
      'Indian Flowers Catalog',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'Shop Fresh Indian Flowers & Garlands | Indian-Flowers.com',
      description:
        'Order fresh Indian flowers and handcrafted garlands delivered fresh across the United States.',
      url: canonicalUrl,
      siteName: 'Indian-Flowers.com',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Shop Indian Flowers & Garlands — Indian-Flowers.com',
      description:
        'Order fresh Indian flowers and handcrafted garlands delivered fresh across the United States.',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ShopPage() {
  const siteUrl = getSiteUrl();
  let initialProducts: any[] = [];
  let initialNextCursor: string | null = null;
  let initialHasMore = false;
  let totalCount = 0;
  let mainCategories: any[] = [];

  try {
    await connectToDatabase();

    const [paginated, rawCategories, productsCol] = await Promise.all([
      fetchCursorPaginatedProducts({ limit: 16, sortBy: 'featured' }),
      Category.find({}).sort({ order: 1, name: 1 }).lean(),
      Product.collection,
    ]);

    initialProducts = paginated.data;
    initialNextCursor = paginated.nextCursor;
    initialHasMore = paginated.hasMore;
    totalCount = paginated.totalCount;

    // Fetch counts for each main category and each subcategory
    mainCategories = await Promise.all(
      rawCategories.map(async (cat: any) => {
        const catSlug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        // Count products for this main category (including all child subcategory terms)
        const mainCatCount = await productsCol.countDocuments({
          $or: [
            { categorySlug: catSlug },
            { parentCategorySlug: catSlug },
            { 'categories.slug': catSlug },
            { category: new RegExp(`^${cat.name}$`, 'i') },
          ],
        });

        // Count products for each subcategory
        const subcategoriesWithCounts = await Promise.all(
          (cat.subcategories || []).map(async (sub: any) => {
            const subSlug = sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const subCount = await productsCol.countDocuments({
              $or: [
                { subcategory: new RegExp(`^${sub.name}$`, 'i') },
                { categorySlug: subSlug },
                { 'categories.slug': subSlug },
              ],
            });
            return {
              _id: sub._id ? sub._id.toString() : subSlug,
              name: sub.name,
              slug: subSlug,
              image: sub.image || '',
              count: subCount,
            };
          })
        );

        return {
          _id: cat._id ? cat._id.toString() : catSlug,
          name: cat.name,
          slug: catSlug,
          count: mainCatCount,
          subcategories: subcategoriesWithCounts,
        };
      })
    );
  } catch (err) {
    console.error('Error fetching shop data:', err);
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${siteUrl}/shop`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] animate-pulse" />}>
        <ShopClientPage
          initialProducts={initialProducts}
          initialNextCursor={initialNextCursor}
          initialHasMore={initialHasMore}
          initialTotalCount={totalCount}
          mainCategories={mainCategories}
        />
      </Suspense>
    </>
  );
}
