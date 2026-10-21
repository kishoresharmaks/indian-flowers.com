'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import LotusLoader from './LotusLoader';

export default function GlobalPageLoader() {
  const pathname = usePathname();

  // ONLY show loading animation on full page reload / initial load for:
  // 1. Home page ('/')
  // 2. Accounts page ('/account')
  // NEVER for product view popup cards, cart drawer, product details, or other routes
  const isEligiblePage = pathname === '/' || pathname === '/account' || Boolean(pathname?.startsWith('/account'));
  const isAdmin = Boolean(pathname && (pathname.startsWith('/admin') || pathname.startsWith('/setup')));

  const [visible, setVisible] = useState(isEligiblePage && !isAdmin);
  const [isFading, setIsFading] = useState(false);

  // Full page load timer: exactly 3 seconds for Home and Accounts pages
  useEffect(() => {
    if (!isEligiblePage || isAdmin) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsFading(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 450);
      return () => clearTimeout(hideTimer);
    }, 3000);

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
