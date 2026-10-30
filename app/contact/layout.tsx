// Issue #7: Contact page had no metadata export — it was inheriting the root layout
// title/description ("Indian-Flowers.com — Fresh Indian Flowers…") on the contact page,
// giving Google a generic title. This layout adds proper, unique metadata.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Indian-Flowers.com — Wedding & Pooja Flower Orders USA',
  description:
    'Get in touch with Indian-Flowers.com for custom wedding garland consultations, Jai Mala orders, bulk pooja flower enquiries, and nationwide USA delivery support.',
  alternates: {
    canonical: 'https://indian-flowers.com/contact',
  },
  openGraph: {
    title: 'Contact Us | Indian-Flowers.com',
    description:
      'Reach out for wedding garland consultations, Jai Mala orders, and floral enquiries. Nationwide USA delivery.',
    url: 'https://indian-flowers.com/contact',
    siteName: 'Indian-Flowers.com',
    images: [
      {
        url: '/images/banners/hero-wedding-1920x650.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Indian-Flowers.com USA',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Indian-Flowers.com',
    description: 'Wedding garland consultations, Jai Mala orders, and floral enquiries. Nationwide USA delivery.',
    images: ['/images/banners/hero-wedding-1920x650.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
