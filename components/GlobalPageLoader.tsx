'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const LotusLoader = dynamic(() => import('./LotusLoader'), { ssr: false });

export default function GlobalPageLoader() {
  const pathname = usePathname();

  // Only show loading animation for private customer account area
  // Never block the public storefront (/, /shop, /product) to guarantee instant FCP,
  // 0ms LCP delay, and eliminate forced reflows.
  const isEligiblePage = Boolean(pathname?.startsWith('/account'));
  const isAdmin = Boolean(pathname && (pathname.startsWith('/admin') || pathname.startsWith('/setup')));

  const [visible, setVisible] = useState(isEligiblePage && !isAdmin);
  const [isFading, setIsFading] = useState(false);

  // Dismiss loader immediately upon client mount to unblock First Contentful Paint & visual rendering
  useEffect(() => {
    if (!isEligiblePage || isAdmin) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsFading(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 200);
      return () => clearTimeout(hideTimer);
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Only runs on full page mount / reload

  if (isAdmin || !isEligiblePage || !visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[999999]"
      style={{
        transition: 'opacity 450ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <LotusLoader
        label={pathname?.startsWith('/account') ? 'Loading your account' : 'Loading fresh flowers'}
        fullScreen={true}
      />
    </div>
  );
}
