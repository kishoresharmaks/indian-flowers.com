'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard, { Product, ProductVariant } from './ProductCard';

interface ProductCarouselProps {
  products: Product[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  wishlist?: Product[];
  onToggleWishlist?: (product: Product) => void;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onProductClick?: (product: Product) => void;
  loading?: boolean;
  className?: string;
}

export default function ProductCarousel({
  products = [],
  eyebrow = 'FRESH INDIAN FLOWERS',
  title = 'Fresh Flower Strings & Jasmine',
  subtitle = 'Premium authentic floral blooms delivered fresh across the United States',
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
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

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
          <div className="flex gap-3.5 sm:gap-5 lg:gap-6 overflow-hidden pt-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-[74vw] xs:w-[68vw] sm:w-[calc(50%-10px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-18px)] 2xl:w-[calc(20%-19.5px)] shrink-0 h-80 rounded-2xl bg-stone-100 animate-pulse border border-stone-200"
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
      {/* Header with Title Hierarchy and Desktop Arrow Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 sm:mb-6">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#C85A78] block">
            {eyebrow}
          </span>
          <h2 className="text-[22px] sm:text-[28px] lg:text-[34px] font-bold tracking-[-0.03em] text-[#0B3B24] leading-[1.2]">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-normal leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Desktop Arrow Controls */}
        <div className="hidden sm:flex items-center gap-2 self-end pb-1">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label={`Scroll ${title} left`}
            className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/95 border border-stone-200/90 shadow-xs text-gray-700 hover:text-[#0B3B24] hover:border-[#0B3B24] hover:shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label={`Scroll ${title} right`}
            className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/95 border border-stone-200/90 shadow-xs text-gray-700 hover:text-[#0B3B24] hover:border-[#0B3B24] hover:shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track: Responsive card widths calculating from available container space */}
      <div
        ref={trackRef}
        onScroll={checkScroll}
        tabIndex={0}
        role="region"
        aria-label={`${title} product carousel`}
        className="flex items-stretch gap-3.5 sm:gap-5 lg:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pt-1 pb-4 -mx-2 px-2 sm:mx-0 sm:px-0 focus:outline-none scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((product) => {
          const isWishlisted = wishlist.some((w) => w._id === product._id);
          return (
            <div
              key={product._id}
              className="w-[74vw] xs:w-[68vw] sm:w-[calc(50%-10px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-18px)] 2xl:w-[calc(20%-19.5px)] shrink-0 snap-start flex flex-col"
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
        {/* Trailing spacer for smooth edge clearance on mobile swipe */}
        <div className="w-1 shrink-0 sm:hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
