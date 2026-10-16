'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Cookie,
  ShieldCheck,
  Check,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
} from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  consented: boolean;
  timestamp: string;
  version: string;
  categories: CookiePreferences;
  gpcApplied: boolean;
}

const STORAGE_KEY = 'if_cookie_consent_v1';
const CONSENT_VERSION = '2026.1';

export default function CookieConsentBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [hasGPC, setHasGPC] = useState(false);

  // Preference switches
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Do not show on admin or setup screens
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/setup')) {
      setIsVisible(false);
      return;
    }

    // Check Global Privacy Control signal
    const isGpcActive =
      typeof navigator !== 'undefined' &&
      (Boolean((navigator as any).globalPrivacyControl) ||
        Boolean((window as any).globalPrivacyControl));

    setHasGPC(isGpcActive);

    // Read stored consent
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CookieConsentRecord = JSON.parse(stored);
        if (parsed && parsed.consented) {
          setPreferences(parsed.categories || { necessary: true, analytics: false, marketing: false });
          setIsVisible(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read cookie consent from storage', e);
    }

    // If GPC is active, defaults should reflect opt-out
    if (isGpcActive) {
      setPreferences({ necessary: true, analytics: false, marketing: false });
    }

    // Delay display slightly for smooth page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    // Custom window event listener to allow re-opening preferences from footer
    const handleOpenPreferences = () => {
      setShowPreferences(true);
      setIsVisible(true);
    };

    window.addEventListener('open-cookie-preferences', handleOpenPreferences);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-cookie-preferences', handleOpenPreferences);
    };
  }, [pathname]);

  const saveConsent = (prefs: CookiePreferences) => {
    const record: CookieConsentRecord = {
      consented: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
      categories: prefs,
      gpcApplied: hasGPC,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      console.warn('Could not save cookie consent to storage', e);
    }

    setPreferences(prefs);
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleEssentialOnly = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie Consent & US Privacy Settings"
      aria-modal="true"
      className="fixed bottom-0 inset-x-0 sm:bottom-6 sm:right-6 sm:inset-x-auto sm:max-w-xl z-50 p-4 sm:p-0 animate-fadeIn"
    >
      <div className="bg-white/95 backdrop-blur-md text-stone-900 border border-stone-200/90 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 font-sans ring-1 ring-black/5">
        {/* Top Header Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B3B24] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Cookie className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0B3B24] tracking-tight">
                  Your Privacy &amp; Cookies
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  US Standards
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                Indian-Flowers.com &bull; Transparent Floral Shopping
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEssentialOnly}
            aria-label="Dismiss cookie notice with essential cookies only"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Privacy Control (GPC) Banner if detected */}
        {hasGPC && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Global Privacy Control (GPC) detected:</strong> Non-essential tracking is automatically disabled per your browser preference.
            </span>
          </div>
        )}

        {/* Main Explanatory Copy */}
        <p className="text-xs text-stone-600 leading-relaxed font-normal">
          We use strictly necessary cookies to keep your puja flowers in your cart, preserve handcrafted garland wishlists, and ensure secure 256-bit checkout across the United States. With your consent, we also use analytical and marketing cookies to enhance fresh overnight deliveries. We never sell your personal data.
        </p>

        {/* Granular Preference Drawer / Modal */}
        {showPreferences && (
          <div className="pt-2 border-t border-stone-100 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-extrabold text-[#0B3B24] uppercase tracking-wider">
                Manage Cookie Preferences
              </span>
              <Link
                href="/policy/cookie-policy"
                target="_blank"
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
              >
                Read Cookie Policy
              </Link>
            </div>

            {/* Category 1: Strictly Necessary (Always On) */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">
                    Strictly Necessary
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Required
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  Essential for cart items, wishlist storage, CSRF protection, and Razorpay US payment security. Cannot be disabled.
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="w-4 h-4 rounded text-[#0B3B24] accent-[#0B3B24] cursor-not-allowed opacity-80"
                  aria-label="Strictly Necessary Cookies (Always Active)"
                />
              </div>
            </div>

            {/* Category 2: Performance & Analytics */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">
                    Performance &amp; Analytics
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  Helps us understand flower transit route demand and page load speeds across US states anonymously.
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                    }
                    className="sr-only peer"
                    aria-label="Toggle Performance & Analytics Cookies"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B3B24]"></div>
                </label>
              </div>
            </div>

            {/* Category 3: Personalization & Marketing */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">
                    Festival &amp; Seasonal Updates
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  Allows us to notify you about auspicious muhurthams, fresh Diwali/Pongal floral cuts, and seasonal harvest deals.
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                    }
                    className="sr-only peer"
                    aria-label="Toggle Marketing and Seasonal Cookies"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B3B24]"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons & Links */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 text-[11px] text-stone-500 order-2 sm:order-1">
            <Link
              href="/policy/privacy-policy"
              className="hover:text-[#0B3B24] transition-colors underline"
            >
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link
              href="/policy/cookie-policy"
              className="hover:text-[#0B3B24] transition-colors underline"
            >
              Cookie Policy
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
            {!showPreferences ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
                  <span>Customize</span>
                </button>

                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Reject Non-Essential
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-bold text-xs shadow-sm transition-all"
                >
                  Accept All
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-2 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save My Preferences</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
