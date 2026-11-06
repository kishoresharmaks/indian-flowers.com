import { preload } from 'react-dom';
import connectToDatabase from '@/lib/db';
import Banner from '@/models/Banner';
import CustomerStoreClient from '@/components/home/CustomerStoreClient';
import { HeroSlide } from '@/components/HeroSection';

export const dynamic = 'force-dynamic';

export default async function CustomerStorePage() {
  let initialBanners: HeroSlide[] = [];

  try {
    await connectToDatabase();
    const banners = await Banner.find({ active: { $ne: false } })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    initialBanners = JSON.parse(JSON.stringify(banners));
  } catch (error) {
    console.error('[SSR] Failed to fetch banners for homepage SSR:', error);
  }

  const firstSlide = initialBanners[0];
  const desktopImageUrl = firstSlide?.image || firstSlide?.bgImage || '/images/banners/b1.jpg';
  const mobileImageUrl = firstSlide?.mobileImage || desktopImageUrl;

  if (mobileImageUrl) {
    // @ts-ignore
    preload(mobileImageUrl, { as: 'image', fetchPriority: 'high' });
  }
  if (desktopImageUrl && desktopImageUrl !== mobileImageUrl) {
    // @ts-ignore
    preload(desktopImageUrl, { as: 'image', fetchPriority: 'high' });
  }

  return (
    <>
      {/* High-priority preload for LCP Hero Banner to eliminate the 4,550ms discovery delay */}
      {mobileImageUrl && (
        <link
          rel="preload"
          as="image"
          href={mobileImageUrl}
          // @ts-ignore
          fetchpriority="high"
          media="(max-width: 639px)"
        />
      )}
      {desktopImageUrl && (
        <link
          rel="preload"
          as="image"
          href={desktopImageUrl}
          // @ts-ignore
          fetchpriority="high"
          media="(min-width: 640px)"
        />
      )}
      <CustomerStoreClient initialBanners={initialBanners} />
    </>
  );
}
