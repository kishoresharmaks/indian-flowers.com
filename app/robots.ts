import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/policy/',
          '/product/',
          '/images/',
          '/decorations/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/account',
          '/setup',
          '/login',
          '/register',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account',
          '/setup',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

