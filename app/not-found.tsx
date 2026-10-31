import type { Metadata } from 'next';
import NotFoundClient from '@/components/NotFoundClient';

export const metadata: Metadata = {
  title: 'Page Not Found (404) | The Indian Flowers USA',
  description:
    'The requested floral page could not be found. Redirecting you to our collection of fresh Indian flowers and handcrafted garlands.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <NotFoundClient />;
}
