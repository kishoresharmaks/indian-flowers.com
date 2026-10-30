// Issue #1: noindex on auth pages.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account | Indian-Flowers.com',
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

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
