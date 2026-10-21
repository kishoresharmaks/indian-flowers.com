'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from './BrandLogo';
import { THE_INDIAN_FLOWERS_MENU, NavigationMenuItem } from '@/lib/navigationMenu';
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
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  Package,
  Award,
  Coins,
  Facebook,
  Instagram,
  Youtube,
  Store,
} from 'lucide-react';
import { PinterestIcon } from './Footer';

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
  const [internalSearch, setInternalSearch] = useState<string>('');

  const activeCustomer = customer !== undefined ? customer : internalCustomer;
  const activeCartCount = cartItemCount !== undefined ? cartItemCount : internalCartCount;
  const activeWishlistCount = wishlistCount !== undefined ? wishlistCount : internalWishlistCount;
  const activeSearchQuery = searchQuery !== undefined ? searchQuery : internalSearch;

  // Sync localStorage cart & wishlist counts when standalone
  useEffect(() => {
    const updateCounts = () => {
      if (cartItemCount === undefined && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cart');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const count = parsed.reduce(
                (sum: number, item: any) => sum + (Number(item.quantity) || 1),
                0
              );
              setInternalCartCount(count);
            } else {
              setInternalCartCount(0);
            }
          } else {
            setInternalCartCount(0);
          }
        } catch {
          setInternalCartCount(0);
        }
      }
      if (wishlistCount === undefined && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('if_wishlist');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setInternalWishlistCount(parsed.length);
            } else {
              setInternalWishlistCount(0);
            }
          } else {
            setInternalWishlistCount(0);
          }
        } catch {
          setInternalWishlistCount(0);
        }
      }
    };

    updateCounts();

    window.addEventListener('cart-updated', updateCounts);
    window.addEventListener('wishlist-updated', updateCounts);
    window.addEventListener('storage', updateCounts);

    return () => {
      window.removeEventListener('cart-updated', updateCounts);
      window.removeEventListener('wishlist-updated', updateCounts);
      window.removeEventListener('storage', updateCounts);
    };
  }, [cartItemCount, wishlistCount]);

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
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<Record<string, boolean>>({});
  const [activeHoverMenu, setActiveHoverMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = (open?: boolean) => {
    const next = typeof open === 'boolean' ? open : !isMobileMenuOpen;
    if (!next) {
      if (typeof document !== 'undefined' && drawerRef.current?.contains(document.activeElement)) {
        (document.activeElement as HTMLElement)?.blur();
        menuTriggerRef.current?.focus();
      }
    }
    setIsMobileMenuOpen(next);
    if (onMenuToggle) onMenuToggle(next);
  };

  const toggleSubmenuAccordion = (menuTitle: string) => {
    setExpandedMobileMenus((prev) => ({
      ...prev,
      [menuTitle]: !prev[menuTitle],
    }));
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
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileMenuOpen]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuItemClick = (item: NavigationMenuItem) => {
    if (item.categoryFilter) {
      if (onSelectCategory) {
        onSelectCategory(item.categoryFilter);
      } else {
        router.push(`/?category=${encodeURIComponent(item.categoryFilter)}#products-section`);
      }
    } else if (item.href) {
      router.push(item.href);
    }
    toggleMobileMenu(false);
  };

  const handleSubItemClick = (sub: { title: string; href: string; categoryFilter: string }) => {
    if (onSelectCategory) {
      onSelectCategory(sub.categoryFilter);
    } else {
      router.push(`/?category=${encodeURIComponent(sub.categoryFilter)}#products-section`);
    }
    toggleMobileMenu(false);
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      window.dispatchEvent(new Event('open-cart'));
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
      window.dispatchEvent(new Event('open-wishlist'));
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
      toggleMobileMenu(false);
    }
  };

  return (
    <>
      {/* UNIFIED STICKY HEADER */}
      <header className="w-full sticky top-0 z-40 bg-white">
        {/* 1. TOP UTILITY ANNOUNCEMENT BAR (Deep Forest Green #0B3B24) */}
        <div className="w-full bg-[#0B3B24] text-white/90 text-xs sm:text-[11px] py-1.5 px-3 sm:px-6 lg:px-8 border-b border-[#0B3B24]/40 min-h-[32px] flex items-center">
          <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-3">
            {/* Left Guarantees */}
            <div className="flex items-center gap-2 sm:gap-5 min-w-0">
              <span className="flex items-center gap-1.5 font-medium truncate text-white/95 text-[11px] sm:text-xs">
                <Truck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="truncate">Fresh Indian flowers, delivered across the USA</span>
              </span>
              <span className="hidden md:flex items-center gap-1.5 font-medium text-white/85 text-[11px]">
                <Clock className="w-3 h-3 text-emerald-300 shrink-0" />
                <span>Fast &amp; Fresh Delivery</span>
              </span>
              <span className="hidden lg:flex items-center gap-1.5 font-medium text-white/85 text-[11px]">
                <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
                <span>Trusted by 10,000+ Customers</span>
              </span>
            </div>

            {/* Right Contact Info */}
            <div className="flex items-center gap-3 sm:gap-4 text-white/90 shrink-0 text-[11px]">
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
                className="hidden xl:flex items-center gap-1.5 hover:text-white transition-colors"
                title="Email Customer Support"
              >
                <Mail className="w-3 h-3 text-emerald-300 shrink-0" />
                <span className="font-medium">{storeEmail}</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. MAIN HEADER ROW (Mobile matches theindianflowers.com: ☰ MENU | Logo | Cart 0) */}
        <div
          className={`w-full transition-all duration-200 border-b border-stone-200/80 ${
            isScrolled ? 'bg-white/98 backdrop-blur-md shadow-xs' : 'bg-white'
          }`}
        >
          <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
            <div className="flex items-center justify-between gap-2 sm:gap-6">
              {/* MOBILE: Left Hamburger + "MENU" text (as in theindianflowers.com) */}
              <div className="flex items-center md:hidden">
                <button
                  ref={menuTriggerRef}
                  type="button"
                  onClick={() => toggleMobileMenu()}
                  className="flex items-center gap-1.5 py-1.5 px-2 -ml-1 text-stone-800 hover:text-[#0B3B24] rounded-lg transition-all active:scale-95 cursor-pointer"
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <Menu className="w-5 h-5 stroke-[2.4]" />
                  <span className="text-[12px] font-bold tracking-wider text-stone-800">MENU</span>
                </button>
              </div>

              {/* DESKTOP: Left Brand Logo */}
              <div className="hidden md:flex items-center shrink-0">
                <BrandLogo storeName={storeName} storeTagline={storeTagline} size="md" />
              </div>

              {/* MOBILE: Center Brand Logo */}
              <div className="flex md:hidden flex-1 justify-center items-center">
                <BrandLogo
                  storeName={storeName}
                  storeTagline={storeTagline}
                  size="sm"
                  showTagline={false}
                />
              </div>

              {/* DESKTOP: Center Search Bar */}
              <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg xl:max-w-xl mx-4">
                <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search flowers, garlands, leaves..."
                    value={activeSearchQuery}
                    onChange={(e) => handleSearchChangeInternal(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-stone-50 hover:bg-white border border-stone-200 rounded-full text-xs sm:text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ed2353] focus:bg-white focus:ring-2 focus:ring-[#ed2353]/10 transition-all font-normal shadow-2xs"
                  />
                  {activeSearchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchChangeInternal('')}
                      className="absolute right-3 p-1 text-stone-400 hover:text-stone-700 rounded-full transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              </div>

              {/* RIGHT ACTION BUTTONS */}
              <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
                {/* Desktop: Customer Account */}
                <div className="hidden sm:block relative" ref={accountDropdownRef}>
                  {activeCustomer ? (
                    <button
                      type="button"
                      onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                      className="flex flex-col items-center justify-center text-stone-700 hover:text-[#0B3B24] transition-colors p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer"
                      aria-label="Customer account menu"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B3B24] border border-emerald-300 flex items-center justify-center text-[10px] font-bold">
                        {activeCustomer.name ? activeCustomer.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-[10px] font-medium text-stone-700 mt-0.5 max-w-[80px] truncate">
                        {activeCustomer.name ? activeCustomer.name.split(' ')[0] : 'Account'}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="flex flex-col items-center justify-center text-stone-700 hover:text-[#0B3B24] transition-colors p-1.5 rounded-lg hover:bg-stone-50"
                      title="Sign In"
                    >
                      <User className="w-4.5 h-4.5 text-stone-700" />
                      <span className="text-[10px] font-medium text-stone-700 mt-0.5 whitespace-nowrap">
                        Sign In
                      </span>
                    </Link>
                  )}

                  {isAccountDropdownOpen && activeCustomer && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in">
                      <div className="px-4 py-2 border-b border-stone-100 bg-stone-50/80 rounded-t-2xl">
                        <p className="text-xs font-bold text-stone-900 truncate">{activeCustomer.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{activeCustomer.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="w-full px-4 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-[#0B3B24] flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-emerald-700" />
                          <span>Profile &amp; Orders</span>
                        </Link>
                        <Link
                          href="/account?tab=loyalty"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="w-full px-4 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-[#0B3B24] flex items-center gap-2"
                        >
                          <Award className="w-4 h-4 text-amber-600" />
                          <span>Loyalty Rewards ({activeCustomer.pointsBalance || 0} pts)</span>
                        </Link>
                      </div>
                      <div className="pt-1 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop: Wishlist */}
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  className="hidden sm:flex flex-col items-center justify-center text-stone-700 hover:text-[#ed2353] transition-colors relative p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer"
                  aria-label="Wishlist"
                >
                  <div className="relative">
                    <Heart className="w-4.5 h-4.5 text-stone-700" />
                    {activeWishlistCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-[#ed2353] text-white text-[9px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-xs">
                        {activeWishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-stone-700 mt-0.5">Wishlist</span>
                </button>

                {/* Cart Icon with Signature Pink Badge (Visible on Mobile & Desktop) */}
                <button
                  type="button"
                  onClick={handleCartClick}
                  className="flex flex-col items-center justify-center text-stone-800 hover:text-[#ed2353] transition-colors relative p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer"
                  aria-label="Open Shopping Cart"
                  title="Shopping cart"
                >
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5 sm:w-5 sm:h-5 stroke-[2]" />
                    <span className="absolute -top-1.5 -right-2.5 bg-[#ed2353] text-white text-[10px] font-bold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center shadow-xs">
                      {activeCartCount}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-stone-700 mt-0.5 hidden sm:inline">
                    Cart
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. DESKTOP MAIN NAVIGATION BAR (Recreated exactly from theindianflowers.com) */}
          <nav className="hidden md:block bg-white border-t border-stone-100">
            <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <ul className="flex items-center justify-start gap-6 lg:gap-8 py-2.5 text-[13px] font-semibold text-stone-800 tracking-tight">
                {THE_INDIAN_FLOWERS_MENU.map((item) => {
                  const hasSub = Boolean(item.subItems && item.subItems.length > 0);
                  const isHovered = activeHoverMenu === item.title;

                  return (
                    <li
                      key={item.title}
                      className="relative"
                      onMouseEnter={() => hasSub && setActiveHoverMenu(item.title)}
                      onMouseLeave={() => hasSub && setActiveHoverMenu(null)}
                    >
                      <button
                        type="button"
                        onClick={() => handleMenuItemClick(item)}
                        className={`flex items-center gap-1 py-1 hover:text-[#ed2353] transition-colors cursor-pointer ${
                          selectedCategory === item.categoryFilter
                            ? 'text-[#ed2353] font-bold'
                            : 'text-stone-700'
                        }`}
                      >
                        <span>{item.title}</span>
                        {hasSub && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isHovered ? 'rotate-180 text-[#ed2353]' : 'text-stone-400'
                            }`}
                          />
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {hasSub && isHovered && (
                        <div className="absolute left-0 top-full pt-1.5 z-50 min-w-[240px] animate-in fade-in duration-150">
                          <div className="bg-white rounded-xl shadow-xl border border-stone-100/90 py-2.5 px-1.5">
                            {item.subItems!.map((sub) => (
                              <button
                                key={sub.title}
                                type="button"
                                onClick={() => handleSubItemClick(sub)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:text-[#ed2353] hover:bg-rose-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <span>{sub.title}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#ed2353] transition-colors" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>
      </header>

      {/* 4. MOBILE SLIDE-OUT DRAWER MENU (Woodmart exact layout with Search + Accordion Menu) */}
      <div
        className={`md:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => toggleMobileMenu(false)}
        aria-hidden="true"
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal={isMobileMenuOpen ? 'true' : undefined}
        aria-label="Navigation menu"
        className={`md:hidden fixed inset-y-0 left-0 top-0 bottom-0 h-full w-[310px] max-w-[85vw] bg-white shadow-2xl flex flex-col z-[9999] overflow-hidden will-change-transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full pointer-events-none'
        }`}
        style={{ height: '100%', minHeight: '100dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with Logo and Close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0 bg-white">
          <BrandLogo storeName={storeName} storeTagline={storeTagline} size="sm" asLink={false} />
          <button
            type="button"
            onClick={() => toggleMobileMenu(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {/* Top Search Form inside Mobile Menu (matching theindianflowers.com) */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search for products"
              value={activeSearchQuery}
              onChange={(e) => handleSearchChangeInternal(e.target.value)}
              className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ed2353] focus:bg-white transition-all font-normal"
            />
            <button
              type="submit"
              className="absolute right-1 px-3 py-1.5 rounded-md bg-[#0B3B24] hover:bg-[#134633] text-white text-[11px] font-bold tracking-wide uppercase transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Customer Profile / Sign In Widget */}
          {activeCustomer ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#0B3B24] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {activeCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 truncate">{activeCustomer.name}</p>
                  <p className="text-[10.5px] text-stone-500 truncate">{activeCustomer.email}</p>
                </div>
              </div>
              <Link
                href="/account"
                onClick={() => toggleMobileMenu(false)}
                className="text-xs font-semibold text-[#0B3B24] bg-white px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                Account
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => toggleMobileMenu(false)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Login / Register</span>
            </Link>
          )}

          {/* Hierarchical Accordion Menu (Exact recreated structure from theindianflowers.com) */}
          <div className="border-t border-stone-100 pt-2 space-y-0.5">
            {THE_INDIAN_FLOWERS_MENU.map((item) => {
              const hasSub = Boolean(item.subItems && item.subItems.length > 0);
              const isExpanded = expandedMobileMenus[item.title];

              return (
                <div key={item.title} className="border-b border-stone-100/70 last:border-b-0">
                  <div className="flex items-center justify-between py-2">
                    <button
                      type="button"
                      onClick={() => handleMenuItemClick(item)}
                      className={`text-left text-[13.5px] font-semibold transition-colors flex-1 cursor-pointer ${
                        selectedCategory === item.categoryFilter
                          ? 'text-[#ed2353]'
                          : 'text-stone-800 hover:text-[#ed2353]'
                      }`}
                    >
                      {item.title}
                    </button>

                    {hasSub && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenuAccordion(item.title);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                        aria-label={`Toggle ${item.title} subcategories`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-[#ed2353]' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Submenu List */}
                  {hasSub && isExpanded && (
                    <div className="pl-3 pb-2 pt-0.5 space-y-1 animate-in fade-in duration-150">
                      {item.subItems!.map((sub) => (
                        <button
                          key={sub.title}
                          type="button"
                          onClick={() => handleSubItemClick(sub)}
                          className="w-full text-left py-1.5 px-2 rounded-md text-xs font-medium text-stone-600 hover:text-[#ed2353] hover:bg-rose-50/50 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{sub.title}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Action Links: Track Order & Wishlist */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <button
              type="button"
              onClick={() => {
                toggleMobileMenu(false);
                handleWishlistClick();
              }}
              className="w-full py-2 px-3 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#ed2353]" />
                <span>My Wishlist</span>
              </span>
              {activeWishlistCount > 0 && (
                <span className="bg-[#ed2353] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeWishlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                toggleMobileMenu(false);
                handleTrackClick();
              }}
              className="w-full py-2 px-3 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0B3B24]" />
                <span>Track Your Order</span>
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* Contact Details */}
          <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
            <a
              href={`tel:${storePhone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-2 text-stone-700 font-medium hover:text-[#0B3B24]"
            >
              <Phone className="w-3.5 h-3.5 text-[#0B3B24]" />
              <span>{storePhone}</span>
            </a>
            <a
              href={`mailto:${storeEmail}`}
              className="flex items-center gap-2 text-stone-700 font-medium hover:text-[#0B3B24]"
            >
              <Mail className="w-3.5 h-3.5 text-[#0B3B24]" />
              <span className="truncate">{storeEmail}</span>
            </a>
          </div>

          {/* Social Links (matching theindianflowers.com) */}
          <div className="pt-3 border-t border-stone-100">
            <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400 mb-2">
              Follow Us
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/indianflowersusa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#1877F2] hover:text-white flex items-center justify-center text-stone-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/indian_flowers_usa/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#E4405F] hover:text-white flex items-center justify-center text-stone-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com/@Indianflowers-2020"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#CD201F] hover:text-white flex items-center justify-center text-stone-600 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://in.pinterest.com/indianflowers01/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#BD081C] hover:text-white flex items-center justify-center text-stone-600 transition-colors"
                aria-label="Pinterest"
              >
                <PinterestIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="h-10 pb-[env(safe-area-inset-bottom)]" />
        </div>
      </aside>
    </>
  );
}
