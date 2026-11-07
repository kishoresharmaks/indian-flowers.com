'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: any;
  }
}

interface TawkChatProps {
  propertyId?: string;
  widgetId?: string;
}

export default function TawkChat({
  propertyId: propPropertyId,
  widgetId: propWidgetId,
}: TawkChatProps) {
  const pathname = usePathname();
  const [config, setConfig] = useState({
    propertyId: propPropertyId || process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '',
    widgetId: propWidgetId || process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || 'default',
    enabled: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Fetch settings from API if propertyId is not provided in env or props
  useEffect(() => {
    if (config.propertyId) return;

    let isMounted = true;
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data?.success || !data?.data) return;
        const s = data.data;
        if (s.tawkPropertyId) {
          setConfig({
            propertyId: s.tawkPropertyId,
            widgetId: s.tawkWidgetId || 'default',
            enabled: s.tawkEnabled !== false,
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [config.propertyId]);

  // 2. Initialize Tawk.to JavaScript API and inject script
  useEffect(() => {
    // Never load on admin, setup, login, or register screens
    if (
      !pathname ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/setup') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register')
    ) {
      if (typeof window !== 'undefined' && window.Tawk_API?.hideWidget) {
        try {
          window.Tawk_API.hideWidget();
        } catch {}
      }
      return;
    }

    if (!config.enabled || !config.propertyId) return;

    // Configure widget positioning BEFORE loading the script
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Position: Left side, stacked cleanly ABOVE the WhatsApp icon
    // Desktop: WhatsApp is at bottom: 24px (bottom-6), left: 24px (left-6), height: 56px (h-14).
    // Setting yOffset: 96 puts Tawk widget 16px above WhatsApp.
    // Mobile: WhatsApp is at bottom: 72px on the right.
    // Setting position: 'bl', xOffset: 16, yOffset: 76 puts Tawk on the left, clear of the 56px bottom bar.
    window.Tawk_API.customStyle = {
      visibility: {
        desktop: {
          position: 'bl',
          xOffset: 24,
          yOffset: 92,
        },
        mobile: {
          position: 'bl',
          xOffset: 16,
          yOffset: 76,
        },
        bubble: {
          rotate: '0deg',
          xOffset: 0,
          yOffset: 0,
        },
      },
      zIndex: 1000,
    };

    // Customer sync helper
    const syncCustomerAttributes = () => {
      try {
        const saved = localStorage.getItem('if_customer');
        if (saved && window.Tawk_API?.setAttributes) {
          const cust = JSON.parse(saved);
          if (cust && (cust.name || cust.email)) {
            window.Tawk_API.setAttributes(
              {
                name: cust.name || `${cust.firstName || ''} ${cust.lastName || ''}`.trim(),
                email: cust.email || '',
              },
              function () {}
            );
          }
        }
      } catch {}
    };

    window.Tawk_API.onLoad = function () {
      setIsLoaded(true);
      if (window.Tawk_API?.showWidget) {
        try {
          window.Tawk_API.showWidget();
        } catch {}
      }
      syncCustomerAttributes();
    };

    // Re-sync on customer auth changes
    window.addEventListener('customer-auth-changed', syncCustomerAttributes);

    // Inject Tawk.to script if not already present
    const scriptId = 'tawk-to-script';
    let s1 = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!s1) {
      s1 = document.createElement('script');
      s1.id = scriptId;
      s1.async = true;
      s1.src = `https://embed.tawk.to/${config.propertyId}/${config.widgetId || 'default'}`;
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      document.body.appendChild(s1);
    } else if (window.Tawk_API?.showWidget) {
      try {
        window.Tawk_API.showWidget();
      } catch {}
    }

    return () => {
      window.removeEventListener('customer-auth-changed', syncCustomerAttributes);
    };
  }, [pathname, config.enabled, config.propertyId, config.widgetId]);

  // NEVER render on admin, setup, or customer auth routes
  if (
    !pathname ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/setup') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')
  ) {
    return null;
  }

  // If Tawk.to is loaded and active, its official widget renders at customStyle coordinates
  if (isLoaded && config.propertyId) {
    return null;
  }

  // Fallback concierge trigger button (visible when Property ID is being configured or loading)
  // Stacked cleanly on the left side above WhatsApp
  return (
    <div
      className="fixed bottom-[72px] left-4 md:bottom-[92px] md:left-6 z-40 transition-all duration-300"
      style={{ display: config.enabled ? 'block' : 'none' }}
    >
      <button
        type="button"
        onClick={() => {
          if (window.Tawk_API?.maximize) {
            try {
              window.Tawk_API.maximize();
              return;
            } catch {}
          }
          // Friendly fallback to WhatsApp concierge if Tawk is still initializing
          const cleanPhone = '19098341722';
          window.open(
            `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              'Hello Indian Flowers team! I would like to chat with a florist about flowers and garlands.'
            )}`,
            '_blank'
          );
        }}
        aria-label="Live Florist Chat"
        title="Live Florist Chat (Online)"
        className="group flex items-center cursor-pointer active:scale-95 transition-all duration-200 h-[42px] px-3.5 gap-2 rounded-full bg-gradient-to-r from-[#0B3B24] to-[#134633] text-white text-xs font-semibold shadow-[0_8px_20px_rgba(11,59,36,0.35)] border-2 border-white/90 hover:scale-105 md:h-[52px] md:px-4 md:py-2 md:gap-3 md:rounded-full md:border md:border-white/30 md:shadow-[0_10px_28px_rgba(11,59,36,0.35),0_2px_8px_rgba(0,0,0,0.1)] md:hover:border-white/60 md:hover:shadow-[0_14px_36px_rgba(11,59,36,0.5)] md:hover:-translate-y-0.5 md:hover:scale-100"
      >
        {/* Mobile View (Preserved exactly as-is) */}
        <span className="flex md:hidden items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <MessageSquare className="w-4 h-4 text-emerald-300" />
          <span className="tracking-wide">Live Chat</span>
        </span>

        {/* Desktop View (Refined brand concierge) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/20 text-emerald-300 shadow-inner group-hover:scale-105 transition-transform">
            <MessageSquare className="w-4 h-4 fill-emerald-400/20 stroke-[2.2]" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-[#0B3B24]" />
            </span>
          </div>
          <div className="flex flex-col text-left leading-none">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[13px] font-bold text-white tracking-tight">Live Chat</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Online
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-100/75 tracking-normal">
              Talk to a Florist
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
