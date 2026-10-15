'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Truck,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  Heart,
  Tag,
  ChevronRight,
} from 'lucide-react';

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  onTrackClick: () => void;
  wishlistCount?: number;
  onWishlistClick?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories?: Array<{ _id?: string; name: string; image?: string; slug?: string }>;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onMenuToggle?: (isOpen: boolean) => void;
  storeName?: string;
  storeTagline?: string;
  storePhone?: string;
  storeEmail?: string;
  logoUrl?: string;
}

export default function Header({
  cartItemCount,
  onCartClick,
  onTrackClick,
  wishlistCount = 0,
  onWishlistClick,
  searchQuery,
  onSearchChange,
  categories = [],
  selectedCategory = 'All',
  onSelectCategory,
  onMenuToggle,
  storeName = 'Indian-Flowers.com',
  storeTagline = 'Indian Flowers for Every Occasion',
  storePhone = '+1 (510) 579-5199',
  storeEmail = 'support@indian-flowers.com',
  logoUrl,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = (open?: boolean) => {
    setIsMobileMenuOpen((prev) => {
      const next = typeof open === 'boolean' ? open : !prev;
      if (!next) {
        // Drop focus from within drawer immediately before closing
        if (typeof document !== 'undefined' && drawerRef.current?.contains(document.activeElement)) {
          (document.activeElement as HTMLElement)?.blur();
          menuTriggerRef.current?.focus();
        }
      }
      if (onMenuToggle) onMenuToggle(next);
      return next;
    });
  };

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        toggleMobileMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      // When closing, ensure focus returns to trigger if still inside drawer
      if (drawerRef.current && drawerRef.current.contains(document.activeElement)) {
        (document.activeElement as HTMLElement)?.blur();
        menuTriggerRef.current?.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileMenuOpen]);

  // Smooth auto-hide navbar with hysteresis and requestAnimationFrame to avoid touch jitter
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Never auto-hide while the mobile drawer menu is active
          if (isMobileMenuOpen) {
            setIsVisible(true);
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }

          if (currentScrollY <= 25) {
            setIsVisible(true);
            setIsScrolled(false);
          } else {
            setIsScrolled(true);

            // Require minimum scroll delta of 12px to avoid jitter on touch bounce
            const delta = currentScrollY - lastScrollY;
            if (Math.abs(delta) > 10) {
              if (delta > 0 && currentScrollY > 100) {
                // Scrolling DOWN past 100px -> hide navbar smoothly
                setIsVisible(false);
              } else if (delta < 0) {
                // Scrolling UP -> reveal navbar smoothly
                setIsVisible(true);
              }
            }
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  // Dynamic category links derived directly from database categories
  const navCategories =
    categories && categories.length > 0 ? categories.map((c) => c.name) : [];

  const handleCategoryClick = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    toggleMobileMenu(false);
  };

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT & UTILITY BAR (Deep Forest Green #0B3B24) */}
      <div className="w-full bg-[#0B3B24] text-white/90 text-[11px] py-1 px-3 sm:px-6 lg:px-8 border-b border-[#0B3B24]/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Left Guarantees */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <span className="flex items-center gap-1.5 font-medium truncate text-white/95">
              <Truck className="w-3 h-3 text-emerald-300 shrink-0" />
              <span className="truncate">Fresh Indian flowers, delivered across the USA</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 font-medium text-white/90">
              <Clock className="w-3 h-3 text-emerald-300 shrink-0" />
              <span>Fast &amp; Fresh Delivery</span>
            </span>
            <span className="hidden xl:flex items-center gap-1.5 font-medium text-white/90">
              <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
              <span>Trusted by 10,000+ Customers</span>
            </span>
          </div>

          {/* Right Direct Contact Info (Dynamic from DB StoreSettings) */}
          <div className="flex items-center gap-3 sm:gap-5 text-white/90 shrink-0 text-[11px]">
            <a
              href={`tel:${storePhone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
              title="Call Customer Support"
            >
              <Phone className="w-3 h-3 text-emerald-300 shrink-0" />
              <span className="hidden sm:inline font-medium">{storePhone}</span>
            </a>
            <a
              href={`mailto:${storeEmail}`}
              className="hidden lg:flex items-center gap-1.5 hover:text-white transition-colors"
              title="Email Customer Support"
            >
              <Mail className="w-3 h-3 text-emerald-300 shrink-0" />
              <span className="font-medium">{storeEmail}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. STICKY MAIN NAVBAR */}
      <div
        className={`w-full z-40 sticky top-0 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.06)] border-b border-gray-100'
            : 'bg-white shadow-xs border-b border-gray-100/80'
        }`}
      >
        <header className="bg-white/0 py-2 sm:py-2.5 px-3 sm:px-6 lg:px-8 max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-6 lg:gap-8">
          {/* Left: Mobile Menu Trigger + Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {/* Mobile Hamburger Button with Smooth Icon Morph */}
            <button
              ref={menuTriggerRef}
              onClick={() => toggleMobileMenu()}
              className="md:hidden p-1.5 -ml-1 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 shrink-0 active:scale-95"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Menu
                  className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                  }`}
                />
                <X
                  className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                  }`}
                />
              </div>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group min-w-0">
              {/* Stylized Indian Lotus Icon */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F4F8F4] border border-emerald-100/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <svg
                  viewBox="0 0 40 40"
                  className="w-5.5 h-5.5 sm:w-7 sm:h-7"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Central Lotus Blossom Petal */}
                  <path
                    d="M20 5C20 5 13 14 13 22C13 26 16.5 29 20 29C23.5 29 27 26 27 22C27 14 20 5 20 5Z"
                    fill="#E0533C"
                  />
                  {/* Left Radiant Petal */}
                  <path
                    d="M17 12C17 12 8 18 8 24C8 28 11.5 31 16 30C12 26 14 19 17 12Z"
                    fill="#E58D3D"
                  />
                  {/* Right Radiant Petal */}
                  <path
                    d="M23 12C23 12 32 18 32 24C32 28 28.5 31 24 30C28 26 26 19 23 12Z"
                    fill="#E58D3D"
                  />
                  {/* Base Green Leaf Petals */}
                  <path
                    d="M11 26C7 28 6 32 8 33C11 34 16 32 18 29C15 28 12.5 27 11 26Z"
                    fill="#15803D"
                  />
                  <path
                    d="M29 26C33 28 34 32 32 33C29 34 24 32 22 29C25 28 27.5 27 29 26Z"
                    fill="#15803D"
                  />
                </svg>
              </div>

              {/* Brand Typography */}
              <div className="min-w-0">
                <span className="text-[14.5px] sm:text-xl font-bold text-[#134633] tracking-[-0.03em] block leading-tight truncate">
                  {storeName}
                </span>
                <span className="hidden sm:block text-[10px] sm:text-[10.5px] text-gray-500 font-normal tracking-wide mt-0.5">
                  {storeTagline}
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Input Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg xl:max-w-xl mx-2 lg:mx-4">
            <div className="relative w-full flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search flowers, garlands, leaves, or occasions..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-stone-50/90 hover:bg-stone-50 border border-stone-200/90 rounded-full text-xs sm:text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0B3B24] focus:bg-white focus:ring-2 focus:ring-[#0B3B24]/10 transition-all font-normal shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Action Items (Track Order, Wishlist, Cart) */}
          <div className="flex items-center gap-0.5 sm:gap-4 shrink-0">
            {/* Track Order */}
            <button
              onClick={onTrackClick}
              className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0B3B24] transition-colors group p-1.5 rounded-lg hover:bg-gray-50"
              aria-label="Track your order"
              title="Track your order"
            >
              <Truck className="w-4.5 h-4.5 text-gray-700 group-hover:text-[#0B3B24] transition-colors" />
              <span className="text-[10px] sm:text-[10.5px] font-medium text-gray-700 group-hover:text-[#0B3B24] mt-0.5 hidden sm:inline transition-colors whitespace-nowrap">
                Track Order
              </span>
            </button>

            {/* Wishlist */}
            <button
              onClick={onWishlistClick}
              className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0B3B24] transition-colors group relative p-1.5 rounded-lg hover:bg-gray-50"
              aria-label="View Wishlist"
            >
              <div className="relative">
                <Heart className="w-4.5 h-4.5 text-gray-700 group-hover:text-[#C85A78] transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#C85A78] text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[10.5px] font-medium text-gray-700 group-hover:text-[#0B3B24] mt-0.5 hidden sm:inline transition-colors">
                Wishlist
              </span>
            </button>

            {/* Cart with Count Badge */}
            <button
              onClick={onCartClick}
              className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0B3B24] transition-colors group relative p-1.5 mr-1 rounded-lg hover:bg-gray-50"
              aria-label="Open Cart Drawer"
            >
              <div className="relative">
                <ShoppingBag className="w-4.5 h-4.5 text-gray-700 group-hover:text-[#0B3B24] transition-colors" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#E0533C] text-white text-[9.5px] font-bold min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center shadow-xs border border-white">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[10.5px] font-medium text-gray-700 group-hover:text-[#0B3B24] mt-0.5 hidden sm:inline transition-colors">
                Cart
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden mt-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search flowers, garlands, leaves..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-stone-50/90 border border-stone-200/90 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0B3B24] focus:bg-white focus:ring-2 focus:ring-[#0B3B24]/10 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Category Quick-Nav (Visible at page top, collapses on scroll) */}
        <div
          className={`md:hidden overflow-x-auto flex items-center gap-1.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-all duration-300 ${
            isScrolled
              ? 'max-h-0 opacity-0 overflow-hidden pointer-events-none mt-0 pt-0 border-transparent'
              : 'max-h-12 opacity-100 mt-2 pt-1.5 border-t border-gray-100/90'
          }`}
        >
          {navCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[#0B3B24] text-white font-semibold shadow-xs'
                    : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 font-normal'
                }`}
              >
                {cat}
              </button>
            );
          })}
          <Link
            href="/#products-section"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-[#C85A78] bg-[#FDF2F4] border border-rose-200/70 shrink-0"
          >
            <Tag className="w-2.5 h-2.5 text-[#C85A78]" />
            <span>Offers</span>
          </Link>
        </div>
      </header>

      {/* 3. SUB-NAVIGATION CATEGORY BAR (Desktop, Single Line with Dynamic DB Categories & Offers Pill) */}
      <nav className="bg-white border-b border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5 gap-4">
            {/* Dynamic Category Navigation Links */}
            <div className="flex items-center gap-5 lg:gap-7 text-[12.5px] lg:text-[13px] font-medium text-gray-700 min-w-0 overflow-hidden">
              {navCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`whitespace-nowrap transition-colors py-0.5 ${
                      isSelected
                        ? 'text-[#0B3B24] font-semibold'
                        : 'text-gray-700 hover:text-[#0B3B24] font-normal'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Right: Offers Pill Button */}
            <div className="shrink-0 pl-2">
              <Link
                href="/#products-section"
                className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold text-[#C85A78] bg-[#FDF2F4] border border-rose-200/70 hover:bg-rose-100 transition-colors shadow-2xs"
              >
                <Tag className="w-3 h-3 text-[#C85A78]" />
                <span>Offers</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      </div>

      {/* 4. MOBILE SLIDE-OUT DRAWER MENU WITH SMOOTH OPEN & CLOSE ANIMATION */}
      {/* Backdrop (Smooth Fade-In / Fade-Out) */}
      <div
        className={`md:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => toggleMobileMenu(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel (Smooth Slide-In from left / Slide-Out to left) */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal={isMobileMenuOpen ? 'true' : undefined}
        aria-label="Navigation menu"
        inert={!isMobileMenuOpen ? ('' as any) : undefined}
        className={`md:hidden fixed inset-y-0 left-0 top-0 bottom-0 h-full w-[315px] max-w-[85vw] bg-white shadow-2xl flex flex-col z-[9999] overflow-hidden will-change-transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'translate-x-0 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.3)]'
            : '-translate-x-full pointer-events-none shadow-none'
        }`}
        style={{ height: '100%', minHeight: '100dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#F4F8F4] border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
                    <path d="M20 5C20 5 13 14 13 22C13 26 16.5 29 20 29C23.5 29 27 26 27 22C27 14 20 5 20 5Z" fill="#E0533C" />
                    <path d="M17 12C17 12 8 18 8 24C8 28 11.5 31 16 30C12 26 14 19 17 12Z" fill="#E58D3D" />
                    <path d="M23 12C23 12 32 18 32 24C32 28 28.5 31 24 30C28 26 26 19 23 12Z" fill="#E58D3D" />
                    <path d="M11 26C7 28 6 32 8 33C11 34 16 32 18 29C15 28 12.5 27 11 26Z" fill="#15803D" />
                    <path d="M29 26C33 28 34 32 32 33C29 34 24 32 22 29C25 28 27.5 27 29 26Z" fill="#15803D" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[15px] font-bold tracking-tight text-[#134633] block truncate">{storeName}</span>
                  <span className="text-[10px] text-gray-500 block truncate">{storeTagline}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  toggleMobileMenu(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
              {/* Dynamic Categories List */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase px-3 block mb-1">
                  Shop Categories
                </span>
                <button
                  onClick={() => handleCategoryClick('All')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    selectedCategory === 'All' ? 'bg-emerald-50 text-[#0B3B24]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>All Flowers</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                {navCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-emerald-50 text-[#0B3B24] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>

              {/* Special Links & Actions */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <Link
                  href="/#products-section"
                  onClick={() => toggleMobileMenu(false)}
                  className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold text-[#C85A78] bg-[#FDF2F4] border border-rose-200/70 hover:bg-rose-100/70 transition-colors flex items-center justify-between shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#C85A78]" />
                    <span>Special Offers &amp; Bundles</span>
                  </span>
                  <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                    Sale
                  </span>
                </Link>

                <button
                  onClick={() => {
                    toggleMobileMenu(false);
                    if (onWishlistClick) onWishlistClick();
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#C85A78]" />
                    <span>My Wishlist</span>
                  </span>
                  {wishlistCount > 0 && (
                    <span className="bg-[#C85A78] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    toggleMobileMenu(false);
                    onTrackClick();
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-emerald-600/30 bg-emerald-50/60 text-xs font-semibold text-[#0B3B24] hover:bg-emerald-100/70 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#0B3B24]" />
                    <span>Track Your Order</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#0B3B24]" />
                </button>
              </div>

              {/* Contact Details & Customer Guarantees */}
              <div className="pt-3 border-t border-gray-100 space-y-3 text-xs text-gray-600">
                <div className="space-y-2">
                  <a
                    href={`tel:${storePhone.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center gap-2 text-gray-800 font-medium hover:text-[#0B3B24]"
                  >
                    <Phone className="w-4 h-4 text-[#0B3B24]" />
                    <span>{storePhone}</span>
                  </a>
                  <a
                    href={`mailto:${storeEmail}`}
                    className="flex items-center gap-2 text-gray-800 font-medium hover:text-[#0B3B24]"
                  >
                    <Mail className="w-4 h-4 text-[#0B3B24]" />
                    <span className="truncate">{storeEmail}</span>
                  </a>
                </div>

                <div className="pt-2 text-[11px] text-gray-500 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Truck className="w-3.5 h-3.5 text-[#0B3B24]" />
                    <span>Fresh Indian flowers, delivered across USA</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-gray-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Freshness Guaranteed on Arrival</span>
                  </p>
                </div>
              </div>

              {/* Safe Area Bottom Padding */}
              <div className="h-6 pb-[env(safe-area-inset-bottom)]" />
            </div>
          </aside>
    </>
  );
}
