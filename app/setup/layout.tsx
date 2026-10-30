// Issue #1: noindex on setup/admin-init page.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup | Indian-Flowers.com',
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

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
