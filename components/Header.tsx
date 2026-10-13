'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Truck,
  Zap,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Heart,
  Tag,
} from 'lucide-react';

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  onTrackClick: () => void;
  wishlistCount?: number;
  onWishlistClick?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories?: Array<{ _id?: string; name: string; image?: string }>;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  storeName?: string;
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
  storeName = 'Indian-Flowers.com',
  logoUrl,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Auto-hide navbar while scrolling down, auto-open when scrolling up or at the top
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 40) {
        // At or near top: always open
        setIsVisible(true);
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
        if (currentScrollY > lastScrollY && currentScrollY > 90) {
          // Scrolling down: auto hide
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up: auto open
          setIsVisible(true);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic category links derived directly from database categories
  const navCategories =
    categories && categories.length > 0 ? categories.map((c) => c.name) : [];

  const handleCategoryClick = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className={`w-full bg-white z-40 sticky top-0 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      } ${isScrolled ? 'shadow-md' : 'shadow-xs'}`}
    >
      {/* 1. Top Announcement Utility Bar */}
      <div className="bg-[#0B3B24] text-white/90 text-xs py-1.5 sm:py-2 px-4 border-b border-[#0B3B24]/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center flex-wrap justify-start gap-4 md:gap-6 text-[11px] sm:text-xs min-w-0">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <Truck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="truncate">Fresh Indian flowers, delivered across the USA</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Fast &amp; Fresh Delivery
            </span>
            <span className="hidden lg:flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Trusted by 10,000+ Customers
            </span>
          </div>

          {/* Right Contact Details */}
          <div className="hidden sm:flex items-center gap-5 text-[11px] sm:text-xs text-white/80 shrink-0">
            <a
              href="tel:+15105795199"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-300" />
              <span>+1 (510) 579-5199</span>
            </a>
            <a
              href="mailto:support@indian-flowers.com"
              className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-300" />
              <span>support@indian-flowers.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navbar */}
      <header className="bg-white border-b border-gray-100 py-2.5 sm:py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
          {/* Mobile Menu Trigger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-1 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Stylized Lotus Icon */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-50/60 border border-emerald-100 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 40 40"
                  className="w-7 h-7 sm:w-8 sm:h-8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Central Lotus Petal */}
                  <path
                    d="M20 5C20 5 13 14 13 22C13 26 16.5 29 20 29C23.5 29 27 26 27 22C27 14 20 5 20 5Z"
                    fill="#E0533C"
                  />
                  {/* Left Petal */}
                  <path
                    d="M17 12C17 12 8 18 8 24C8 28 11.5 31 16 30C12 26 14 19 17 12Z"
                    fill="#E58D3D"
                  />
                  {/* Right Petal */}
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

              <div className="min-w-0">
                <span className="font-serif text-[17px] sm:text-2xl font-normal text-[#134633] tracking-tight block leading-none truncate max-w-[11.5rem] sm:max-w-none">
                  Indian-Flowers.com
                </span>
                <span className="hidden sm:block text-[10px] sm:text-[11px] text-gray-500 font-normal mt-1 tracking-wide">
                  Indian Flowers for Every Occasion
                </span>
              </div>
            </Link>
          </div>

          {/* Centered Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-2">
            <div className="relative w-full flex items-center">
              <input
                type="text"
                placeholder="Search for flowers, garlands, leaves, or occasions..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-4 pr-12 py-2 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]/20 transition-all font-normal"
              />
              <button
                type="button"
                className="absolute right-1 w-8 h-8 rounded-full bg-[#0B3B24] hover:bg-[#082b1a] text-white flex items-center justify-center transition-colors shadow-xs"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Action Icons (Account, Wishlist, Cart) */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Account */}
            <button
              onClick={onTrackClick}
              className="hidden sm:flex flex-col items-center text-gray-600 hover:text-[#0B3B24] transition-colors group"
            >
              <User className="w-5 h-5 text-gray-500 group-hover:text-[#0B3B24]" />
              <span className="text-[11px] font-normal mt-0.5 hidden sm:inline">Account</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={onWishlistClick}
              className="flex flex-col items-center text-gray-700 hover:text-[#0B3B24] transition-colors group relative p-1.5"
              aria-label="View Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5 text-gray-600 group-hover:text-[#C85A78] transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#C85A78] text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-normal mt-0.5 hidden sm:inline">Wishlist</span>
            </button>

            {/* Cart Button with Count Badge */}
            <button
              onClick={onCartClick}
              className="flex flex-col items-center text-gray-700 hover:text-[#0B3B24] transition-colors group relative p-1.5"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-gray-600 group-hover:text-[#0B3B24]" />
                <span className="absolute -top-1.5 -right-2 bg-[#E0533C] text-white text-[10px] font-medium w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              </div>
              <span className="text-[11px] font-normal mt-0.5 hidden sm:inline">Cart</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden mt-2">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search for flowers, garlands..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0B3B24]"
            />
            <button
              type="button"
              className="absolute right-1 w-7 h-7 rounded-full bg-[#0B3B24] text-white flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Page Links Navigation Bar (Single line, compact, non-scrollable, without redundant 'All Categories') */}
      <nav className="bg-white border-b border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5 gap-2">
            {/* Category Navigation Links (Fits in a single clean line without scrolling) */}
            <div className="flex items-center gap-1 xl:gap-2 text-[12px] lg:text-[13px] font-medium text-gray-700">
              {navCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'text-[#0B3B24] font-semibold bg-emerald-50/90 shadow-2xs'
                        : 'text-gray-700 hover:text-[#0B3B24] hover:bg-gray-50 font-normal'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Right: Offers Pill */}
            <div className="shrink-0 pl-2">
              <Link
                href="/#products-section"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200/70 hover:bg-rose-100/70 transition-colors"
              >
                <Tag className="w-3 h-3 text-rose-500" />
                <span>Offers</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 h-screen w-72 bg-white shadow-2xl p-5 overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-serif text-lg font-normal text-[#134633]">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => handleCategoryClick('All')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedCategory === 'All' ? 'bg-emerald-50 text-[#0B3B24]' : 'text-gray-700'
                }`}
              >
                All Products
              </button>
              {navCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-50 text-[#0B3B24] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onWishlistClick) onWishlistClick();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
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
                  setIsMobileMenuOpen(false);
                  onTrackClick();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                Track Your Order
              </button>
              <div className="text-[11px] text-gray-500 pt-2 space-y-1">
                <p>📞 +1 (510) 579-5199</p>
                <p>✉️ support@indian-flowers.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
