'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CategoryCard from './CategoryCard';

export interface CategoryItem {
  _id?: string;
  name: string;
  slug?: string;
  image?: string;
  order?: number;
  subcategories?: any[];
}

interface CategoryCarouselProps {
  categories: CategoryItem[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  onSelectCategory?: (name: string, subcategory?: string) => void;
}

export default function CategoryCarousel({
  categories = [],
  selectedCategory = 'All',
  onSelectCategory,
}: CategoryCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const isSmallCatalog = categories.length <= 4;

  // Track scroll position to update active index and arrow visibility
  const checkScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);

    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < maxScroll - 8);

    // Identify which card is currently centered in view
    const cardElements = el.querySelectorAll<HTMLElement>('[data-category-card]');
    if (cardElements.length > 0) {
      const containerCenter = scrollLeft + clientWidth / 2;
      let closestIdx = 0;
      let minDiff = Infinity;

      cardElements.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const diff = Math.abs(containerCenter - cardCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      setActiveIndex(closestIdx);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState);

    return () => {
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState]);

  // Scroll by card or stride
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const stride = Math.max(240, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === 'left' ? -stride : stride,
      behavior: 'smooth',
    });
  };

  // Scroll directly to a specific card index
  const handleDotClick = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const cardElements = el.querySelectorAll<HTMLElement>('[data-category-card]');
    if (cardElements[index]) {
      cardElements[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        {/* Left Arrow Button (Only displayed when carousel scrolling is active) */}
        {!isSmallCatalog && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
            className="absolute -left-3 sm:-left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-[#0B3B24] hover:border-[#0B3B24] transition-all duration-200 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow Button (Only displayed when carousel scrolling is active) */}
        {!isSmallCatalog && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
            className="absolute -right-3 sm:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-[#0B3B24] hover:border-[#0B3B24] transition-all duration-200 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Categories Track:
            - When categories <= 4:
              Mobile (< md): Smooth snap carousel
              Tablet & Desktop (>= md): Fully auto-aligned responsive grid (2-cols on tablet, 4-cols on desktop)
              spanning the full width with zero blank space!
            - When categories > 4:
              Fluid horizontal carousel with snap scroll and arrow controls
        */}
        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Categories showcase"
          className={
            isSmallCatalog
              ? "flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5 xl:gap-6 md:overflow-visible md:py-1 w-full"
              : "flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 no-scrollbar w-full"
          }
        >
          {categories.map((category, index) => {
            const isSelected =
              selectedCategory.trim().toLowerCase() === category.name.trim().toLowerCase();

            return (
              <CategoryCard
                key={category._id || category.name}
                name={category.name}
                slug={category.slug}
                image={category.image}
                subcategories={category.subcategories}
                isSelected={isSelected}
                index={index}
                onClick={() => onSelectCategory && onSelectCategory(category.name)}
              />
            );
          })}
        </div>
      </div>

      {/* Pagination Indicators (Dots):
          - For small catalog (<= 4): Shown ONLY on mobile (< md) where horizontal scrolling actually occurs.
            Cleanly hidden on tablet & desktop where cards are autoaligned across the entire grid!
          - For large catalog (> 4): Shown on all devices when scrollable.
      */}
      {categories.length > 1 && (
        <div
          className={`items-center justify-center gap-2 mt-4 sm:mt-5 ${
            isSmallCatalog ? 'flex md:hidden' : 'flex'
          }`}
          aria-hidden="true"
        >
          {categories.map((cat, dotIdx) => {
            const isActive = dotIdx === activeIndex;
            return (
              <button
                key={cat.slug || cat.name || dotIdx}
                type="button"
                onClick={() => handleDotClick(dotIdx)}
                aria-label={`Go to ${cat.name}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-7 h-2.5 bg-[#0B3B24] shadow-xs'
                    : 'w-2.5 h-2.5 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
