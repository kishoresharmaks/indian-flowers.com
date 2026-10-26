'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
  Flower2,
  Tag,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface SearchProduct {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  salePrice?: number;
  images?: string[];
  category?: string;
  subCategory?: string;
  inStock?: boolean;
  isBestSeller?: boolean;
}

interface SearchCategory {
  name: string;
  slug: string;
  type: 'category' | 'subcategory';
  parentCategory?: string;
}

interface PredictiveSearchProps {
  initialQuery?: string;
  onQueryChange?: (val: string) => void;
  onClose?: () => void;
  placeholder?: string;
  isMobile?: boolean;
  className?: string;
}

const POPULAR_SEARCHES = [
  'Mallipoo Strings',
  'Rose Petal Garlands',
  'Wedding Varmala',
  'Betel Leaves',
  'Lotus Flowers',
  'House Warming Garlands',
];

export default function PredictiveSearch({
  initialQuery = '',
  onQueryChange,
  onClose,
  placeholder = 'Search flowers, garlands, leaves...',
  isMobile = false,
  className = '',
}: PredictiveSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external initialQuery if changed
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch predictive suggestions
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setProducts([]);
      setCategories([]);
      setTotalMatches(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search/predictive?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setTotalMatches(data.totalMatches || 0);
      }
    } catch (err) {
      console.error('Error in predictive search fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onQueryChange) onQueryChange(val);
    setIsOpen(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 220);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setIsOpen(false);
      if (onClose) onClose();
      router.push(`/shop?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onQueryChange) onQueryChange('');
    setProducts([]);
    setCategories([]);
    setTotalMatches(0);
    inputRef.current?.focus();
  };

  const handleSelectPopular = (term: string) => {
    setQuery(term);
    if (onQueryChange) onQueryChange(term);
    setIsOpen(true);
    fetchSuggestions(term);
  };

  const handleItemClick = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
        <div
          className={`relative flex-1 flex items-center border rounded-full transition-all duration-200 overflow-hidden ${
            isOpen
              ? 'border-[#0B3B24] ring-2 ring-[#0B3B24]/15 bg-white shadow-md'
              : 'border-stone-300 hover:border-stone-400 bg-stone-50/80 hover:bg-white shadow-2xs'
          }`}
        >
          <Search className="w-4 h-4 text-stone-400 ml-4 shrink-0 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            aria-label="Search flowers and garlands"
            className="w-full px-3 py-2.5 bg-transparent text-xs sm:text-[13px] text-stone-900 placeholder-stone-400 focus:outline-none font-normal"
          />

          {loading && (
            <Loader2 className="w-4 h-4 text-[#0B3B24] animate-spin mr-2 shrink-0" />
          )}

          {!loading && query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-stone-400 hover:text-stone-700 transition-colors mr-2 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            className="bg-[#0B3B24] hover:bg-[#134633] active:bg-[#072718] text-white px-4 sm:px-5 py-2.5 flex items-center justify-center transition-colors cursor-pointer shrink-0 font-medium text-xs tracking-wide"
            aria-label="Submit search"
          >
            <span className="hidden sm:inline mr-1 font-semibold text-xs">Search</span>
            <Search className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </form>

      {/* Predictive Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(11,59,36,0.18)] border border-stone-200/90 z-50 overflow-hidden animate-fadeIn ${
            isMobile ? 'max-h-[75vh]' : 'max-h-[520px]'
          } flex flex-col`}
        >
          <div className="overflow-y-auto divide-y divide-stone-100 overscroll-contain">
            {/* 1. When query is empty: Trending / Popular suggestions */}
            {!query.trim() && (
              <div className="p-4 sm:p-5 space-y-3 bg-gradient-to-b from-[#FAF8F5]/80 to-white">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0B3B24]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Popular Auspicious Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSelectPopular(term)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:text-[#0B3B24] hover:border-[#0B3B24]/40 hover:bg-emerald-50/30 transition-all shadow-2xs cursor-pointer"
                    >
                      <Flower2 className="w-3 h-3 text-amber-600/70" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Matching Categories & Subcategories */}
            {query.trim() && categories.length > 0 && (
              <div className="p-3 sm:p-4 bg-stone-50/70 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Matching Collections &amp; Categories</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat, idx) => (
                    <Link
                      key={`${cat.slug}-${idx}`}
                      href={`/product-category/${cat.slug}`}
                      onClick={handleItemClick}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#0B3B24] border border-emerald-200/80 hover:bg-emerald-50 shadow-2xs transition-colors"
                    >
                      <span className="text-stone-400 text-[10px]">
                        {cat.type === 'subcategory' ? 'Subcategory:' : 'Category:'}
                      </span>
                      <span>{cat.name}</span>
                      <ChevronRight className="w-3 h-3 text-emerald-600" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Matching Products List */}
            {query.trim() && products.length > 0 && (
              <div className="p-2 sm:p-3 space-y-1">
                <div className="px-2 pt-1 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  Flowers &amp; Garlands ({products.length} of {totalMatches})
                </div>
                {products.map((prod) => {
                  const targetSlug = prod.slug || prod._id;
                  const thumb = prod.images && prod.images.length > 0 ? prod.images[0] : null;
                  const displayPrice = prod.salePrice && prod.salePrice < prod.price ? prod.salePrice : prod.price;
                  const hasDiscount = Boolean(prod.salePrice && prod.salePrice < prod.price);

                  return (
                    <Link
                      key={prod._id}
                      href={`/product/${targetSlug}`}
                      onClick={handleItemClick}
                      className="flex items-center gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <Flower2 className="w-5 h-5 text-stone-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-semibold text-stone-800 group-hover:text-[#0B3B24] transition-colors truncate">
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {prod.category && (
                            <span className="text-[10.5px] text-stone-500 truncate">
                              {prod.category}
                            </span>
                          )}
                          {prod.inStock !== false && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Fresh Stock</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price in USD ($) */}
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B3B24]">
                          {formatCurrency(displayPrice)}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] text-stone-400 line-through">
                            {formatCurrency(prod.price)}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 4. No Results State */}
            {query.trim() && !loading && products.length === 0 && categories.length === 0 && (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                  <Flower2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-stone-700">
                    No flowers found for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Try searching for Jasmine, Varmala, Lotus, or sacred puja leaves.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={handleItemClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <span>Explore Full Catalog in Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* 5. Sticky Footer: View all matches in Shop */}
          {query.trim() && totalMatches > 0 && (
            <div className="p-2.5 sm:p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                Found <strong className="text-stone-800">{totalMatches}</strong> matching flowers
              </span>
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold transition-all shadow-2xs hover:gap-2 cursor-pointer"
              >
                <span>View All in Shop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
