import type { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import ShopClientPage from './ShopClientPage';
import { getSiteUrl } from '@/lib/siteUrl';

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
  let products: any[] = [];
  let categories: any[] = [];

  try {
    await connectToDatabase();

    const [rawProducts, rawCategories] = await Promise.all([
      Product.find({}).sort({ createdAt: -1 }).lean(),
      Category.find({}).sort({ order: 1, name: 1 }).lean(),
    ]);

    products = JSON.parse(JSON.stringify(rawProducts));

    // Aggregate category counts from products
    const countsBySlug: Record<string, number> = {};
    products.forEach((p: any) => {
      if (p.categorySlug) {
        countsBySlug[p.categorySlug] = (countsBySlug[p.categorySlug] || 0) + 1;
      }
    });

    categories = rawCategories.map((c: any) => ({
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      count: countsBySlug[c.slug] || 0,
    }));
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
      <ShopClientPage initialProducts={products} categories={categories} />
    </>
  );
}
