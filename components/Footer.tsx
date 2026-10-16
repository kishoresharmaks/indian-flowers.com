'use client';

import React from 'react';
import Link from 'next/link';
import {
  Flower2,
  Phone,
  Mail,
  MapPin,
  Building2,
  Navigation,
  ShieldCheck,
  Truck,
  Clock,
  Facebook,
  Instagram,
  Youtube,
  ArrowRight,
} from 'lucide-react';

interface FooterProps {
  categories?: { _id?: string; name: string }[];
  onSelectCategory?: (category: string) => void;
  onTrackOrderClick?: () => void;
  contactPhone?: string;
  contactEmail?: string;
}

export const PICKUP_LOCATIONS = [
  { city: 'Houston', state: 'TX', label: 'Houston, TX' },
  { city: 'Tampa', state: 'FL', label: 'Tampa, FL' },
  { city: 'Sacramento', state: 'CA', label: 'Sacramento, CA' },
  { city: 'Reminderville', state: 'OH', label: 'Reminderville, OH' },
  { city: 'Livermore', state: 'CA', label: 'Livermore, CA' },
  { city: 'Greenwood Village', state: 'CO', label: 'Greenwood Village, CO' },
  { city: 'Denver', state: 'CO', label: 'Denver, CO' },
];

export default function Footer({
  categories = [],
  onSelectCategory,
  onTrackOrderClick,
  contactPhone = '+1 (909) 379-3678',
  contactEmail = 'indianflowersorder@gmail.com',
}: FooterProps) {
  const handleCategoryClick = (catName: string) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenCookiePreferences = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
    }
  };

  return (
    <footer className="bg-[#0B3B24] text-white pt-16 pb-10 border-t border-[#0B3B24]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Column 1: Brand Info & Mission Statement */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Flower2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white leading-tight">
                  The Indian Flowers
                </h3>
                <span className="text-[10px] text-emerald-300 font-medium tracking-wide uppercase">
                  Fresh Indian Garlands • USA
                </span>
              </div>
            </Link>

            <p className="text-xs text-white/80 leading-relaxed font-normal">
              We pride ourselves on delivering fresh and quality garlands that exceed our customer’s expectations with every order. Ensuring prompt delivery of our finest garlands across the United States.
            </p>

            {/* Direct Contact Details */}
            <div className="text-xs text-white/85 space-y-2 pt-1 font-normal">
              <a
                href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-2 hover:text-emerald-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{contactPhone}</span>
              </a>
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-2 hover:text-emerald-300 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="truncate">{contactEmail}</span>
              </a>
              <div className="flex items-start gap-2 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                <span className="text-[11.5px] leading-tight">
                  <strong>Main Location:</strong> 14922 Bobcat lane, Fontana, CA 92336, California, USA
                </span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5 text-white" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5 text-white" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-3.5 h-3.5 text-white" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links & Floral Categories */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
              Quick Links &amp; Shop
            </h4>
            <ul className="space-y-2 text-xs text-white/75 font-normal">
              <li>
                <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1.5 font-medium text-emerald-200">
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                  <span>About The Indian Flowers</span>
                </Link>
              </li>
              <li>
                <Link href="/#products-section" className="hover:text-white transition-colors">
                  All Fresh Indian Flowers
                </Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat._id || cat.name}>
                  {onSelectCategory ? (
                    <button
                      onClick={() => handleCategoryClick(cat.name)}
                      className="hover:text-white transition-colors text-left"
                    >
                      {cat.name}
                    </button>
                  ) : (
                    <Link href={`/?category=${encodeURIComponent(cat.name)}#products-section`} className="hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link href="/#custom-orders" className="hover:text-white transition-colors">
                  Custom Wedding Muhurtham Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
              Customer Care &amp; Legal
            </h4>
            <ul className="space-y-2 text-xs text-white/75 font-normal">
              {onTrackOrderClick ? (
                <li>
                  <button
                    onClick={onTrackOrderClick}
                    className="hover:text-white transition-colors text-left"
                  >
                    Track Your Order
                  </button>
                </li>
              ) : (
                <li>
                  <Link href="/?action=track" className="hover:text-white transition-colors">
                    Track Your Order
                  </Link>
                </li>
              )}
              <li>
                <Link href="/policy/shipping-policy" className="hover:text-white transition-colors">
                  USA Shipping &amp; Overnight Delivery
                </Link>
              </li>
              <li>
                <Link href="/policy/refund-policy" className="hover:text-white transition-colors">
                  24-Hour Freshness Guarantee
                </Link>
              </li>
              <li>
                <Link href="/policy/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy (CCPA/CPRA)
                </Link>
              </li>
              <li>
                <Link href="/policy/terms-and-conditions" className="hover:text-white transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/policy/disclaimer" className="hover:text-white transition-colors">
                  Disclaimer &amp; Disclosures
                </Link>
              </li>
              <li>
                <Link href="/policy/cookie-policy" className="hover:text-white transition-colors">
                  Cookie &amp; Tracking Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookiePreferences}
                  className="hover:text-white transition-colors text-left"
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Main Location, Other Locations & Pickup Hubs */}
          <div className="space-y-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Locations &amp; Pickup Hubs</span>
            </h4>

            {/* Main Location Card */}
            <div className="bg-emerald-950/70 border border-emerald-800/60 rounded-xl p-3 space-y-1 text-xs">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-300 block">
                ★ Main Location (HQ)
              </span>
              <p className="text-white font-medium text-[11.5px] leading-snug">
                14922 Bobcat lane, Fontana, CA 92336, California, USA
              </p>
              <p className="text-[11px] text-emerald-200/90 pt-0.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                <span>Mon – Sun: 7:00 AM – 8:00 PM PST</span>
              </p>
            </div>

            {/* Other Locations Card */}
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 space-y-1 text-xs">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300 block">
                Branch Location (Midwest)
              </span>
              <p className="text-white/90 text-[11px] leading-tight">
                6893 Alverno ln, Inver Grove Heights, MN 55077
              </p>
            </div>

            {/* Pickup Locations Pill Badges */}
            <div className="space-y-1.5">
              <span className="text-[10.5px] font-semibold text-white/80 block">
                Local Pickup Locations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PICKUP_LOCATIONS.map((loc) => (
                  <span
                    key={loc.label}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 text-[10.5px] text-white/90 font-medium transition-colors"
                  >
                    <Navigation className="w-2.5 h-2.5 text-emerald-300" />
                    <span>{loc.label}</span>
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-white/60 pt-0.5">
                Local pickup available for custom wedding garlands and bulk orders.
              </p>
            </div>
          </div>
        </div>

        {/* Highlight Guarantee Bar */}
        <div className="py-4 px-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Overnight cold-chain delivery to all 50 states across the USA.</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
            <span>100% Quality &amp; Freshness Guaranteed on Arrival</span>
          </div>
        </div>

        {/* Copyright Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div>
            &copy; {new Date().getFullYear()} <strong>The Indian Flowers</strong>. All Rights Reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-white/70">
            <Link href="/about" className="hover:text-white transition-colors">
              About Us
            </Link>
            <span>&bull;</span>
            <Link href="/policy/shipping-policy" className="hover:text-white transition-colors">
              Shipping Policy
            </Link>
            <span>&bull;</span>
            <Link href="/policy/refund-policy" className="hover:text-white transition-colors">
              Freshness Guarantee
            </Link>
            <span>&bull;</span>
            <Link href="/policy/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link href="/policy/terms-and-conditions" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>&bull;</span>
            <Link href="/policy/disclaimer" className="hover:text-white transition-colors">
              Disclaimer
            </Link>
            <span>&bull;</span>
            <Link href="/policy/cookie-policy" className="hover:text-white transition-colors">
              Cookies
            </Link>
            <span>&bull;</span>
            <button
              type="button"
              onClick={handleOpenCookiePreferences}
              className="hover:text-white transition-colors"
            >
              Cookie Preferences
            </button>
          </div>
          <div className="text-[11px] text-white/50">
            Prices in US Dollars (USD, $)
          </div>
        </div>
      </div>
    </footer>
  );
}
