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

export default function Footer({
  categories = [],
  onSelectCategory,
  onTrackOrderClick,
  contactPhone = '+1 (909) 379-3678',
  contactEmail = 'indianflowersorder@gmail.com',
}: FooterProps) {
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
    <footer className="bg-[#0B3B24] text-white pt-12 sm:pt-16 pb-10 border-t border-[#0B3B24] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ========================================================= */}
        {/* 1. DEDICATED MOBILE & TABLET LAYOUT (< 1024px)            */}
        {/* Simplified, compact, accordion-driven, touch-optimized    */}
        {/* ========================================================= */}
        <div className="lg:hidden space-y-6 max-w-xl mx-auto">
          {/* A. Compact Centered Brand Header */}
          <div className="text-center space-y-2.5">
            <Link href="/" className="inline-flex flex-col items-center group text-center">
              <div className="w-11 h-11 rounded-full bg-[#F4F8F4] border border-emerald-100/90 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform mb-2">
                <LotusIcon className="w-7 h-7" />
              </div>
              <span className="text-xl font-bold tracking-[-0.03em] text-white block leading-tight">
                The Indian Flowers
              </span>
              <span className="text-[10px] text-[#8FE7B8] font-semibold tracking-wider uppercase block mt-0.5">
                Fresh Indian Garlands &bull; USA
              </span>
            </Link>
            <p className="text-xs text-white/75 max-w-xs mx-auto text-center leading-relaxed font-normal">
              We deliver fresh and high-quality Indian garlands across the United States.
            </p>
          </div>

          {/* B. Quick Contact Actions & Social Media */}
          <div className="space-y-3.5 pt-1 pb-2">
            {/* 3 Circular Action Buttons */}
            <div className="flex items-center justify-center gap-7 sm:gap-9">
              {/* Call */}
              <a
                href={`tel:${phoneDigits}`}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={`Call us at ${contactPhone}`}
              >
                <div className="w-11 h-11 rounded-full bg-white text-[#0B3B24] flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                  <Phone className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xs font-semibold text-white/90">Call</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:${contactEmail}`}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={`Email us at ${contactEmail}`}
              >
                <div className="w-11 h-11 rounded-full bg-white text-[#0B3B24] flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                  <Mail className="w-5 h-5" />
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
                <div className="w-11 h-11 rounded-full bg-white text-[#0B3B24] flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white/90">Map</span>
              </a>
            </div>

            {/* Social Media Row */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* C. Three Expandable Accordion Sections */}
          <div className="space-y-2.5">
            {/* Accordion 1: Quick Links & Shop */}
            <div className="rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden transition-colors">
              <button
                type="button"
                id="mobile-quick-links-header"
                onClick={() => toggleSection('quickLinks')}
                aria-expanded={openSections.quickLinks}
                aria-controls="mobile-quick-links-content"
                className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-sm text-white hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2.5">
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
                  className="px-4 pb-4 pt-1 border-t border-white/5 space-y-2 text-xs text-white/80"
                >
                  <Link href="/about" className="block py-1 text-emerald-200 font-medium hover:text-white transition-colors">
                    &rsaquo; About The Indian Flowers
                  </Link>
                  <Link href="/#products-section" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; All Fresh Indian Flowers
                  </Link>
                  <Link href="/#products-section" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Fresh Flower Strings &amp; Jasmine
                  </Link>
                  <Link href="/#products-section" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Wedding &amp; Temple Garlands
                  </Link>
                  <Link href="/#products-section" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Loose Flowers for Daily Pooja
                  </Link>
                  <Link href="/#products-section" className="block py-1 hover:text-white transition-colors">
                    &rsaquo; Sacred Pooja Leaves &amp; Greenery
                  </Link>
                  <Link href="/#custom-orders" className="block py-1 hover:text-white transition-colors">
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
                className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-sm text-white hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2.5">
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
                  className="px-4 pb-4 pt-1 border-t border-white/5 space-y-2 text-xs text-white/80"
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
                className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-sm text-white hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2.5">
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
                  className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3 text-xs"
                >
                  {/* Main Location (HQ) Card */}
                  <div className="bg-emerald-950/70 border border-emerald-800/60 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#F5C542] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F5C542] shrink-0" />
                      <span>Main Location (HQ)</span>
                    </span>
                    <p className="text-white font-medium text-[11.5px] leading-snug pl-5">
                      14922 Bobcat lane, Fontana, CA 92336, California, USA
                    </p>
                    <p className="text-[11px] text-emerald-200/90 pt-0.5 flex items-center gap-1.5 pl-5">
                      <Clock className="w-3 h-3 text-[#F5C542] shrink-0" />
                      <span>Mon &ndash; Sun: 7:00 AM &ndash; 8:00 PM PST</span>
                    </p>
                  </div>

                  {/* Branch Location (Midwest) Card */}
                  <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#F5C542] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F5C542] shrink-0" />
                      <span>Branch Location (Midwest)</span>
                    </span>
                    <p className="text-white/90 text-[11px] leading-tight pl-5">
                      6893 Alverno ln, Inver Grove Heights, MN 55077
                    </p>
                  </div>

                  {/* Local Pickup Locations */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10.5px] font-semibold text-white/90 block">
                      Local Pickup Locations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PICKUP_LOCATIONS.map((loc) => (
                        <span
                          key={loc.label}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[10.5px] text-white/90 font-medium"
                        >
                          <Navigation className="w-2.5 h-2.5 text-[#8FE7B8]" />
                          <span>{loc.label}</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-[10.5px] text-white/60 pt-1 leading-relaxed">
                      Local pickup available for custom wedding garlands and bulk orders.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* D. Compact Trust and Delivery Strip (Mobile) */}
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 flex items-center justify-between text-xs text-white/85">
            <div className="flex items-center gap-2 flex-1 pr-2 min-w-0">
              <Truck className="w-4 h-4 text-[#8FE7B8] shrink-0" />
              <span className="text-[10.5px] leading-tight text-white/90 truncate sm:whitespace-normal">
                Overnight delivery to all 50 states.
              </span>
            </div>
            <div className="h-6 w-px bg-white/15 shrink-0 mx-2" />
            <div className="flex items-center gap-2 flex-1 pl-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-[#8FE7B8] shrink-0" />
              <span className="text-[10.5px] leading-tight font-medium text-emerald-200 truncate sm:whitespace-normal">
                100% Freshness Guaranteed.
              </span>
            </div>
          </div>

          {/* E. Minimal Copyright and Legal Bar (Mobile) */}
          <div className="pt-4 border-t border-white/10 text-center space-y-2 text-xs text-white/60">
            <div className="text-[11.5px] text-white/80">
              &copy; 2026{' '}
              <Link href="https://indian-flowers.com/" className="text-white font-medium hover:text-[#8FE7B8] transition-colors">
                The Indian Flowers
              </Link>
              . All Rights Reserved.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-white/70">
              <Link href="/policy/privacy-policy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span className="text-white/30">&bull;</span>
              <Link href="/policy/terms-and-conditions" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span className="text-white/30">&bull;</span>
              <Link href="/policy/cookie-policy" className="hover:text-white transition-colors">
                Cookies
              </Link>
              <span className="text-white/30">&bull;</span>
              <button
                type="button"
                onClick={handleOpenCookiePreferences}
                className="hover:text-white transition-colors"
              >
                Cookie Preferences
              </button>
            </div>
            <div className="text-[10px] text-white/40">
              Prices in US Dollars (USD, $)
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. APPROVED DESKTOP LAYOUT (>= 1024px)                     */}
        {/* Substantially unchanged 4-column structured layout        */}
        {/* ========================================================= */}
        <div className="hidden lg:block space-y-12">
          {/* Top 4-Column Grid */}
          <div className="grid grid-cols-4 gap-8 xl:gap-10">
            {/* Column 1: Brand Info & Mission Statement */}
            <div className="space-y-4">
              <BrandLogo variant="dark" size="md" />

              <p className="text-xs text-white/80 leading-relaxed font-normal">
                We pride ourselves on delivering fresh and quality garlands that exceed our customer’s expectations with every order. Ensuring prompt delivery of our finest garlands across the United States.
              </p>

              {/* Direct Contact Details */}
              <div className="text-xs text-white/85 space-y-2 pt-1 font-normal">
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
                <div className="flex items-start gap-2 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8FE7B8] shrink-0 mt-0.5" />
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
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8FE7B8]">
                Quick Links &amp; Shop
              </h4>
              <ul className="space-y-2 text-xs text-white/75 font-normal">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1.5 font-medium text-emerald-200">
                    <ArrowRight className="w-3 h-3 text-[#8FE7B8]" />
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
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8FE7B8]">
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
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8FE7B8] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#8FE7B8]" />
                <span>Locations &amp; Pickup Hubs</span>
              </h4>

              {/* Main Location Card */}
              <div className="bg-emerald-950/70 border border-emerald-800/60 rounded-xl p-3 space-y-1 text-xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#F5C542] block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#F5C542]" />
                  <span>Main Location (HQ)</span>
                </span>
                <p className="text-white font-medium text-[11.5px] leading-snug">
                  14922 Bobcat lane, Fontana, CA 92336, California, USA
                </p>
                <p className="text-[11px] text-emerald-200/90 pt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#F5C542] shrink-0" />
                  <span>Mon &ndash; Sun: 7:00 AM &ndash; 8:00 PM PST</span>
                </p>
              </div>

              {/* Other Locations Card */}
              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 space-y-1 text-xs">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#F5C542] block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#F5C542]" />
                  <span>Branch Location (Midwest)</span>
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
                      <Navigation className="w-2.5 h-2.5 text-[#8FE7B8]" />
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

          {/* Highlight Guarantee Bar (Desktop) */}
          <div className="py-4 px-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#8FE7B8] shrink-0" />
              <span>Overnight cold-chain delivery to all 50 states across the USA.</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-[#F5C542] shrink-0" />
              <span>100% Quality &amp; Freshness Guaranteed on Arrival</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Lock className="w-4 h-4 text-[#8FE7B8] shrink-0" />
              <span>Safe &amp; Secure Ordering with Your Privacy Protected</span>
            </div>
          </div>

          {/* Copyright Bottom Bar (Desktop) */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-4 text-xs text-white/60">
            <div className="text-white/80 text-xs">
              Copyright &copy; 2026{' '}
              <Link
                href="https://indian-flowers.com/"
                className="text-white font-medium hover:text-[#8FE7B8] hover:underline transition-colors"
              >
                Indian flowers
              </Link>
              . All Rights Reserved.{' '}
              <Link
                href="https://indian-flowers.com/privacy-policy/"
                className="text-white font-medium hover:text-[#8FE7B8] hover:underline transition-colors"
              >
                Privacy Policy
              </Link>{' '}
              | <span className="text-[#8FE7B8] font-semibold">Indian Flowers</span>
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

      </div>
    </footer>
  );
}
