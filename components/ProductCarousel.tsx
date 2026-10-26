'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import ProductCard, { Product, ProductVariant } from './ProductCard';

interface ProductCarouselProps {
  products: Product[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  categorySlug?: string;
  categoryName?: string;
  showShopAll?: boolean;
  wishlist?: Product[];
  onToggleWishlist?: (product: Product) => void;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onProductClick?: (product: Product) => void;
  loading?: boolean;
  className?: string;
}

export default function ProductCarousel({
  products = [],
  eyebrow = 'Fresh Wedding Garland',
  title = 'Our Exclusive Collections',
  subtitle,
  categorySlug,
  categoryName,
  showShopAll = true,
  wishlist = [],
  onToggleWishlist,
  onAddToCart,
  onProductClick,
  loading = false,
  className = '',
}: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const nextLeft = scrollLeft > 10;
    const nextRight = scrollLeft < scrollWidth - clientWidth - 10;
    setCanScrollLeft((prev) => (prev !== nextLeft ? nextLeft : prev));
    setCanScrollRight((prev) => (prev !== nextRight ? nextRight : prev));
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (loading && products.length === 0) {
    return (
      <div className={`py-4 sm:py-8 ${className}`}>
        <div className="space-y-4">
          <div className="h-4 w-36 bg-stone-200 animate-pulse rounded" />
          <div className="h-8 w-64 bg-stone-200 animate-pulse rounded" />
          <div className="flex gap-2 sm:gap-4 lg:gap-6 overflow-hidden pt-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[calc(50%-6px)] sm:w-[calc(50%-10px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-18px)] shrink-0 h-72 rounded-2xl bg-stone-100 animate-pulse border border-stone-200"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={`relative py-4 sm:py-8 ${className}`}>
      {/* Header with Title Hierarchy, Shop All button, and Desktop Arrow Controls */}
      <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 sm:mb-6">
        <div className="space-y-1.5 max-w-3xl mx-auto sm:mx-0">
          {eyebrow && (
            <span className="font-serif italic text-[16px] sm:text-[19px] text-[#ed2353] block tracking-wide">
              {eyebrow}
            </span>
          )}
          <h2 className="text-[24px] sm:text-[30px] lg:text-[34px] font-bold tracking-[-0.03em] text-[#0B3B24] leading-[1.2]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-stone-500 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side controls: Shop All Pill + Desktop Arrow Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 self-stretch sm:self-end pb-1 shrink-0">
          {categorySlug && showShopAll && (
            <Link
              href={`/product-category/${categorySlug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0B3B24]/20 hover:border-[#0B3B24] bg-white hover:bg-[#0B3B24] text-[#0B3B24] hover:text-white text-xs sm:text-[13px] font-bold tracking-wide transition-all shadow-2xs group/btn cursor-pointer"
            >
              <span>Shop All</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          )}

          {/* Desktop Arrow Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${title} left`}
              className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/95 border border-stone-200/90 shadow-xs text-stone-700 hover:text-[#0B3B24] hover:border-[#0B3B24] hover:shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label={`Scroll ${title} right`}
              className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/95 border border-stone-200/90 shadow-xs text-stone-700 hover:text-[#0B3B24] hover:border-[#0B3B24] hover:shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Mobile Grid Carousel Track (calc(50% - 6px) matches 2 cards per view on mobile!) */}
      <div
        ref={trackRef}
        onScroll={checkScroll}
        tabIndex={0}
        role="region"
        aria-label={`${title} product carousel`}
        className="flex items-stretch gap-2.5 sm:gap-4 lg:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory pt-1 pb-4 -mx-1 px-1 sm:mx-0 sm:px-0 focus:outline-none scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((product) => {
          const isWishlisted = wishlist.some((w) => w._id === product._id);
          return (
            <div
              key={product._id}
              className="w-[calc(50%-5px)] xs:w-[calc(50%-6px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-15px)] 2xl:w-[calc(20%-16px)] shrink-0 snap-start flex flex-col"
            >
              <ProductCard
                product={product}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onProductClick={onProductClick}
              />
            </div>
          );
        })}

        {/* View All Collection Card at the End of Carousel Track */}
        {categorySlug && showShopAll && (
          <div className="w-[calc(50%-5px)] xs:w-[calc(50%-6px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-15px)] 2xl:w-[calc(20%-16px)] shrink-0 snap-start flex flex-col">
            <Link
              href={`/product-category/${categorySlug}`}
              className="h-full min-h-[300px] sm:min-h-[360px] rounded-2xl border-2 border-dashed border-[#0B3B24]/20 hover:border-[#0B3B24] bg-gradient-to-br from-[#FAF8F5] to-[#F4EFE6] hover:from-[#F4EFE6] hover:to-[#ECE3D5] p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-all group/card shadow-2xs hover:shadow-md"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0B3B24]/10 text-[#0B3B24] flex items-center justify-center mb-3 sm:mb-4 group-hover/card:bg-[#0B3B24] group-hover/card:text-white transition-all shadow-2xs">
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover/card:translate-x-1" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.12em] uppercase text-[#C85A78] mb-1">
                Explore Complete Line
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[#0B3B24] leading-snug mb-2 line-clamp-2">
                All {categoryName || title}
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 mb-4 line-clamp-2 leading-relaxed">
                Browse our entire collection of authentic handcrafted florals with nationwide USA delivery.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3B24] group-hover/card:text-[#134633] underline underline-offset-4">
                <span>View All Products</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        )}

        {/* Trailing spacer for smooth edge clearance on mobile swipe */}
        <div className="w-1 shrink-0 sm:hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
