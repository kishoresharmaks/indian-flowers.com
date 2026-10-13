import { MetadataRoute } from 'next';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  try {
    await connectToDatabase();
    const settings = await Settings.findOne({ key: 'global' }, 'domain').lean();
    if (settings?.domain && /^https?:\/\//.test(settings.domain)) baseUrl = settings.domain.replace(/\/$/, '');
    // Fetch all product IDs and updated dates for dynamic product URLs
    const products = await Product.find({}, '_id updatedAt').lean();

    const productUrls: MetadataRoute.Sitemap = products.map((item: any) => ({
      url: `${baseUrl}/product/${item._id}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...routes, ...productUrls];
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    return routes;
  }
}
