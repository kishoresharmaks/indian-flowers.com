'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from './BrandLogo';
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
  Flower2,
  User,
  ChevronDown,
  LogOut,
  Package,
  Award,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onTrackClick?: () => void;
  wishlistCount?: number;
  onWishlistClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  categories?: Array<{ _id?: string; name: string; image?: string; slug?: string }>;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onMenuToggle?: (isOpen: boolean) => void;
  storeName?: string;
  storeTagline?: string;
  storePhone?: string;
  storeEmail?: string;
  logoUrl?: string;
  customer?: any | null;
  onCustomerChange?: (customer: any | null) => void;
}

export default function Header({
  cartItemCount,
  onCartClick,
  onTrackClick,
  wishlistCount,
  onWishlistClick,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory = 'All',
  onSelectCategory,
  onMenuToggle,
  storeName = 'The Indian Flowers',
  storeTagline = 'Fresh Indian Flowers for Every Occasion',
  storePhone = '+1 (909) 379-3678',
  storeEmail = 'indianflowersorder@gmail.com',
  logoUrl,
  customer,
  onCustomerChange,
}: HeaderProps) {
  const router = useRouter();
  const [internalCustomer, setInternalCustomer] = useState<any | null>(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Universal fallbacks for standalone pages
  const [internalCartCount, setInternalCartCount] = useState<number>(0);
  const [internalWishlistCount, setInternalWishlistCount] = useState<number>(0);
  const [internalCategories, setInternalCategories] = useState<Array<{ _id?: string; name: string }>>([]);
  const [internalSearch, setInternalSearch] = useState<string>('');

  const activeCustomer = customer !== undefined ? customer : internalCustomer;
  const activeCartCount = cartItemCount !== undefined ? cartItemCount : internalCartCount;
  const activeWishlistCount = wishlistCount !== undefined ? wishlistCount : internalWishlistCount;
  const activeCategories = categories && categories.length > 0 ? categories : internalCategories;
  const activeSearchQuery = searchQuery !== undefined ? searchQuery : internalSearch;

  // Sync localStorage cart & wishlist counts when standalone
  useEffect(() => {
    if (cartItemCount === undefined && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cart');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const count = parsed.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
            setInternalCartCount(count);
          }
        }
      } catch {}
    }
    if (wishlistCount === undefined && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('if_wishlist');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setInternalWishlistCount(parsed.length);
        }
      } catch {}
    }
    if ((!categories || categories.length === 0) && typeof window !== 'undefined') {
      fetch('/api/categories')
        .then((r) => r.json())
        .then((d) => {
          if (d && d.success && Array.isArray(d.data)) setInternalCategories(d.data);
        })
        .catch(() => {});
    }
  }, [cartItemCount, wishlistCount, categories]);

  useEffect(() => {
    if (customer === undefined) {
      fetch('/api/customer/me')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setInternalCustomer(data.customer);
            if (onCustomerChange) onCustomerChange(data.customer);
          } else {
            setInternalCustomer(null);
          }
        })
        .catch(() => setInternalCustomer(null));
    }
  }, [customer, onCustomerChange]);

  // Close dropdown on outside click or touch
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/customer/logout', { method: 'POST' });
      setInternalCustomer(null);
      if (onCustomerChange) onCustomerChange(null);
      setIsAccountDropdownOpen(false);
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = (open?: boolean) => {
    const next = typeof open === 'boolean' ? open : !isMobileMenuOpen;
    if (!next) {
      // Drop focus from within drawer immediately before closing
      if (typeof document !== 'undefined' && drawerRef.current?.contains(document.activeElement)) {
        (document.activeElement as HTMLElement)?.blur();
        menuTriggerRef.current?.focus();
      }
    }
    setIsMobileMenuOpen(next);
    if (onMenuToggle) onMenuToggle(next);
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
    activeCategories && activeCategories.length > 0 ? activeCategories.map((c: any) => c.name) : [];

  const handleCategoryClick = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      router.push(`/?category=${encodeURIComponent(cat)}#products-section`);
    }
    toggleMobileMenu(false);
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      router.push('/?checkout=true');
    }
  };

  const handleTrackClick = () => {
    if (onTrackClick) {
      onTrackClick();
    } else {
      router.push('/?action=track');
    }
  };

  const handleWishlistClick = () => {
    if (onWishlistClick) {
      onWishlistClick();
    } else {
      router.push('/?action=wishlist');
    }
  };

  const handleSearchChangeInternal = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeSearchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(activeSearchQuery.trim())}#products-section`);
    }
  };

  return (
    <>
      {/* UNIFIED STICKY HEADER: ANNOUNCEMENT BAR + MAIN NAVBAR */}
      <header className="w-full sticky top-0 z-40">
        {/* 1. TOP ANNOUNCEMENT & UTILITY BAR (Deep Forest Green #0B3B24) */}
        <div className="w-full bg-[#0B3B24] text-white/90 text-xs sm:text-[11px] py-2 sm:py-1.5 px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 border-b border-[#0B3B24]/40 min-h-[34px] sm:min-h-[32px] flex items-center">
          <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto flex items-center justify-between gap-2 sm:gap-3">
            {/* Left Guarantees */}
            <div className="flex items-center gap-2 sm:gap-6 min-w-0">
              <span className="flex items-center gap-1.5 font-medium truncate text-white/95 text-[11.5px] sm:text-xs">
                <Truck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
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
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="hidden sm:inline font-medium">{storePhone}</span>
              </a>
              <a
                href={`mailto:${storeEmail}`}
                className="hidden lg:flex items-center gap-1.5 hover:text-white transition-colors"
                title="Email Customer Support"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="font-medium">{storeEmail}</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. STICKY MAIN NAVBAR */}
        <div
          className={`w-full transition-all duration-200 ${
            isScrolled
              ? 'bg-white/95 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.06)] border-b border-gray-100'
              : 'bg-white shadow-xs border-b border-gray-100/80'
          }`}
        >
          {/* Note: overflow-hidden removed to allow absolute dropdown menus to render without clipping */}
          <div className="bg-white/0 py-2 sm:py-2.5 px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 max-w-full">
            <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto flex items-center justify-between gap-1 sm:gap-6 lg:gap-8">
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
                <BrandLogo storeName={storeName} storeTagline={storeTagline} size="md" />
              </div>

              {/* Center: Search Input Bar (Desktop) */}
              <div className="hidden md:flex flex-1 max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-2 lg:mx-4">
                <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search flowers, garlands, leaves, or occasions..."
                    value={activeSearchQuery}
                    onChange={(e) => handleSearchChangeInternal(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-stone-50/90 hover:bg-stone-50 border border-stone-200/90 rounded-full text-xs sm:text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0B3B24] focus:bg-white focus:ring-2 focus:ring-[#0B3B24]/10 transition-all font-normal shadow-2xs"
                  />
                  {activeSearchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchChangeInternal('')}
                      className="absolute right-3 p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              </div>

              {/* Right: Action Items (Customer Account, Track Order, Wishlist, Cart) */}
              <div className="flex items-center gap-0.5 sm:gap-4 shrink-0">
                {/* Customer Account / Sign In */}
                {activeCustomer ? (
                  <div className="relative" ref={accountDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                      className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0B3B24] transition-colors group p-1.5 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0B3B24]/20"
                      aria-label="Customer account menu"
                      aria-expanded={isAccountDropdownOpen}
                      title={`Account: ${activeCustomer.name}`}
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 text-[#0B3B24] border border-emerald-300 flex items-center justify-center text-[10px] sm:text-[11px] font-bold shadow-2xs">
                        {activeCustomer.name ? activeCustomer.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-medium text-gray-700 group-hover:text-[#0B3B24] mt-0.5 hidden sm:inline transition-colors max-w-[85px] sm:max-w-[105px] truncate">
                        {activeCustomer.name ? activeCustomer.name.split(' ')[0] : 'Account'}
                      </span>
                    </button>

                    {isAccountDropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-60 sm:w-64 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-gray-200/90 py-2 z-[100] animate-fadeIn"
                        style={{ minWidth: '220px' }}
                      >
                        <div className="px-4 py-2.5 border-b border-gray-100 bg-[#F4F8F4]/60 rounded-t-2xl">
                          <p className="text-xs font-bold text-gray-900 truncate">{activeCustomer.name}</p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{activeCustomer.email}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Active Account
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                              <span>⭐ {activeCustomer.pointsBalance || 0} pts</span>
                            </span>
                          </div>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/account"
                            onClick={() => setIsAccountDropdownOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0B3B24] flex items-center gap-2.5 transition-colors"
                          >
                            <User className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Profile &amp; Delivery Address</span>
                          </Link>
                          <Link
                            href="/account?tab=orders"
                            onClick={() => setIsAccountDropdownOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0B3B24] flex items-center gap-2.5 transition-colors"
                          >
                            <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>My Order History</span>
                          </Link>
                          <Link
                            href="/account?tab=loyalty"
                            onClick={() => setIsAccountDropdownOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0B3B24] flex items-center gap-2.5 transition-colors"
                          >
                            <Award className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Loyalty Rewards ({activeCustomer.pointsBalance || 0} pts)</span>
                          </Link>
                        </div>
                        <div className="pt-1 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0B3B24] transition-colors group p-1.5 rounded-lg hover:bg-gray-50"
                    aria-label="Sign In to your account"
                    title="Sign In"
                  >
                    <User className="w-4.5 h-4.5 text-gray-700 group-hover:text-[#0B3B24] transition-colors" />
                    <span className="text-[10px] sm:text-[10.5px] font-medium text-gray-700 group-hover:text-[#0B3B24] mt-0.5 hidden sm:inline transition-colors whitespace-nowrap">
                      Sign In
                    </span>
                  </Link>
                )}

                {/* Track Order */}
                <button
                  onClick={handleTrackClick}
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
                  onClick={handleWishlistClick}
                  className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0B3B24] transition-colors group relative p-1.5 rounded-lg hover:bg-gray-50"
                  aria-label="View Wishlist"
                >
                  <div className="relative">
                    <Heart className="w-4.5 h-4.5 text-gray-700 group-hover:text-[#C85A78] transition-colors" />
                    {activeWishlistCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-[#C85A78] text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center shadow-xs">
                        {activeWishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[10.5px] font-medium text-gray-700 group-hover:text-[#0B3B24] mt-0.5 hidden sm:inline transition-colors">
                    Wishlist
                  </span>
                </button>

                {/* Cart with Count Badge */}
                <button
                  onClick={handleCartClick}
                  className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0B3B24] transition-colors group relative p-1.5 mr-1 rounded-lg hover:bg-gray-50"
                  aria-label="Open Cart Drawer"
                >
                  <div className="relative">
                    <ShoppingBag className="w-4.5 h-4.5 text-gray-700 group-hover:text-[#0B3B24] transition-colors" />
                    {activeCartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#E0533C] text-white text-[9.5px] font-bold min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center shadow-xs border border-white">
                        {activeCartCount}
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
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search flowers, garlands, leaves..."
                  value={activeSearchQuery}
                  onChange={(e) => handleSearchChangeInternal(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-stone-50/90 border border-stone-200/90 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0B3B24] focus:bg-white focus:ring-2 focus:ring-[#0B3B24]/10 transition-all shadow-2xs"
                />
                {activeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChangeInternal('')}
                    className="absolute right-3 p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
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
      </div>

      {/* 3. SUB-NAVIGATION CATEGORY BAR (Desktop, Single Line with Dynamic DB Categories & Offers Pill) */}
      <nav className="bg-white border-b border-gray-100 hidden md:block">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
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

            {/* Right: About Us & Offers Pill Button */}
            <div className="shrink-0 pl-2 flex items-center gap-3">
              <Link
                href="/about"
                className="text-[12.5px] font-semibold text-gray-700 hover:text-[#0B3B24] transition-colors py-0.5"
              >
                About Us
              </Link>
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
      </header>

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
              <BrandLogo storeName={storeName} storeTagline={storeTagline} size="sm" asLink={false} />
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
              {/* Customer Account / Sign In (Mobile) */}
              {activeCustomer ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#0B3B24] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {activeCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{activeCustomer.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{activeCustomer.email}</p>
                      <p className="text-[10.5px] font-bold text-amber-800 mt-0.5">⭐ {activeCustomer.pointsBalance || 0} pts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href="/account?tab=loyalty"
                      onClick={() => toggleMobileMenu(false)}
                      className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                      title="Loyalty Rewards"
                    >
                      Rewards
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => toggleMobileMenu(false)}
                      className="text-xs font-semibold text-[#0B3B24] bg-white px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        toggleMobileMenu(false);
                        handleSignOut();
                      }}
                      className="p-1 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => toggleMobileMenu(false)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In / Create Account</span>
                </Link>
              )}

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
                  href="/about"
                  onClick={() => toggleMobileMenu(false)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-stone-200 text-xs font-semibold text-gray-800 hover:bg-stone-50 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Flower2 className="w-4 h-4 text-[#0B3B24]" />
                    <span>About The Indian Flowers</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

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
