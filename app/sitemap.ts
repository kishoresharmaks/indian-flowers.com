import { MetadataRoute } from 'next';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Policy from '@/models/Policy';
import Blog from '@/models/Blog';
import { DEFAULT_POLICIES } from '@/lib/defaultPolicies';
import { DEFAULT_BLOGS } from '@/lib/defaultBlogs';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // Static dates for pages with no real DB-driven lastModified source.
  // Using stable dates avoids a constantly-changing sitemap on every request.
  // Update these manually when the page content is substantially revised.
  const SITE_LAUNCH_DATE = new Date('2024-01-01');
  const LAST_LAYOUT_UPDATE = new Date('2025-01-01');

  // 1. Static Core Storefront Routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: LAST_LAYOUT_UPDATE,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: LAST_LAYOUT_UPDATE,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // 1.5. Dynamic Editorial & Guides Index (/blog)
    {
      url: `${baseUrl}/blog`,
      lastModified: LAST_LAYOUT_UPDATE,
      changeFrequency: 'weekly',
      priority: 0.85,
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
    const categoryMap = new Map<string, Date>();

    const [dbCategories, distinctCatSlugs] = await Promise.all([
      Category.find({}, 'slug updatedAt').lean(),
      Product.distinct('categorySlug'),
    ]);

    dbCategories.forEach((c: any) => {
      if (c.slug) {
        const slug = c.slug.toLowerCase().trim();
        categoryMap.set(slug, c.updatedAt ? new Date(c.updatedAt) : LAST_LAYOUT_UPDATE);
      }
    });

    distinctCatSlugs.forEach((s: any) => {
      if (s && typeof s === 'string' && s.trim()) {
        const slug = s.toLowerCase().trim();
        if (!categoryMap.has(slug)) {
          categoryMap.set(slug, LAST_LAYOUT_UPDATE);
        }
      }
    });

    categoryMap.forEach((lastMod, catSlug) => {
      routes.push({
        url: `${baseUrl}/product-category/${catSlug}`,
        lastModified: lastMod,
        changeFrequency: 'daily',
        priority: 0.85,
      });
    });
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  // 4. Product Slugs (/product/[slug])
  try {
    const products = await Product.find({ isActive: { $ne: false } }, 'slug _id updatedAt').lean();
    products.forEach((item: any) => {
      routes.push({
        url: `${baseUrl}/product/${item.slug || item._id}`,
        lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      });
    });
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // 5. Dynamic Blog & Floral Care Guides (/blog/[slug])
  try {
    const dbBlogs = await Blog.find({ isPublished: true, 'seo.noIndex': { $ne: true } }, 'slug updatedAt publishedAt').lean();
    const blogList =
      dbBlogs && dbBlogs.length > 0
        ? dbBlogs
        : DEFAULT_BLOGS.filter((b) => b.isPublished && !b.seo?.noIndex);

    blogList.forEach((b: any) => {
      routes.push({
        url: `${baseUrl}/blog/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : b.publishedAt ? new Date(b.publishedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  } catch (error) {
    DEFAULT_BLOGS.filter((b) => b.isPublished && !b.seo?.noIndex).forEach((b) => {
      routes.push({
        url: `${baseUrl}/blog/${b.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  }

  return routes;
}
