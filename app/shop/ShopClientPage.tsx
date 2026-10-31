'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard, { Product, ProductVariant } from '@/components/ProductCard';
import FloatingCartBar from '@/components/FloatingCartBar';
import { dispatchItemAdded } from '@/components/ItemAddedNotification';
import {
  ChevronRight,
  ArrowUpDown,
  Filter,
  Sparkles,
  Search,
  ShoppingBag,
  X,
  Layers,
  Check,
  RotateCcw,
} from 'lucide-react';

export interface SubcategoryItem {
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  count?: number;
}

export interface MainCategoryItem {
  _id?: string;
  name: string;
  slug: string;
  count?: number;
  subcategories?: SubcategoryItem[];
}

interface Props {
  initialProducts: Product[];
  initialNextCursor?: string | null;
  initialHasMore?: boolean;
  initialTotalCount?: number;
  mainCategories: MainCategoryItem[];
  initialCategory?: string;
  initialSubcategory?: string;
  initialSearch?: string;
  initialSort?: 'featured' | 'price-asc' | 'price-desc' | 'name';
}

export default function ShopClientPage({
  initialProducts = [],
  initialNextCursor = null,
  initialHasMore = false,
  initialTotalCount = 0,
  mainCategories = [],
  initialCategory = 'all',
  initialSubcategory = 'all',
  initialSearch = '',
  initialSort = 'featured',
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Storefront & Pagination State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount || initialProducts.length);

  // Filters & Sorting State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialSubcategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>(initialSort);

  // Reference to track last loaded query params to avoid redundant refetches
  const lastLoadedParamsRef = useRef<string>(searchParams ? searchParams.toString() : '');

  // Loading States
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Cart & Wishlist State
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Sync Wishlist from localStorage
  const syncWishlist = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('if_wishlist') || localStorage.getItem('wishlist');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
          return;
        }
      }
      setWishlist([]);
    } catch {
      setWishlist([]);
    }
  }, []);

  // Sync Cart from localStorage
  const syncCart = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
          return;
        }
      }
      setCartItems([]);
    } catch {
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    syncWishlist();
    syncCart();

    const handleWishlistUpdated = () => syncWishlist();
    const handleCartUpdated = () => syncCart();

    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('storage', handleWishlistUpdated);
    window.addEventListener('storage', handleCartUpdated);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('storage', handleWishlistUpdated);
      window.removeEventListener('storage', handleCartUpdated);
    };
  }, [syncWishlist, syncCart]);

  // Handle Add to Cart
  const handleAddToCart = (targetProduct: Product, variant?: ProductVariant) => {
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart');
      const currentCart = raw ? JSON.parse(raw) : [];
      const itemPrice = variant ? variant.price : targetProduct.price;

      const existingIndex = currentCart.findIndex(
        (i: any) =>
          i.product._id === targetProduct._id &&
          (variant ? i.selectedVariant?.name === variant.name : !i.selectedVariant)
      );

      let nextCart;
      if (existingIndex > -1) {
        nextCart = currentCart.map((item: any, idx: number) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        nextCart = [
          ...currentCart,
          {
            product: {
              _id: targetProduct._id,
              name: targetProduct.name,
              image: targetProduct.image,
              price: itemPrice,
              gst: targetProduct.gst || 0,
            },
            selectedVariant: variant ? { name: variant.name, price: variant.price } : undefined,
            quantity: 1,
          },
        ];
      }
      const json = JSON.stringify(nextCart);
      localStorage.setItem('cart', json);
      localStorage.setItem('if_cart', json);
      setCartItems(nextCart);
      window.dispatchEvent(new Event('cart-updated'));

      dispatchItemAdded({
        product: {
          _id: targetProduct._id,
          name: targetProduct.name,
          image: targetProduct.image,
          price: itemPrice,
        },
        variant: variant ? { name: variant.name, price: variant.price } : undefined,
        quantity: 1,
      });
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  // Handle Wishlist Toggle
  const handleToggleWishlist = (targetProduct: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p._id === targetProduct._id);
      const next = exists
        ? prev.filter((p) => p._id !== targetProduct._id)
        : [...prev, targetProduct];

      try {
        const json = JSON.stringify(next);
        localStorage.setItem('if_wishlist', json);
        localStorage.setItem('wishlist', json);
        window.dispatchEvent(new Event('wishlist-updated'));
      } catch (err) {
        console.error('Failed to persist wishlist:', err);
      }
      return next;
    });
  };

  // Core Cursor-Based Query Execution
  const fetchFilteredProducts = async ({
    category = selectedCategory,
    subcategory = selectedSubcategory,
    search = searchQuery,
    sort = sortBy,
    cursor = null,
    append = false,
  }: {
    category?: string;
    subcategory?: string;
    search?: string;
    sort?: 'featured' | 'price-asc' | 'price-desc' | 'name';
    cursor?: string | null;
    append?: boolean;
  }) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsFiltering(true);
    }

    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('categorySlug', category);
      if (subcategory && subcategory !== 'all') params.set('subcategory', subcategory);
      if (search && search.trim()) params.set('search', search.trim());
      params.set('sortBy', sort);
      params.set('limit', '16');
      params.set('paginate', 'true');
      params.set('excludeSeo', 'true');
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        if (append) {
          setProducts((prev) => [...prev, ...data.data]);
        } else {
          setProducts(data.data);
        }
        setNextCursor(data.nextCursor || null);
        setHasMore(!!data.hasMore);
        if (typeof data.totalCount === 'number') {
          setTotalCount(data.totalCount);
        }
      }
    } catch (err) {
      console.error('Failed to query products:', err);
    } finally {
      setIsLoadingMore(false);
      setIsFiltering(false);
    }
  };

  // Synchronize URL query parameters (e.g. /shop?category=wedding-garlands&subcategory=Rose+Petal+Garlands)
  useEffect(() => {
    const currentParamString = searchParams ? searchParams.toString() : '';
    // Skip if parameters match what is already loaded
    if (currentParamString === lastLoadedParamsRef.current) {
      return;
    }
    lastLoadedParamsRef.current = currentParamString;

    const rawSearch = searchParams.get('search') || searchParams.get('q') || '';
    const rawCat = searchParams.get('category') || searchParams.get('categorySlug') || '';
    const rawSub = searchParams.get('subcategory') || searchParams.get('subcat') || '';
    const rawSort = searchParams.get('sortBy') || searchParams.get('sort') || '';

    const hasParams = Boolean(
      rawSearch.trim() ||
      (rawCat && rawCat.toLowerCase() !== 'all') ||
      (rawSub && rawSub.toLowerCase() !== 'all') ||
      rawSort
    );

    if (!hasParams) {
      setSelectedCategory('all');
      setSelectedSubcategory('all');
      setSearchQuery('');
      setSortBy('featured');
      fetchFilteredProducts({
        category: 'all',
        subcategory: 'all',
        search: '',
        sort: 'featured',
        cursor: null,
        append: false,
      });
      return;
    }

    // Resolve Category
    let resolvedCatSlug = 'all';
    let matchedCat: MainCategoryItem | undefined;

    if (rawCat && rawCat.toLowerCase() !== 'all') {
      const cleanCat = rawCat.trim().toLowerCase();
      matchedCat = mainCategories.find(
        (c) =>
          c.slug.toLowerCase() === cleanCat ||
          c.name.trim().toLowerCase() === cleanCat ||
          c.slug.toLowerCase() === cleanCat.replace(/[^a-z0-9]+/g, '-') ||
          (cleanCat === 'strings-leaves' && c.slug === 'strings-and-leaves') ||
          (cleanCat === 'strings-and-leaves' && c.slug === 'strings-leaves')
      );
      resolvedCatSlug = matchedCat ? matchedCat.slug : cleanCat.replace(/[^a-z0-9]+/g, '-');
    }

    // Resolve Subcategory
    let resolvedSubName = 'all';
    if (rawSub && rawSub.toLowerCase() !== 'all') {
      const cleanSub = rawSub.trim().toLowerCase();
      const slugSub = cleanSub.replace(/[^a-z0-9]+/g, '-');
      let matchedSub: SubcategoryItem | undefined;
      let parentCat: MainCategoryItem | undefined;

      if (matchedCat && matchedCat.subcategories) {
        matchedSub = matchedCat.subcategories.find(
          (s) =>
            s.name.trim().toLowerCase() === cleanSub ||
            s.slug.toLowerCase() === cleanSub ||
            s.slug.toLowerCase() === slugSub ||
            s.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugSub
        );
        if (matchedSub) parentCat = matchedCat;
      }

      if (!matchedSub) {
        for (const cat of mainCategories) {
          if (cat.subcategories) {
            const m = cat.subcategories.find(
              (s) =>
                s.name.trim().toLowerCase() === cleanSub ||
                s.slug.toLowerCase() === cleanSub ||
                s.slug.toLowerCase() === slugSub ||
                s.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugSub
            );
            if (m) {
              matchedSub = m;
              parentCat = cat;
              break;
            }
          }
        }
      }

      if (matchedSub) {
        resolvedSubName = matchedSub.name;
        if (resolvedCatSlug === 'all' && parentCat) {
          resolvedCatSlug = parentCat.slug;
        }
      } else {
        resolvedSubName = rawSub.trim();
      }
    }

    const nextSort = (['featured', 'price-asc', 'price-desc', 'name'].includes(rawSort)
      ? rawSort
      : sortBy) as 'featured' | 'price-asc' | 'price-desc' | 'name';

    setSelectedCategory(resolvedCatSlug);
    setSelectedSubcategory(resolvedSubName);
    setSearchQuery(rawSearch.trim());
    if (rawSort) setSortBy(nextSort);

    fetchFilteredProducts({
      category: resolvedCatSlug,
      subcategory: resolvedSubName,
      search: rawSearch.trim(),
      sort: nextSort,
      cursor: null,
      append: false,
    });
  }, [searchParams, mainCategories, sortBy]);

  // Handlers for Filters
  const handleSelectMainCategory = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubcategory('all');

    const params = new URLSearchParams();
    if (slug !== 'all') params.set('category', slug);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (sortBy !== 'featured') params.set('sortBy', sortBy);
    const queryStr = params.toString();
    lastLoadedParamsRef.current = queryStr;
    window.history.replaceState(null, '', queryStr ? `/shop?${queryStr}` : '/shop');

    fetchFilteredProducts({
      category: slug,
      subcategory: 'all',
      search: searchQuery.trim(),
      sort: sortBy,
      cursor: null,
      append: false,
    });
  };

  const handleSelectSubcategory = (subName: string) => {
    const nextSub =
      selectedSubcategory.toLowerCase() === subName.toLowerCase() ? 'all' : subName;
    setSelectedSubcategory(nextSub);

    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (nextSub !== 'all') params.set('subcategory', nextSub);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (sortBy !== 'featured') params.set('sortBy', sortBy);
    const queryStr = params.toString();
    lastLoadedParamsRef.current = queryStr;
    window.history.replaceState(null, '', queryStr ? `/shop?${queryStr}` : '/shop');

    fetchFilteredProducts({
      category: selectedCategory,
      subcategory: nextSub,
      search: searchQuery.trim(),
      sort: sortBy,
      cursor: null,
      append: false,
    });
  };

  const handleSortChange = (newSort: 'featured' | 'price-asc' | 'price-desc' | 'name') => {
    setSortBy(newSort);

    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedSubcategory !== 'all') params.set('subcategory', selectedSubcategory);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (newSort !== 'featured') params.set('sortBy', newSort);
    const queryStr = params.toString();
    lastLoadedParamsRef.current = queryStr;
    window.history.replaceState(null, '', queryStr ? `/shop?${queryStr}` : '/shop');

    fetchFilteredProducts({
      sort: newSort,
      cursor: null,
      append: false,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedSubcategory !== 'all') params.set('subcategory', selectedSubcategory);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (sortBy !== 'featured') params.set('sortBy', sortBy);
    const queryStr = params.toString();
    lastLoadedParamsRef.current = queryStr;
    window.history.replaceState(null, '', queryStr ? `/shop?${queryStr}` : '/shop');

    fetchFilteredProducts({
      search: searchQuery,
      cursor: null,
      append: false,
    });
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSearchQuery('');
    setSortBy('featured');
    lastLoadedParamsRef.current = '';
    window.history.replaceState(null, '', '/shop');

    fetchFilteredProducts({
      category: 'all',
      subcategory: 'all',
      search: '',
      sort: 'featured',
      cursor: null,
      append: false,
    });
  };

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingMore) return;
    fetchFilteredProducts({
      cursor: nextCursor,
      append: true,
    });
  };

  // Cart Counts
  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );

  const cartGrandTotal = cartItems.reduce(
    (sum, item) =>
      sum +
      Number(item.product?.price || item.selectedVariant?.price || 0) * (Number(item.quantity) || 1),
    0
  );

  // Active Main Category Object
  const activeMainCategory = mainCategories.find(
    (c) => c.slug.toLowerCase() === selectedCategory.toLowerCase()
  );

  // Subcategories to display on left sidebar
  const visibleSubcategories = activeMainCategory
    ? activeMainCategory.subcategories || []
    : mainCategories.flatMap((c) => c.subcategories || []);

  const progressPercent = Math.min(100, Math.round((products.length / Math.max(1, totalCount)) * 100));

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between selection:bg-[#0B3B24] selection:text-white font-[family-name:var(--font-plus-jakarta)]">
      <Header
        cartItemCount={cartItemCount}
        wishlistCount={wishlist.length}
        onCartClick={() => window.dispatchEvent(new Event('open-cart'))}
        onWishlistClick={() => window.dispatchEvent(new Event('open-wishlist'))}
        onTrackClick={() => router.push('/?action=track')}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        categories={mainCategories as any}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Semantic H1 for SEO Catalog Discovery */}
        <h1 className="sr-only">
          Shop Fresh Indian Flowers, Wedding Garlands &amp; Pooja Essentials USA
        </h1>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex items-center space-x-2 text-xs sm:text-sm text-stone-500">
            <li>
              <Link href="/" className="hover:text-[#0B3B24] transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </li>
            <li>
              <Link
                href="/shop"
                onClick={handleResetFilters}
                className={`hover:text-[#0B3B24] transition-colors ${
                  selectedCategory === 'all' ? 'font-semibold text-[#0B3B24]' : ''
                }`}
              >
                Catalog
              </Link>
            </li>
            {activeMainCategory && (
              <>
                <li>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </li>
                <li
                  className={`truncate max-w-[200px] sm:max-w-none ${
                    selectedSubcategory === 'all' ? 'font-semibold text-[#0B3B24]' : ''
                  }`}
                >
                  {activeMainCategory.name}
                </li>
              </>
            )}
            {selectedSubcategory !== 'all' && (
              <>
                <li>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </li>
                <li className="font-semibold text-[#0B3B24] truncate max-w-[200px] sm:max-w-none">
                  {selectedSubcategory}
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Search & Sort Hero Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search garlands, flowers, pooja leaves..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-full text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0B3B24] focus:border-transparent transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchFilteredProducts({ search: '', cursor: null, append: false });
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <label
              htmlFor="shop-sort"
              className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1 shrink-0"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort:
            </label>
            <select
              id="shop-sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as any)}
              className="text-xs sm:text-sm font-medium bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3B24] text-stone-800 shadow-sm"
            >
              <option value="featured">Featured / Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* PRIMARY CATEGORY SELECTOR (MAIN CATEGORIES ONLY) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {/* All Flowers Pill */}
            <button
              type="button"
              onClick={() => handleSelectMainCategory('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-[#0B3B24] text-white shadow-md ring-2 ring-[#0B3B24]/20'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <span>All Flowers</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {initialTotalCount}
              </span>
            </button>

            {/* Main Category Pills */}
            {mainCategories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => handleSelectMainCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold tracking-tight uppercase transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0B3B24] text-white shadow-md ring-2 ring-[#0B3B24]/20'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  {typeof cat.count === 'number' && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Subcategories Drawer Trigger */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-800 shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-[#0B3B24]" />
            <span>
              {selectedSubcategory === 'all'
                ? 'Filter by Subcategory'
                : `Subcategory: ${selectedSubcategory}`}
            </span>
          </button>

          {(selectedCategory !== 'all' || selectedSubcategory !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-700 font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        {/* MAIN STOREFRONT 2-COLUMN LAYOUT */}
        <div className="flex flex-col lg:flex-row items-start gap-8 relative">
          {/* LEFT SIDEBAR: HALLMARK SUBCATEGORY NAVIGATION (FIXED/STICKY ON SCROLL) */}
          <aside
            className={`w-full lg:w-72 shrink-0 lg:sticky lg:top-[116px] lg:self-start z-30 ${
              isMobileDrawerOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm max-h-[calc(100vh-8.5rem)] flex flex-col">
              {/* Sidebar Header */}
              <div className="pb-3.5 mb-3 border-b border-stone-100 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Handcrafted Floral
                  </span>
                  <h3 className="text-base font-bold text-[#0B3B24] tracking-tight">
                    {activeMainCategory ? activeMainCategory.name : 'Collections Directory'}
                  </h3>
                </div>
                {selectedSubcategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleSelectSubcategory('all')}
                    className="text-[11px] text-rose-700 font-bold hover:underline"
                    title="Clear subcategory filter"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Subcategories List - Scrollable inside fixed card */}
              <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                {/* "All in Category" Option */}
                {activeMainCategory && (
                  <button
                    type="button"
                    onClick={() => handleSelectSubcategory('all')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${
                      selectedSubcategory === 'all'
                        ? 'bg-[#F4F8F4] text-[#0B3B24] border-l-4 border-[#0B3B24] font-bold shadow-xs'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <span className="truncate">All {activeMainCategory.name}</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        selectedSubcategory === 'all'
                          ? 'bg-[#0B3B24] text-white'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {activeMainCategory.count}
                    </span>
                  </button>
                )}

                {/* Subcategory Cards */}
                {visibleSubcategories.map((sub) => {
                  const isSubActive =
                    selectedSubcategory.toLowerCase() === sub.name.toLowerCase() ||
                    Boolean(sub.slug && selectedSubcategory.toLowerCase() === sub.slug.toLowerCase());
                  return (
                    <button
                      key={sub.slug || sub.name}
                      type="button"
                      onClick={() => {
                        handleSelectSubcategory(sub.name);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group ${
                        isSubActive
                          ? 'bg-[#F4F8F4] text-[#0B3B24] border-l-4 border-[#0B3B24] font-bold shadow-xs'
                          : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        {sub.image ? (
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-stone-100 shrink-0 relative border border-stone-200">
                            <Image
                              src={sub.image}
                              alt={sub.name}
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0B3B24] flex items-center justify-center shrink-0 text-xs">
                            🌸
                          </div>
                        )}
                        <span className="truncate">{sub.name}</span>
                      </div>

                      {typeof sub.count === 'number' && sub.count > 0 && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                            isSubActive
                              ? 'bg-[#0B3B24] text-white'
                              : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
                          }`}
                        >
                          {sub.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reset All Button */}
              {(selectedCategory !== 'all' || selectedSubcategory !== 'all' || searchQuery) && (
                <div className="mt-4 pt-3 border-t border-stone-100 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full py-2 px-3 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 text-stone-600 text-xs font-bold hover:text-stone-900 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT PRODUCT GRID AREA */}
          <div className="flex-1 w-full min-w-0">
            {/* Active Filters Display & Progress Tracker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-stone-200">
              <div>
                <div className="text-sm text-stone-600 font-medium">
                  Showing <span className="font-semibold text-stone-900">{products.length}</span> of{' '}
                  <span className="font-semibold text-stone-900">{totalCount}</span> handcrafted designs
                </div>
                <div className="w-48 sm:w-64 bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-gradient-to-r from-[#0B3B24] to-[#2F6B4F] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Active Filter Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4F8F4] text-[#0B3B24] border border-emerald-200">
                    <span>{activeMainCategory?.name || selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectMainCategory('all')}
                      className="hover:text-rose-700 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSubcategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-[#0B3B24] border border-emerald-300">
                    <span>{selectedSubcategory}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectSubcategory('all')}
                      className="hover:text-rose-700 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                    <span>&quot;{searchQuery}&quot;</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        fetchFilteredProducts({ search: '', cursor: null, append: false });
                      }}
                      className="hover:text-rose-700 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Product Grid */}
            {products.length > 0 ? (
              <>
                <div
                  className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 transition-opacity duration-200 ${
                    isFiltering ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  {products.map((prod) => (
                    <ProductCard
                      key={prod._id}
                      product={prod}
                      isWishlisted={wishlist.some((w) => w._id === prod._id)}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* CURSOR-BASED "LOAD MORE" STREAM CTA */}
                {hasMore && (
                  <div className="mt-10 sm:mt-14 text-center flex flex-col items-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0B3B24] to-[#1C563F] hover:from-[#134633] hover:to-[#2F6B4F] text-white font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2.5 cursor-pointer border border-emerald-400/20"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Loading Handcrafted Flowers...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Products</span>
                          <span className="text-xs bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                            {Math.max(0, totalCount - products.length)} more
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {!hasMore && products.length > 0 && (
                  <div className="mt-12 text-center text-xs sm:text-sm text-stone-500 font-medium py-3 px-4 rounded-xl bg-stone-100/70 border border-stone-200/60 max-w-md mx-auto">
                    🌿 You have viewed all {totalCount} handcrafted floral arrangements.
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 text-[#0B3B24] rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">
                  No matching products found
                </h3>
                <p className="text-sm text-stone-500 mb-6">
                  Try adjusting your search or selecting a different floral collection.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#0B3B24] text-white text-sm font-semibold hover:bg-[#1C563F] transition-all"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <FloatingCartBar
        cartItemCount={cartItemCount}
        cartGrandTotal={cartGrandTotal}
        onOpenCart={() => window.dispatchEvent(new Event('open-cart'))}
      />
      <Footer />
    </div>
  );
}
