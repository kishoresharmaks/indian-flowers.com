'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import LotusLoader from './LotusLoader';

export default function GlobalPageLoader() {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname && (pathname.startsWith('/admin') || pathname.startsWith('/setup')));

  const [visible, setVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const prevPathRef = useRef(pathname);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear safety timeout helper
  const clearSafetyTimeout = () => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  };

  const LOADER_DURATION_MS = 3000; // Display for exactly 3 seconds

  // 1. Initial Page Load Splash Screen (3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 450);
      return () => clearTimeout(hideTimer);
    }, LOADER_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  // 2. Route Transition Detection (when pathname updates)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      clearSafetyTimeout();

      // Ensure visible upon arrival, then smoothly fade out after 3 seconds
      setVisible(true);
      setIsFading(false);

      const timer = setTimeout(() => {
        setIsFading(true);
        const hideTimer = setTimeout(() => {
          setVisible(false);
        }, 450);
        return () => clearTimeout(hideTimer);
      }, LOADER_DURATION_MS);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // 3. Instant Link Click Interceptor for Client Navigation
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');

      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !href.startsWith('//') &&
        !href.startsWith('/admin') &&
        !href.startsWith('/setup') &&
        !href.startsWith('/api') &&
        target.target !== '_blank' &&
        !target.hasAttribute('download')
      ) {
        const currentPath = window.location.pathname;
        const targetPath = href.split('?')[0].split('#')[0];
        if (targetPath !== currentPath) {
          clearSafetyTimeout();
          setVisible(true);
          setIsFading(false);

          // Failsafe: hide loader after 5.5s if route transition doesn't complete
          safetyTimeoutRef.current = setTimeout(() => {
            setIsFading(true);
            setTimeout(() => setVisible(false), 450);
          }, 5500);
        }
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      clearSafetyTimeout();
    };
  }, []);

  // 4. Custom Window Events for Manual Triggering
  useEffect(() => {
    const handleShow = () => {
      clearSafetyTimeout();
      setIsFading(false);
      setVisible(true);
    };

    const handleHide = () => {
      clearSafetyTimeout();
      setIsFading(true);
      setTimeout(() => setVisible(false), 450);
    };

    window.addEventListener('show-lotus-loader', handleShow);
    window.addEventListener('hide-lotus-loader', handleHide);

    return () => {
      window.removeEventListener('show-lotus-loader', handleShow);
      window.removeEventListener('hide-lotus-loader', handleHide);
    };
  }, []);

  if (isAdmin || !visible) return null;

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
      <LotusLoader label="Loading fresh flowers" fullScreen={true} />
    </div>
  );
}
