import { MetadataRoute } from 'next';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
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
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // 2. Legal, Shipping & Customer Trust Policy Routes
  try {
    const dbPolicies = await Policy.find({ isPublished: true }, 'slug updatedAt').lean();
    const policySlugs = dbPolicies && dbPolicies.length > 0
      ? dbPolicies
      : DEFAULT_POLICIES.filter((p) => p.isPublished).map((p) => ({ slug: p.slug, updatedAt: new Date() }));

    policySlugs.forEach((pol: any) => {
      routes.push({
        url: `${baseUrl}/policy/${pol.slug}`,
        lastModified: pol.updatedAt ? new Date(pol.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    });
  } catch (error) {
    DEFAULT_POLICIES.filter((p) => p.isPublished).forEach((p) => {
      routes.push({
        url: `${baseUrl}/policy/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    });
  }

  // 3. Dynamic Products from Database
  try {
    const products = await Product.find({}, '_id updatedAt').lean();
    const productUrls: MetadataRoute.Sitemap = products.map((item: any) => ({
      url: `${baseUrl}/product/${item._id}`,
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

