'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BrandLogo, { LotusIcon } from './BrandLogo';
import {
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
  ChevronDown,
  ShoppingBag,
  FileText,
  Lock,
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

export function PinterestIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12.004-5.367 12.004-11.987C24.014 5.367 18.637 0 12.017 0z" />
    </svg>
  );
}

export const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/indianflowersusa',
    icon: Facebook,
    ariaLabel: 'Follow The Indian Flowers on Facebook',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/indian_flowers_usa/',
    icon: Instagram,
    ariaLabel: 'Follow The Indian Flowers on Instagram',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@Indianflowers-2020',
    icon: Youtube,
    ariaLabel: 'Subscribe to The Indian Flowers on YouTube',
  },
  {
    name: 'Pinterest',
    href: 'https://in.pinterest.com/indianflowers01/',
    icon: PinterestIcon,
    ariaLabel: 'Follow The Indian Flowers on Pinterest',
  },
];

export const DEFAULT_FOOTER_CATEGORIES: { _id?: string; name: string }[] = [
  { _id: 'cat-wedding', name: 'Indian Wedding Garlands' },
  { _id: 'cat-nanthiyavattom', name: 'Nanthiyavattom Garlands' },
  { _id: 'cat-tuberose', name: 'Tube Rose Lily Garlands' },
  { _id: 'cat-pooja-flowers', name: 'Pooja flowers' },
  { _id: 'cat-pooja-leaves', name: 'Pooja leaves' },
  { _id: 'cat-strings', name: 'strings' },
  { _id: 'cat-decor', name: 'Decor Items' },
  { _id: 'cat-coconut', name: 'Coconut' },
  { _id: 'cat-event', name: 'Event Decoration' },
  { _id: 'cat-temple', name: 'Temple and Pooja Garlands' },
  { _id: 'cat-housewarming', name: 'House warming Garlands' },
  { _id: 'cat-veni', name: 'Veni' },
];

export default function Footer({
  categories = [],
  onSelectCategory,
  onTrackOrderClick,
  contactPhone = '+1 (909) 379-3678',
  contactEmail = 'indianflowersorder@gmail.com',
}: FooterProps) {
  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_FOOTER_CATEGORIES;

  // Mobile accordion state (collapsed by default on initial load)
  const [openSections, setOpenSections] = useState<{
    quickLinks: boolean;
    customerCare: boolean;
    locations: boolean;
  }>({
    quickLinks: false,
    customerCare: false,
    locations: false,
  });

  const toggleSection = (section: 'quickLinks' | 'customerCare' | 'locations') => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

  const phoneDigits = contactPhone.replace(/[^0-9+]/g, '');
  const mapSearchUrl = 'https://www.google.com/maps/search/?api=1&query=14922+Bobcat+lane,+Fontana,+CA+92336';

  return (
    <footer className="bg-[#0B3B24] text-white pt-6 sm:pt-7 pb-6 sm:pb-7 border-t border-emerald-900/60 overflow-hidden">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">

        {/* ========================================================= */}
        {/* 1. DEDICATED MOBILE & TABLET LAYOUT (< 1024px)            */}
        {/* Simplified, compact, accordion-driven, touch-optimized    */}
        {/* ========================================================= */}
        <div className="lg:hidden space-y-4 max-w-xl mx-auto">
          {/* A. Compact Centered Brand Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <BrandLogo variant="dark" size="md" />
            </div>
            <p className="text-xs text-white/75 max-w-xs mx-auto text-center leading-relaxed font-normal">
              We deliver fresh, authentic Indian garlands and flowers across the United States.
            </p>
          </div>

          {/* B. Quick Contact Actions & Social Media */}
          <div className="space-y-3 pt-1 pb-1">
            {/* 3 Circular Action Buttons */}
            <div className="flex items-center justify-center gap-7 sm:gap-9">
              {/* Call */}
              <a
                href={`tel:${phoneDigits}`}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={`Call us at ${contactPhone}`}
              >
                <div className="w-10 h-10 rounded-full bg-white text-[#0B3B24] flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                  <Phone className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xs font-semibold text-white/90">Call</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:${contactEmail}`}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={`Email us at ${contactEmail}`}
              >
                <div className="w-10 h-10 rounded-full bg-white text-[#0B3B24] flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white/90">Email</span>
              </a>

              {/* Map */}
              <a
                href={mapSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 group"
                aria-label="Open main location in Google Maps"
              >
                <div className="w-10 h-10 rounded-full bg-white text-[#0B3B24] flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white/90">Map</span>
              </a>
            </div>

            {/* Social Media Row */}
            <div className="flex items-center justify-center gap-2.5 pt-0.5">
              {SOCIAL_LINKS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#8FE7B8]/25 hover:text-[#8FE7B8] active:scale-95 text-white flex items-center justify-center transition-all"
                    aria-label={item.ariaLabel}
                    title={item.name}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* C. Three Expandable Accordion Sections */}
          <div className="space-y-2">
            {/* Accordion 1: Quick Links & Shop */}
            <div className="rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden transition-colors">
              <button
                type="button"
                id="mobile-quick-links-header"
                onClick={() => toggleSection('quickLinks')}
                aria-expanded={openSections.quickLinks}
                aria-controls="mobile-quick-links-content"
                className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left font-semibold text-xs sm:text-sm text-white hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#8FE7B8]" />
                  <span>Quick Links &amp; Shop</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                    openSections.quickLinks ? 'rotate-180 text-[#8FE7B8]' : ''
                  }`}
                />
              </button>
              {openSections.quickLinks && (
                <div
                  id="mobile-quick-links-content"
                  role="region"
                  aria-labelledby="mobile-quick-links-header"
                  className="px-4 pb-3 pt-1 border-t border-white/5 space-y-1.5 text-xs text-white/80"
                >
                  <Link href="/about" className="block py-1 text-emerald-200 font-medium hover:text-white transition-colors">
                    &rsaquo; About The Indian Flowers
                  </Link>
                  <Link href="/contact" className="block py-1 text-emerald-200 font-medium hover:text-white transition-colors">
                    &rsaquo; Contact Us
                  </Link>
                  <Link href="/#products-section" onClick={() => handleCategoryClick('All')} className="block py-1 hover:text-white transition-colors">
                    &rsaquo; All Fresh Indian Flowers
                  </Link>
                  {displayCategories.map((cat) => (
                    <Link
                      key={cat._id || cat.name}
                      href={`/?category=${encodeURIComponent(cat.name)}#products-section`}
                      onClick={() => handleCategoryClick(cat.name)}
                      className="block py-1 hover:text-white transition-colors"
                    >
                      &rsaquo; {cat.name}
                    </Link>
                  ))}
                  <Link href="/#custom-orders-section" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Custom Wedding Muhurtham Orders
                  </Link>
                </div>
              )}
            </div>

            {/* Accordion 2: Customer Care & Legal */}
            <div className="rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden transition-colors">
              <button
                type="button"
                id="mobile-customer-care-header"
                onClick={() => toggleSection('customerCare')}
                aria-expanded={openSections.customerCare}
                aria-controls="mobile-customer-care-content"
                className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left font-semibold text-xs sm:text-sm text-white hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8FE7B8]" />
                  <span>Customer Care &amp; Legal</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                    openSections.customerCare ? 'rotate-180 text-[#8FE7B8]' : ''
                  }`}
                />
              </button>
              {openSections.customerCare && (
                <div
                  id="mobile-customer-care-content"
                  role="region"
                  aria-labelledby="mobile-customer-care-header"
                  className="px-4 pb-3 pt-1 border-t border-white/5 space-y-1.5 text-xs text-white/80"
                >
                  {onTrackOrderClick ? (
                    <button
                      type="button"
                      onClick={onTrackOrderClick}
                      className="block w-full text-left py-1 hover:text-white transition-colors"
                    >
                      &rsaquo; Track Your Order
                    </button>
                  ) : (
                    <Link href="/?action=track" className="block py-1 hover:text-white transition-colors">
                      &rsaquo; Track Your Order
                    </Link>
                  )}
                  <Link href="/policy/shipping-policy" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; USA Shipping &amp; Overnight Delivery
                  </Link>
                  <Link href="/policy/refund-policy" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; 24-Hour Freshness Guarantee
                  </Link>
                  <Link href="/policy/privacy-policy" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Privacy Policy (CCPA/CPRA)
                  </Link>
                  <Link href="/policy/terms-and-conditions" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Terms &amp; Conditions
                  </Link>
                  <Link href="/policy/disclaimer" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Disclaimer &amp; Disclosures
                  </Link>
                  <Link href="/policy/cookie-policy" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Cookie &amp; Tracking Policy
                  </Link>
                  <button
                    type="button"
                    onClick={handleOpenCookiePreferences}
                    className="block w-full text-left py-1 text-emerald-200 hover:text-white transition-colors"
                  >
                    &rsaquo; Cookie Preferences
                  </button>
                </div>
              )}
            </div>

            {/* Accordion 3: Locations & Pickup Hubs */}
            <div className="rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden transition-colors">
              <button
                type="button"
                id="mobile-locations-header"
                onClick={() => toggleSection('locations')}
                aria-expanded={openSections.locations}
                aria-controls="mobile-locations-content"
                className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left font-semibold text-xs sm:text-sm text-white hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8FE7B8]" />
                  <span>Locations &amp; Pickup Hubs</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                    openSections.locations ? 'rotate-180 text-[#8FE7B8]' : ''
                  }`}
                />
              </button>
              {openSections.locations && (
                <div
                  id="mobile-locations-content"
                  role="region"
                  aria-labelledby="mobile-locations-header"
                  className="px-4 pb-3 pt-2 border-t border-white/5 space-y-2.5 text-xs"
                >
                  {/* Combined Hub Card */}
                  <div className="bg-emerald-950/80 border border-emerald-800/70 rounded-xl p-3 space-y-2.5">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#F5C542] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#F5C542] shrink-0" />
                        <span>Main Location (HQ)</span>
                      </span>
                      <p className="text-white font-semibold text-xs leading-snug pl-5 mt-1 select-text">
                        14922 Bobcat lane, Fontana, CA 92336, USA
                      </p>
                      <p className="text-[11px] text-emerald-100 pt-1 flex items-center gap-1.5 pl-5">
                        <Clock className="w-3 h-3 text-[#F5C542] shrink-0" />
                        <span>Mon &ndash; Sun: 7:00 AM &ndash; 8:00 PM PST</span>
                      </p>
                    </div>

                    <div className="border-t border-emerald-800/50 pt-2">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#F5C542] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#F5C542] shrink-0" />
                        <span>Branch Location (Midwest)</span>
                      </span>
                      <p className="text-white font-semibold text-xs leading-snug pl-5 mt-1 select-text">
                        6893 Alverno ln, Inver Grove Heights, MN 55077
                      </p>
                    </div>
                  </div>

                  {/* Local Pickup Locations */}
                  <div className="space-y-1 pt-0.5">
                    <span className="text-[10.5px] font-semibold text-white/90 block">
                      Local Pickup Locations:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {PICKUP_LOCATIONS.map((loc) => (
                        <span
                          key={loc.label}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] text-white/90 font-medium"
                        >
                          <Navigation className="w-2 h-2 text-[#8FE7B8]" />
                          <span>{loc.label}</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/60 pt-0.5 leading-relaxed">
                      Local pickup available for custom wedding garlands and bulk orders.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* E. Minimal Copyright Bar (Mobile) */}
          <div className="pt-3 border-t border-white/10 text-center text-xs text-white/70">
            <p className="text-[11px]">
              &copy; 2026{' '}
              <Link href="/" className="text-white font-medium hover:text-[#8FE7B8] transition-colors">
                The Indian Flowers
              </Link>
              . All Rights Reserved.
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. COMPACT, WELL-STRUCTURED DESKTOP LAYOUT (>= 1024px)     */}
        {/* Clean 4-column balanced grid with horizontal pickup hubs   */}
        {/* ========================================================= */}
        <div className="hidden lg:block space-y-4">
          {/* Top 4-Column Grid */}
          <div className="grid grid-cols-12 gap-6 xl:gap-8 items-start">
            {/* Column 1: Brand Info & Contact (4 cols) */}
            <div className="col-span-4 space-y-3">
              <BrandLogo variant="dark" size="md" />

              <p className="text-xs text-white/80 leading-relaxed font-normal max-w-sm">
                Authentic Indian floral garlands, fresh Madurai jasmine, and sacred pooja flora delivered with temperature-controlled cold-chain shipping across the USA.
              </p>

              {/* Direct Contact Details */}
              <div className="text-xs text-white/85 space-y-1.5 pt-0.5 font-normal">
                <a
                  href={`tel:${phoneDigits}`}
                  className="flex items-center gap-2 hover:text-[#8FE7B8] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#8FE7B8] shrink-0" />
                  <span>{contactPhone}</span>
                </a>
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 hover:text-[#8FE7B8] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#8FE7B8] shrink-0" />
                  <span className="truncate">{contactEmail}</span>
                </a>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-2 pt-0.5">
                {SOCIAL_LINKS.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#8FE7B8]/20 hover:text-[#8FE7B8] flex items-center justify-center transition-colors text-white"
                      aria-label={item.ariaLabel}
                      title={item.name}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Quick Links & Floral Categories (2.5 cols) */}
            <div className="col-span-2 space-y-2.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8FE7B8]">
                Quick Links &amp; Shop
              </h4>
              <ul className="space-y-1.5 text-xs text-white/75 font-normal">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1.5 font-medium text-emerald-200">
                    <ArrowRight className="w-3 h-3 text-[#8FE7B8]" />
                    <span>About Our Story</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-1.5 font-medium text-emerald-200">
                    <ArrowRight className="w-3 h-3 text-[#8FE7B8]" />
                    <span>Contact Us</span>
                  </Link>
                </li>
                <li>
                  <Link href="/#products-section" onClick={() => handleCategoryClick('All')} className="hover:text-white transition-colors">
                    All Fresh Flowers
                  </Link>
                </li>
                {displayCategories.map((cat) => (
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
                  <Link href="/#custom-orders-section" className="hover:text-white transition-colors">
                    Custom Wedding Orders
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care & Policies (2.5 cols) */}
            <div className="col-span-3 space-y-2.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8FE7B8]">
                Customer Care &amp; Legal
              </h4>
              <ul className="space-y-1.5 text-xs text-white/75 font-normal">
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

            {/* Column 4: Locations & Pickup Hubs (3 cols) */}
            <div className="col-span-3 space-y-2.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8FE7B8] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#8FE7B8]" />
                <span>Locations &amp; Pickup Hubs</span>
              </h4>

              {/* Combined Sleek Hubs Card */}
              <div className="bg-emerald-950/80 border border-emerald-800/70 rounded-xl p-3.5 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#F5C542] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#F5C542] shrink-0" />
                    <span>Main Location (HQ)</span>
                  </span>
                  <p className="text-white font-semibold text-xs leading-snug pl-5 mt-1 select-text">
                    14922 Bobcat lane, Fontana, CA 92336, USA
                  </p>
                  <p className="text-[11px] text-emerald-100 pl-5 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#F5C542] shrink-0" />
                    <span>Mon &ndash; Sun: 7:00 AM &ndash; 8:00 PM PST</span>
                  </p>
                </div>

                <div className="border-t border-emerald-800/50 pt-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#F5C542] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#F5C542] shrink-0" />
                    <span>Branch Location (Midwest)</span>
                  </span>
                  <p className="text-white font-semibold text-xs leading-snug pl-5 mt-1 select-text">
                    6893 Alverno ln, Inver Grove Heights, MN 55077
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Local Pickup Locations Strip: Clean, Full-Width, Space-Efficient */}
          <div className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white/90 text-xs flex items-center gap-1.5 shrink-0">
                <Navigation className="w-3.5 h-3.5 text-[#8FE7B8]" />
                <span>Local Pickup Locations:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PICKUP_LOCATIONS.map((loc) => (
                  <span
                    key={loc.label}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] text-white/95 font-medium transition-colors"
                  >
                    <span>{loc.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-emerald-200/80 font-normal shrink-0">
              Local pickup available for custom wedding garlands and bulk orders.
            </p>
          </div>

          {/* Copyright Bottom Bar (Desktop) */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
            <p className="text-[11.5px]">
              Copyright &copy; 2026{' '}
              <Link
                href="/"
                className="text-white font-medium hover:text-[#8FE7B8] transition-colors"
              >
                The Indian Flowers
              </Link>
              . All Rights Reserved.
            </p>

            <div className="flex items-center gap-4 text-[11px] text-emerald-200/80">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#8FE7B8]" />
                <span>Nationwide Overnight Cold-Chain Delivery</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8FE7B8]" />
                <span>All Prices in USD ($)</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
