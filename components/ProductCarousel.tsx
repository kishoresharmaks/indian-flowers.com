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
  eyebrow = 'Fresh Wedding Garland',
  title = 'Our Exclusive Collections',
  subtitle = 'Experience the ultimate collection of Indian florals in the USA. From the delicate scent of Jasmine strings to the majestic weight of a traditional wedding garland, we bring premium quality and prompt delivery to your doorstep. Hand-picked, hand-crafted, and heart-delivered. Elevate your rituals with the flowers you know and love.',
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
      {/* Header with Title Hierarchy and Desktop Arrow Controls (theindianflowers.com authentic style) */}
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
            <p className="text-[12.5px] sm:text-[14px] text-stone-500 font-normal leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Desktop Arrow Controls */}
        <div className="hidden sm:flex items-center gap-2 self-end pb-1 shrink-0">
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
        {/* Trailing spacer for smooth edge clearance on mobile swipe */}
        <div className="w-1 shrink-0 sm:hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
