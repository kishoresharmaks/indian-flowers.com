// Issue #1: noindex on auth pages.
// Login is disallowed in robots.txt but must also carry a noindex meta tag
// as a second layer of protection in case Googlebot ever reaches the page directly.
// Metadata must be exported from a Server Component; since page.tsx is 'use client',
// we export metadata from this sibling layout instead.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Indian-Flowers.com',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
