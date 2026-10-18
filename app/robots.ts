import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://indian-flowers.com').replace(/\/$/, '');

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

