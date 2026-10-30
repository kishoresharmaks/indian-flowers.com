import type { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import CategoryClientPage from './CategoryClientPage';
import { getSiteUrl } from '@/lib/siteUrl';
import { fetchCursorPaginatedProducts } from '@/lib/cursorPagination';

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const cleanSlug = (params.slug || '').toLowerCase().trim();
  let categoryName = slugToName(cleanSlug);

  try {
    await connectToDatabase();
    const cat = await Category.findOne({ slug: cleanSlug }).lean();
    if (cat && cat.name) {
      categoryName = cat.name;
    }
  } catch (err) {
    // Fallback to parsed slug
  }

  const title = `${categoryName} — Indian Flowers & Garlands USA`;
  const description = `Shop authentic ${categoryName} online with fast nationwide delivery across the United States. Fresh jasmine, handcrafted garlands, temple flowers, and pooja essentials.`;
  const canonicalUrl = `${siteUrl}/product-category/${cleanSlug}`;

  return {
    title,
    description,
    keywords: [
      categoryName,
      'Indian Flowers USA',
      'Fresh Garlands USA',
      'Wedding Flowers',
      'Pooja Flowers Delivery',
      'Temple Flowers',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${categoryName} | Indian-Flowers.com`,
      description,
      url: canonicalUrl,
      siteName: 'Indian-Flowers.com',
      // Issue #8: Added fallback OG image — category pages had no image, causing
      // blank previews when shared on social media.
      images: [
        {
          url: '/images/banners/hero-wedding-1920x650.jpg',
          width: 1200,
          height: 630,
          alt: `${categoryName} — Indian-Flowers.com`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryName} — Indian-Flowers.com`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const siteUrl = getSiteUrl();
  const cleanSlug = (params.slug || '').toLowerCase().trim();
  let categoryName = slugToName(cleanSlug);
  let categoryDescription = '';
  let initialProducts: any[] = [];
  let initialNextCursor: string | null = null;
  let initialHasMore = false;
  let totalCount = 0;

  try {
    await connectToDatabase();

    const cat = await Category.findOne({ slug: cleanSlug }).lean();
    if (cat && cat.name) {
      categoryName = cat.name;
    }

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
  } catch (err) {
    console.error(`Error loading category ${cleanSlug}:`, err);
  }

  const canonicalUrl = `${siteUrl}/product-category/${cleanSlug}`;

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
        name: 'Collections',
        item: `${siteUrl}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: canonicalUrl,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    url: canonicalUrl,
    description: `Shop authentic ${categoryName} online with fast nationwide delivery across the United States.`,
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
        categorySlug={cleanSlug}
        categoryName={categoryName}
        categoryDescription={categoryDescription}
        initialProducts={initialProducts}
        initialNextCursor={initialNextCursor}
        initialHasMore={initialHasMore}
        initialTotalCount={totalCount}
      />
    </>
  );
}
