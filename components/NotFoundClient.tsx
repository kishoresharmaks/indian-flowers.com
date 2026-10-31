'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Home,
  ShoppingBag,
  Search,
  ArrowRight,
  Sparkles,
  Flower2,
  Clock,
  Compass,
} from 'lucide-react';

const INITIAL_COUNTDOWN = 5; // seconds

export default function NotFoundClient() {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(INITIAL_COUNTDOWN);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused || isRedirecting) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRedirecting(true);
          router.replace('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isRedirecting, router]);

  const handleManualRedirect = (target: string = '/') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRedirecting(true);
    router.replace(target);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timerRef.current) clearInterval(timerRef.current);
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/shop');
    }
  };

  // Calculate progress percentage for smooth visual countdown bar
  const progressPercent = Math.max(0, Math.min(100, ((INITIAL_COUNTDOWN - countdown) / INITIAL_COUNTDOWN) * 100));

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between selection:bg-[#0B3B24] selection:text-white font-[family-name:var(--font-plus-jakarta)]">
      {/* Fallback auto-redirect for users without JavaScript */}
      <noscript>
        <meta httpEquiv="refresh" content={`5;url=/`} />
      </noscript>

      <Header />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-xl w-full mx-auto text-center">
          {/* Floral Decorative Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0B3B24] text-xs font-bold uppercase tracking-wider mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>404 &bull; Page Not Found</span>
          </div>

          {/* Large Hero 404 Display */}
          <div className="relative mb-4">
            <h1 className="text-7xl sm:text-8xl font-extrabold text-[#0B3B24]/15 tracking-tight select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Looking for Fresh Flowers?
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-stone-600 max-w-md mx-auto leading-relaxed mb-6 font-normal">
            The page you requested may have moved or no longer exists. We are automatically guiding you back to our fresh flower collections.
          </p>

          {/* Countdown & Visual Progress Bar */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs mb-8 text-left">
            <div className="flex items-center justify-between text-xs text-stone-600 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                <span>
                  {isRedirecting
                    ? 'Redirecting to homepage now...'
                    : isPaused
                    ? 'Auto-redirect paused'
                    : `Redirecting to homepage in ${countdown}s...`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-800 hover:text-[#0B3B24] hover:underline cursor-pointer"
              >
                {isPaused ? 'Resume redirect' : 'Stay on page'}
              </button>
            </div>

            {/* Progress line */}
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-[#0B3B24] transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Search Box on 404 */}
          <form onSubmit={handleSearchSubmit} className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isPaused) setIsPaused(true); // pause auto-redirect while typing
              }}
              placeholder="Search flowers, wedding garlands, pooja leaves..."
              className="w-full pl-11 pr-24 py-3 bg-white border border-stone-200 rounded-full text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0B3B24] focus:border-transparent transition-all shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => handleManualRedirect('/')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0B3B24] hover:bg-[#134633] active:bg-[#072718] text-white text-xs sm:text-sm font-bold tracking-wide shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Go to Homepage Now</span>
            </button>

            <Link
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-bold tracking-wide border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#0B3B24]" />
              <span>Browse All Flowers</span>
            </Link>
          </div>

          {/* Quick Category Discovery Pills */}
          <div className="pt-6 border-t border-stone-200/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 flex items-center justify-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span>Popular Collections</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/shop?category=wedding-garlands"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-stone-700 hover:text-[#0B3B24] border border-stone-200 hover:border-emerald-300 text-xs font-semibold transition-all shadow-2xs"
              >
                <Flower2 className="w-3 h-3 text-[#C85A78]" />
                <span>Wedding Garlands</span>
              </Link>
              <Link
                href="/shop?category=strings-and-leaves"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-stone-700 hover:text-[#0B3B24] border border-stone-200 hover:border-emerald-300 text-xs font-semibold transition-all shadow-2xs"
              >
                <Flower2 className="w-3 h-3 text-amber-500" />
                <span>Jasmine Strings (Mallipoo)</span>
              </Link>
              <Link
                href="/shop?category=temple-garlands"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-stone-700 hover:text-[#0B3B24] border border-stone-200 hover:border-emerald-300 text-xs font-semibold transition-all shadow-2xs"
              >
                <Flower2 className="w-3 h-3 text-emerald-600" />
                <span>Temple Garlands</span>
              </Link>
              <Link
                href="/shop?category=house-warming-garlands"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-stone-700 hover:text-[#0B3B24] border border-stone-200 hover:border-emerald-300 text-xs font-semibold transition-all shadow-2xs"
              >
                <Flower2 className="w-3 h-3 text-rose-500" />
                <span>Housewarming Garlands</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
