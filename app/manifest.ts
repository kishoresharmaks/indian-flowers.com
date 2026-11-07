import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Indian-Flowers.com — Fresh Indian Flowers, Garlands & Pooja Essentials in USA',
    short_name: 'Indian Flowers',
    description:
      'Authentic fresh Indian flowers, handcrafted garlands (Jai Mala, wedding garlands, temple garlands), jasmine strands (Mallipoo), pooja leaves, and ceremonial essentials delivered fresh across the United States.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0B3B24',
    icons: [
      {
        src: '/the-indian-flowers-emblem.png?v=5',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/the-indian-flowers-emblem-sm.webp?v=5',
        sizes: '128x128',
        type: 'image/webp',
      },
      {
        src: '/apple-touch-icon.png?v=5',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon.ico?v=5',
        sizes: '48x48 32x32 16x16',
        type: 'image/x-icon',
      },
    ],
  };
}
