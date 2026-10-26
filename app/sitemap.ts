import { MetadataRoute } from 'next';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Policy from '@/models/Policy';
import { DEFAULT_POLICIES } from '@/lib/defaultPolicies';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // 1. Static Core Storefront Routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
  ];

  await connectToDatabase().catch((err) =>
    console.error('Sitemap DB connection failed:', err)
  );

  // 2. Legal, Shipping & Customer Trust Policy Routes
  try {
    const dbPolicies = await Policy.find({ isPublished: true }, 'slug updatedAt').lean();
    const policySlugs =
      dbPolicies && dbPolicies.length > 0
        ? dbPolicies
        : DEFAULT_POLICIES.filter((p) => p.isPublished).map((p) => ({
            slug: p.slug,
            updatedAt: new Date(),
          }));

    policySlugs.forEach((pol: any) => {
      routes.push({
        url: `${baseUrl}/policy/${pol.slug}`,
        lastModified: pol.updatedAt ? new Date(pol.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  } catch (error) {
    DEFAULT_POLICIES.filter((p) => p.isPublished).forEach((p) => {
      routes.push({
        url: `${baseUrl}/policy/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  }

  // 3. Category Landing Pages (/product-category/[slug])
  try {
    const categorySlugs = new Set<string>();

    const [dbCategories, distinctCatSlugs] = await Promise.all([
      Category.find({}, 'slug updatedAt').lean(),
      Product.distinct('categorySlug'),
    ]);

    dbCategories.forEach((c: any) => {
      if (c.slug) categorySlugs.add(c.slug.toLowerCase().trim());
    });

    distinctCatSlugs.forEach((s: any) => {
      if (s && typeof s === 'string' && s.trim()) {
        categorySlugs.add(s.toLowerCase().trim());
      }
    });

    categorySlugs.forEach((catSlug) => {
      routes.push({
        url: `${baseUrl}/product-category/${catSlug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.85,
      });
    });
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  // 4. Product Slugs (/product/[slug])
  try {
    const products = await Product.find({}, 'slug _id updatedAt').lean();
    const productUrls: MetadataRoute.Sitemap = products.map((item: any) => ({
      url: `${baseUrl}/product/${item.slug || item._id}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...routes, ...productUrls];
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    return routes;
  }
}
