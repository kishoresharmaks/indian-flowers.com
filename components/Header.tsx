'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from './BrandLogo';
import PredictiveSearch from './search/PredictiveSearch';
import {
  Home,
  Search,
  ShoppingBag,
  Menu,
  X,
  Truck,
  Phone,
  Mail,
  MapPin,
  Heart,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  Package,
  Award,
  Facebook,
  Instagram,
  Youtube,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PinterestIcon } from './Footer';

export interface HeaderSubcategoryItem {
  _id?: string;
  name: string;
  slug?: string;
  image?: string;
  order?: number;
}

export interface HeaderCategoryItem {
  _id?: string;
  name: string;
  slug?: string;
  image?: string;
  order?: number;
  showOnHome?: boolean;
  subcategories?: HeaderSubcategoryItem[];
}

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onTrackClick?: () => void;
  wishlistCount?: number;
  onWishlistClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  categories?: HeaderCategoryItem[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  onSelectCategory?: (category: string, subcategory?: string) => void;
  onMenuToggle?: (isOpen: boolean) => void;
  storeName?: string;
  storeTagline?: string;
  storePhone?: string;
  storeEmail?: string;
  logoUrl?: string;
  customer?: any | null;
  onCustomerChange?: (customer: any | null) => void;
}

/**
 * Authentic Auspicious Indian Flower / Marigold Icon matching reference design
 */
function MarigoldIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#F59E0B" />
      <circle cx="12" cy="12" r="7.5" fill="#D97706" />
      <circle cx="12" cy="12" r="5" fill="#B45309" />
      <circle cx="12" cy="12" r="2.5" fill="#FDE68A" />
      <path
        d="M12 2C12 5 12 5 12 12M12 22C12 19 12 19 12 12M2 12C5 12 5 12 12 12M22 12C19 12 19 12 12 12"
        stroke="#FEF3C7"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M4.93 4.93L12 12M19.07 19.07L12 12M4.93 19.07L12 12M19.07 4.93L12 12"
        stroke="#FEF3C7"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Auspicious Whole Pooja Coconut Icon matching reference design
 */
function CoconutIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* Husk/shell outer */}
      <circle cx="12" cy="12" r="9.5" fill="#78350F" />
      {/* Inner shell edge */}
      <circle cx="12" cy="12" r="8" fill="#92400E" />
      {/* Coconut white meat */}
      <circle cx="12" cy="12" r="6.8" fill="#FEF3C7" />
      {/* Water cavity inside */}
      <circle cx="12" cy="12" r="4.5" fill="#ECFDF5" />
      {/* 3 distinctive eyes at top */}
      <circle cx="10" cy="9.5" r="1.1" fill="#451A03" />
      <circle cx="14" cy="9.5" r="1.1" fill="#451A03" />
      <circle cx="12" cy="14" r="1.1" fill="#451A03" />
    </svg>
  );
}

/**
 * Event Decoration Calendar Icon matching reference design
 */
function EventCalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
      <path d="M3 7C3 5.34315 4.34315 4 6 4H18C19.6569 4 21 5.34315 21 7V9H3V7Z" fill="#DC2626" />
      <rect x="7" y="2" width="2" height="4" rx="1" fill="#991B1B" />
      <rect x="15" y="2" width="2" height="4" rx="1" fill="#991B1B" />
      <circle cx="8" cy="13" r="1" fill="#DC2626" />
      <circle cx="12" cy="13" r="1" fill="#DC2626" />
      <circle cx="16" cy="13" r="1" fill="#DC2626" />
      <circle cx="8" cy="17" r="1" fill="#DC2626" />
      <circle cx="12" cy="17" r="1" fill="#DC2626" />
      <circle cx="16" cy="17" r="1" fill="#DC2626" />
    </svg>
  );
}

/**
 * 9-Dot Grid Icon for "More" Categories Menu
 */
function GridNineIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="13" cy="3" r="1.5" />
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="13" cy="8" r="1.5" />
      <circle cx="3" cy="13" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
      <circle cx="13" cy="13" r="1.5" />
    </svg>
  );
}

const DEFAULT_HEADER_CATEGORIES: HeaderCategoryItem[] = [
  {
    name: 'STRINGS & LEAVES',
    slug: 'strings-and-leaves',
    image: '/images/categories/cat-jasmine-strings.jpg',
    order: 1,
    subcategories: [
      { name: 'Strings / Jasmine Strings', slug: 'strings-jasmine-strings', image: '/images/products/prod-madurai-mallipoo.jpg', order: 1 },
      { name: 'Pooja Leaves', slug: 'pooja-leaves', image: '/images/products/prod-mango-leaves-mavilai.jpg', order: 2 },
      { name: 'Pooja Flowers', slug: 'pooja-flowers', image: '/images/products/prod-orange-marigold-loose.jpg', order: 3 },
      { name: 'Banana Leaves', slug: 'banana-leaves', image: '/images/products/prod-banana-leaves-cuts.jpg', order: 4 },
      { name: 'Coconut', slug: 'coconut', image: '/images/products/prod-durva-bilva-combo.jpg', order: 5 },
      { name: 'Decor Items', slug: 'decor-items', image: '/images/categories/cat-pooja-kits.jpg', order: 6 },
    ],
  },
  {
    name: 'WEDDING GARLANDS',
    slug: 'wedding-garlands',
    image: '/images/categories/cat-wedding-garlands.jpg',
    order: 2,
    subcategories: [
      { name: 'Wedding Garlands', slug: 'wedding-garlands-sub', image: '/images/categories/cat-wedding-garlands.jpg', order: 1 },
      { name: 'Rose Petal Garlands', slug: 'rose-petal-garlands', image: '/images/products/prod-rose-petal-varmala.jpg', order: 2 },
      { name: 'Button Rose Garlands', slug: 'button-rose-garlands', image: '/images/products/new/5-2.png', order: 3 },
      { name: 'Lilly Garlands', slug: 'lilly-garlands', image: '/images/products/prod-sampangi-string.jpg', order: 4 },
      { name: 'Carnation Garlands', slug: 'carnation-garlands', image: '/images/products/prod-carnation-rose-garland.jpg', order: 5 },
      { name: 'Exchange Garlands', slug: 'exchange-garlands', image: '/images/banners/hero-wedding-tif-exch.jpg', order: 6 },
      { name: 'North Indian Garlands', slug: 'north-indian-garlands', image: '/images/banners/hero-wedding-tif-rose.jpg', order: 7 },
      { name: 'Veni, Jadai', slug: 'veni-jadai', image: '/images/products/prod-jasmine-rose-veni.jpg', order: 8 },
    ],
  },
  {
    name: 'HOUSE WARMING GARLANDS',
    slug: 'house-warming-garlands',
    image: '/images/banners/hero-wedding-tif-temple.jpg',
    order: 3,
    subcategories: [
      { name: 'Button Rose Door Garlands', slug: 'button-rose-door-garlands', image: '/images/products/new/5-2.png', order: 1 },
      { name: 'Coconut Thoranam', slug: 'coconut-thoranam', image: '/images/products/prod-durva-bilva-combo.jpg', order: 2 },
      { name: 'Mango Leaves Thoranam', slug: 'mango-leaves-thoranam', image: '/images/products/prod-mango-leaves-mavilai.jpg', order: 3 },
      { name: 'Button Rose String', slug: 'button-rose-string', image: '/images/products/new/5-3.png', order: 4 },
    ],
  },
  {
    name: 'TEMPLE GARLANDS',
    slug: 'temple-garlands',
    image: '/images/products/prod-marigold-temple-garland.jpg',
    order: 4,
    subcategories: [
      { name: 'Temple and Pooja Garlands', slug: 'temple-and-pooja-garlands', image: '/images/products/prod-marigold-temple-garland.jpg', order: 1 },
      { name: 'Button Rose Pooja Garlands', slug: 'button-rose-pooja-garlands', image: '/images/products/new/5-4.png', order: 2 },
      { name: 'Lilly Garlands', slug: 'lilly-temple-garlands', image: '/images/products/prod-lotus-jasmine-garland.jpg', order: 3 },
      { name: 'Vadamalli Garlands', slug: 'vadamalli-garlands', image: '/images/products/prod-navagraha-pooja-mix.jpg', order: 4 },
      { name: 'Vilvam Garlands', slug: 'vilvam-garlands', image: '/images/products/prod-durva-bilva-combo.jpg', order: 5 },
      { name: 'Green Leaves Garlands', slug: 'green-leaves-garlands', image: '/images/products/prod-tulsi-mani-garland.jpg', order: 6 },
    ],
  },
];

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
  selectedSubcategory = '',
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

  // Active dropdown key on Desktop Nav Bar ('all-flowers' | 'wedding' | 'more' | categoryName | null)
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const navDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile drawer states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedCatName, setMobileExpandedCatName] = useState<string | null>('STRINGS & LEAVES');

  // Universal fallbacks for standalone pages
  const [internalCartCount, setInternalCartCount] = useState<number>(0);
  const [internalWishlistCount, setInternalWishlistCount] = useState<number>(0);
  const [internalSearch, setInternalSearch] = useState<string>('');
  const [internalCategories, setInternalCategories] = useState<HeaderCategoryItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  const drawerRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            setInternalCategories(data.data);
          }
        })
        .catch(() => {});
    }
  }, [categories]);

  const activeCategories: HeaderCategoryItem[] =
    categories && categories.length > 0
      ? categories
      : internalCategories.length > 0
      ? internalCategories
      : DEFAULT_HEADER_CATEGORIES;

  const activeCustomer = customer !== undefined ? customer : internalCustomer;
  const activeCartCount = cartItemCount !== undefined ? cartItemCount : internalCartCount;
  const activeWishlistCount = wishlistCount !== undefined ? wishlistCount : internalWishlistCount;
  const activeSearchQuery = searchQuery !== undefined ? searchQuery : internalSearch;

  // Sync localStorage cart & wishlist counts when standalone
  useEffect(() => {
    const updateCounts = () => {
      if (cartItemCount === undefined && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cart') || localStorage.getItem('if_cart');
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

  // Close dropdowns on outside click or touch
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setIsAccountDropdownOpen(false);
      }
      if (navContainerRef.current && !navContainerRef.current.contains(target)) {
        setOpenDropdownKey(null);
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

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) toggleMobileMenu(false);
        setOpenDropdownKey(null);
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

  // Universal selection handler
  const handleCategorySelect = (categoryName: string, subcategoryName?: string) => {
    setOpenDropdownKey(null);
    toggleMobileMenu(false);

    if (onSelectCategory) {
      onSelectCategory(categoryName, subcategoryName);
      if (categoryName === 'All') {
        const el = document.getElementById('products-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const el = document.getElementById(`category-${slug}`) || document.getElementById('products-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      const query = subcategoryName
        ? `/?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}#products-section`
        : categoryName === 'All'
        ? '/#products-section'
        : `/?category=${encodeURIComponent(categoryName)}#products-section`;
      router.push(query);
    }
  };

  // Debounced mouse enter/leave for navigation dropdowns
  const handleDropdownMouseEnter = (key: string) => {
    if (navDropdownTimeoutRef.current) clearTimeout(navDropdownTimeoutRef.current);
    setOpenDropdownKey(key);
  };

  const handleDropdownMouseLeave = () => {
    navDropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdownKey(null);
    }, 180);
  };

  return (
    <>
      {/* UNIFIED STICKY HEADER */}
      <header className="w-full sticky top-0 z-40 bg-white">
        {/* 1. TOP UTILITY ANNOUNCEMENT BAR (Deep Forest Green #0B3B24) */}
        <div className="w-full bg-[#0B3B24] text-white py-1.5 sm:py-2 px-3 sm:px-6 lg:px-8 border-b border-emerald-950/60 shadow-2xs min-h-[32px] sm:min-h-[34px] flex items-center font-sans">
          <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto flex items-center justify-between gap-3">
            {/* Left: Fresh Assurance */}
            <div className="hidden lg:flex items-center gap-2 text-white/90 text-[11.5px] shrink-0 font-medium">
              <span className="text-sm">🌿</span>
              <span>Dewy Fresh Across All 50 US States</span>
            </div>

            {/* Center: Featured FedEx & Southwest Delivery Notice */}
            <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 text-center min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[#8FE7B8] text-[9.5px] sm:text-[10px] font-extrabold tracking-wider uppercase shadow-2xs shrink-0">
                <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8FE7B8]" />
                <span>EXPRESS AIR</span>
              </span>
              <span className="text-[11px] sm:text-[12px] font-medium text-white tracking-tight truncate sm:overflow-visible">
                Fast &amp; Secure Delivery via{' '}
                <strong className="text-[#8FE7B8] font-bold tracking-normal">FedEx</strong> &amp;{' '}
                <strong className="text-[#8FE7B8] font-bold tracking-normal">Southwest</strong>
              </span>
              <span className="hidden xl:inline text-white/30">&bull;</span>
              <span className="hidden xl:inline text-[11px] text-white/80 font-normal whitespace-nowrap">
                Priority Overnight Cold-Chain
              </span>
            </div>

            {/* Right: Customer Care & Quick Track */}
            <div className="hidden sm:flex items-center gap-3 sm:gap-4 text-white/90 shrink-0 text-[11.5px]">
              <button
                type="button"
                onClick={handleTrackClick}
                className="hidden xl:inline-flex items-center gap-1.5 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Track your shipment"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="font-medium">Track Order</span>
              </button>
              <span className="hidden xl:inline text-white/30">|</span>
              <a
                href={`tel:${storePhone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors font-medium"
                title="Call Customer Support"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{storePhone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. MAIN HEADER ROW (Brand Logo | Center Search with Solid Dark Green Button | Account, Wishlist, Cart) */}
        <div
          className={`w-full transition-all duration-200 border-b border-stone-200/80 ${
            isScrolled ? 'bg-white/98 backdrop-blur-md shadow-xs' : 'bg-white'
          }`}
        >
          <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
            <div className="flex items-center justify-between gap-3 sm:gap-6">
              {/* MOBILE: Left Hamburger + "MENU" text */}
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

              {/* DESKTOP: Predictive Search Bar with Live Suggestions Dropdown */}
              <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg xl:max-w-xl mx-4">
                <PredictiveSearch
                  initialQuery={activeSearchQuery}
                  onQueryChange={handleSearchChangeInternal}
                  placeholder="Search flowers, garlands, leaves..."
                />
              </div>

              {/* RIGHT ACTION BUTTONS (Sign In, Wishlist with pink count, Cart with pink count) */}
              <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                {/* Desktop: Customer Account / Sign In */}
                <div className="hidden sm:block relative" ref={accountDropdownRef}>
                  {activeCustomer ? (
                    <button
                      type="button"
                      onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                      className="flex flex-col items-center justify-center text-stone-700 hover:text-[#0B3B24] transition-colors p-1 rounded-lg hover:bg-stone-50 cursor-pointer"
                      aria-label="Customer account menu"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B3B24] border border-emerald-300 flex items-center justify-center text-[10px] font-bold">
                        {activeCustomer.name ? activeCustomer.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-[11px] font-medium text-stone-700 mt-1 max-w-[80px] truncate">
                        {activeCustomer.name ? activeCustomer.name.split(' ')[0] : 'Account'}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="flex flex-col items-center justify-center text-stone-700 hover:text-[#0B3B24] transition-colors p-1 rounded-lg hover:bg-stone-50"
                      title="Sign In"
                    >
                      <User className="w-5 h-5 text-stone-700 stroke-[1.8]" />
                      <span className="text-[11px] font-medium text-stone-700 mt-1 whitespace-nowrap">
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

                {/* Desktop: Wishlist with Pink Badge 3 */}
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  className="hidden sm:flex flex-col items-center justify-center text-stone-700 hover:text-[#ed2353] transition-colors relative p-1 rounded-lg hover:bg-stone-50 cursor-pointer"
                  aria-label="Wishlist"
                >
                  <div className="relative">
                    <Heart className="w-5 h-5 text-stone-700 stroke-[1.8]" />
                    {activeWishlistCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-[#ed2353] text-white text-[10px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                        {activeWishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-stone-700 mt-1">Wishlist</span>
                </button>

                {/* Cart Icon with Signature Pink Badge 1 */}
                <button
                  type="button"
                  onClick={handleCartClick}
                  className="flex flex-col items-center justify-center text-stone-800 hover:text-[#0B3B24] transition-colors relative p-1 rounded-lg hover:bg-stone-50 cursor-pointer"
                  aria-label="Open Shopping Cart"
                  title="Shopping cart"
                >
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                    <span className="absolute -top-1.5 -right-2.5 bg-[#ed2353] text-white text-[10px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                      {activeCartCount}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-stone-700 mt-1 hidden sm:inline">
                    Cart
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. DESKTOP BOTTOM HORIZONTAL NAVBAR (Exact layout from user screenshot) */}
          <nav
            ref={navContainerRef}
            className="hidden md:block bg-white border-t border-stone-200/60 relative z-30 overflow-visible"
          >
            <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative overflow-visible">
              <ul className="flex items-center justify-start gap-1 lg:gap-2 xl:gap-3 2xl:gap-3.5 py-2 text-[12.5px] lg:text-[13px] font-medium text-stone-800 tracking-tight overflow-visible">
                {/* 1. Home (Mint Green Pill with House Icon) */}
                <li className="shrink-0">
                  <Link
                    href="/"
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory('All');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF5EF] border border-[#CDE5D6] text-[#0B3B24] font-bold text-[13px] hover:bg-[#ddede3] transition-colors"
                  >
                    <Home className="w-3.5 h-3.5 text-[#0B3B24]" />
                    <span>Home</span>
                  </Link>
                </li>

                {/* 2. About us */}
                <li className="shrink-0">
                  <Link
                    href="/about"
                    className="px-2 py-1.5 text-stone-700 hover:text-[#0B3B24] font-semibold transition-colors whitespace-nowrap uppercase tracking-wide text-[12px] lg:text-[12.5px] xl:text-[13px]"
                  >
                    About us
                  </Link>
                </li>

                {/* 3. Shop */}
                <li className="shrink-0">
                  <Link
                    href="/shop"
                    className="px-2 py-1.5 transition-colors whitespace-nowrap uppercase tracking-wide cursor-pointer font-semibold text-[12px] lg:text-[12.5px] xl:text-[13px] text-stone-700 hover:text-[#0B3B24]"
                  >
                    Shop
                  </Link>
                </li>

                {/* 4. Parent Categories with Subcategories */}
                {activeCategories.map((cat) => {
                  const hasSub = Array.isArray(cat.subcategories) && cat.subcategories.length > 0;
                  const isSelected = selectedCategory.trim().toLowerCase() === cat.name.trim().toLowerCase();
                  const isOpen = openDropdownKey === cat.name;

                  return (
                    <li
                      key={cat.slug || cat.name}
                      className="relative shrink-0"
                      onMouseEnter={() => hasSub && handleDropdownMouseEnter(cat.name)}
                      onMouseLeave={hasSub ? handleDropdownMouseLeave : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (hasSub) {
                            setOpenDropdownKey(isOpen ? null : cat.name);
                          } else {
                            handleCategorySelect(cat.name);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1.5 uppercase tracking-wide transition-colors whitespace-nowrap cursor-pointer group rounded-lg text-[12px] lg:text-[12.5px] xl:text-[13px] ${
                          isSelected || isOpen
                            ? 'text-[#0B3B24] font-bold'
                            : 'text-stone-700 hover:text-[#0B3B24] font-semibold'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {hasSub && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isOpen
                                ? 'rotate-180 text-[#0B3B24]'
                                : 'text-stone-400 group-hover:text-[#0B3B24]'
                            }`}
                          />
                        )}
                      </button>

                      {/* Direct Dropdown showing the subcategories */}
                      {hasSub && isOpen && (
                        <div
                          className="absolute left-0 top-full mt-1.5 min-w-[240px] max-w-[320px] bg-white rounded-2xl shadow-2xl border border-stone-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2"
                          style={{ filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.12))' }}
                        >
                          <div className="px-4 pb-1.5 mb-1 border-b border-stone-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              {cat.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCategorySelect(cat.name)}
                              className="text-[11px] font-semibold text-[#0B3B24] hover:underline cursor-pointer"
                            >
                              View All
                            </button>
                          </div>

                          <div className="space-y-0.5">
                            {cat.subcategories.map((sub: any) => {
                              const isSubSelected =
                                selectedCategory.trim().toLowerCase() === cat.name.trim().toLowerCase() &&
                                selectedSubcategory.trim().toLowerCase() === sub.name.trim().toLowerCase();
                              return (
                                <button
                                  key={sub.slug || sub.name}
                                  type="button"
                                  onClick={() => handleCategorySelect(cat.name, sub.name)}
                                  className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors flex items-center gap-2.5 cursor-pointer ${
                                    isSubSelected
                                      ? 'bg-emerald-50 text-[#0B3B24] font-bold'
                                      : 'text-stone-700 hover:bg-stone-50 hover:text-[#0B3B24]'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isSubSelected ? 'bg-emerald-600' : 'bg-stone-300'
                                    }`}
                                  />
                                  <span className="truncate">{sub.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}

                {/* 5. Blog */}
                <li className="shrink-0">
                  <Link
                    href="/blog"
                    className="px-2 py-1.5 text-stone-700 hover:text-[#0B3B24] font-semibold transition-colors whitespace-nowrap uppercase tracking-wide text-[12px] lg:text-[12.5px] xl:text-[13px]"
                  >
                    Blog
                  </Link>
                </li>

                {/* 6. Contact us */}
                <li className="shrink-0">
                  <Link
                    href="/contact"
                    className="px-2 py-1.5 text-stone-700 hover:text-[#0B3B24] font-semibold transition-colors whitespace-nowrap uppercase tracking-wide text-[12px] lg:text-[12.5px] xl:text-[13px]"
                  >
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </header>

      {/* 4. MOBILE SLIDE-OUT DRAWER MENU (Responsive) */}
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
        className={`md:hidden fixed inset-y-0 left-0 top-0 bottom-0 h-full w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col z-[9999] overflow-hidden will-change-transform transition-transform duration-300 ease-in-out ${
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
          {/* Top Search Form inside Mobile Menu */}
          <div className="w-full">
            <PredictiveSearch
              initialQuery={activeSearchQuery}
              onQueryChange={handleSearchChangeInternal}
              onClose={() => toggleMobileMenu(false)}
              placeholder="Search flowers, garlands..."
              isMobile={true}
            />
          </div>

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

          {/* Mobile Navigation Links */}
          <div className="border-t border-stone-100 pt-2 space-y-1">
            {/* 1. Home */}
            <Link
              href="/"
              onClick={() => {
                toggleMobileMenu(false);
                if (onSelectCategory) onSelectCategory('All');
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-sm font-semibold transition-colors bg-[#EAF5EF] text-[#0B3B24]"
            >
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4 text-[#0B3B24]" />
                <span>Home</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#0B3B24]/40" />
            </Link>

            {/* 2. About us */}
            <Link
              href="/about"
              onClick={() => toggleMobileMenu(false)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-50 hover:text-[#0B3B24] transition-colors"
            >
              <span>About us</span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </Link>

            {/* 3. Shop */}
            <Link
              href="/shop"
              onClick={() => toggleMobileMenu(false)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-50 hover:text-[#0B3B24] text-left"
            >
              <span>Shop All Flowers</span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </Link>

            {/* 4. Dynamic Categories */}
            {activeCategories.map((cat) => {
              const hasSub = Array.isArray(cat.subcategories) && cat.subcategories.length > 0;
              const isExpanded = mobileExpandedCatName === cat.name;

              if (hasSub) {
                return (
                  <div
                    key={cat.slug || cat.name}
                    className="rounded-lg overflow-hidden border border-emerald-100/70 bg-emerald-50/20"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpandedCatName(isExpanded ? null : cat.name)
                      }
                      className="w-full flex items-center justify-between py-2.5 px-3 text-sm font-bold text-[#0B3B24] bg-emerald-100/40 hover:bg-emerald-100/70 transition-colors"
                    >
                      <span>{cat.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#0B3B24] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-2 space-y-1 bg-white">
                        <button
                          type="button"
                          onClick={() => handleCategorySelect(cat.name)}
                          className="w-full text-left py-1.5 px-2.5 text-xs font-semibold text-[#0B3B24] hover:underline"
                        >
                          &bull; View All {cat.name}
                        </button>
                        {cat.subcategories.map((sub: any) => (
                          <button
                            key={sub.slug || sub.name}
                            type="button"
                            onClick={() => handleCategorySelect(cat.name, sub.name)}
                            className="w-full text-left py-1.5 px-2.5 text-xs font-medium text-stone-700 hover:text-[#0B3B24] hover:bg-stone-50 rounded"
                          >
                            &bull; {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={cat.slug || cat.name}
                  type="button"
                  onClick={() => handleCategorySelect(cat.name)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-50 hover:text-[#0B3B24] text-left"
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}

            {/* 5. Blog */}
            <Link
              href="/blog"
              onClick={() => toggleMobileMenu(false)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-50 hover:text-[#0B3B24] transition-colors"
            >
              <span>Blog</span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </Link>

            {/* 6. Contact us */}
            <Link
              href="/contact"
              onClick={() => toggleMobileMenu(false)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-50 hover:text-[#0B3B24] transition-colors"
            >
              <span>Contact us</span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </Link>
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

          {/* Social Links */}
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
