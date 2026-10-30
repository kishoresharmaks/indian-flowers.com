// Issue #1: noindex on account pages.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account | Indian-Flowers.com',
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

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
