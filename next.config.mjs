/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/policy/privacy-policy',
        permanent: true,
      },
      {
        source: '/privacy-policy/',
        destination: '/policy/privacy-policy',
        permanent: true,
      },
      {
        source: '/about-us',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/about-us/',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/contact-us/',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/contact-us-2',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/contact-us-2/',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/my-account',
        destination: '/account',
        permanent: true,
      },
      {
        source: '/my-account/',
        destination: '/account',
        permanent: true,
      },
      {
        source: '/my-account-2',
        destination: '/account',
        permanent: true,
      },
      {
        source: '/my-account-2/',
        destination: '/account',
        permanent: true,
      },
      {
        source: '/registration',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/registration/',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/register-here',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/register-here/',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/home/',
        destination: '/',
        permanent: true,
      },
      {
        source: '/home-2',
        destination: '/',
        permanent: true,
      },
      {
        source: '/home-2/',
        destination: '/',
        permanent: true,
      },
      {
        source: '/indian-pooja-items',
        destination: '/product-category/pooja-flowers',
        permanent: true,
      },
      {
        source: '/indian-pooja-items/',
        destination: '/product-category/pooja-flowers',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
