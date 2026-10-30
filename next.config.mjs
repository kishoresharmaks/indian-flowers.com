/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    // unoptimized removed — Next.js image optimization works fine with standalone output.
    // This re-enables WebP conversion, responsive srcsets, and lazy loading.
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
          {
            // Content-Security-Policy — report-only mode first so violations are
            // surfaced without breaking the site. Switch to Content-Security-Policy
            // (enforce) once CSP-Report-Uri is monitored and no violations remain.
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              // Next.js inline scripts and hydration require 'unsafe-inline'; lock down
              // further with nonces once next.js nonce support is wired in.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
