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
  showOnHome?: boolean;
  subcategories?: any[];
}

interface CategoryCarouselProps {
  categories: CategoryItem[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  onSelectCategory?: (name: string, subcategoryOrSlug?: string) => void;
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
  const rafRef = useRef<number | null>(null);

  const isSmallCatalog = categories.length <= 4;

  // Track scroll position to update active index and arrow visibility
  // Uses requestAnimationFrame to prevent forced synchronous reflow / layout thrashing
  const checkScrollState = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);

      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(maxScroll > 10 && scrollLeft < maxScroll - 10);

      if (categories.length <= 1 || maxScroll <= 0) {
        setActiveIndex(0);
        return;
      }

      // Start boundary
      if (scrollLeft <= 12) {
        setActiveIndex(0);
        return;
      }

      // End boundary: ensure the very last dot is active when scrolled to the end
      if (scrollLeft >= maxScroll - 15) {
        setActiveIndex(categories.length - 1);
        return;
      }

      // Calculate proportional active dot index across total categories
      const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
      const computedIndex = Math.min(
        categories.length - 1,
        Math.max(0, Math.round(progress * (categories.length - 1)))
      );
      setActiveIndex(computedIndex);
    });
  }, [categories.length]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState]);

  // Scroll by card stride (approx 1 card + gap or 75% client width)
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const stride = Math.max(280, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === 'left' ? -stride : stride,
      behavior: 'smooth',
    });
  };

  // Scroll directly to a specific card or proportional scroll position
  const handleDotClick = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    if (maxScroll <= 0) return;

    let targetScroll = 0;
    if (index === 0) {
      targetScroll = 0;
    } else if (index === categories.length - 1) {
      targetScroll = maxScroll;
    } else {
      const cardElements = el.querySelectorAll<HTMLElement>('[data-category-card]');
      if (cardElements[index]) {
        const card = cardElements[index];
        // Center the selected category card in the container's visible area
        const desiredLeft = card.offsetLeft - (clientWidth - card.offsetWidth) / 2;
        targetScroll = Math.min(maxScroll, Math.max(0, desiredLeft));
      } else {
        targetScroll = (index / (categories.length - 1)) * maxScroll;
      }
    }

    el.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  return (
    <div className="relative w-full">
      <div className="relative group/carousel">
        {/* Left Arrow Button (Displayed when scrollable) */}
        {!isSmallCatalog && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
            className="absolute -left-3 sm:-left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-white hover:bg-[#0B3B24] hover:border-[#0B3B24] transition-all duration-200 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        {/* Right Arrow Button (Displayed when scrollable) */}
        {!isSmallCatalog && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
            className="absolute -right-3 sm:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-white hover:bg-[#0B3B24] hover:border-[#0B3B24] transition-all duration-200 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        {/* Categories Track:
            - When categories <= 4:
              Mobile (< md): Smooth snap carousel
              Tablet & Desktop (>= md): Fully auto-aligned responsive grid (2-cols on tablet, 4-cols on desktop)
            - When categories > 4:
              Fluid horizontal carousel with snap scroll and non-shrinking cards
        */}
        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Categories showcase"
          className={
            isSmallCatalog
              ? 'flex items-stretch gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2.5 px-3 sm:px-1 no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5 xl:gap-6 md:overflow-visible md:py-1 w-full'
              : 'flex items-stretch gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2.5 px-3 sm:px-1 no-scrollbar w-full'
          }
        >
          {categories.map((category, index) => {
            const isSelected =
              selectedCategory.trim().toLowerCase() === category.name.trim().toLowerCase();
            const targetSlug =
              category.slug ||
              category.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-');

            return (
              <CategoryCard
                key={category._id || category.name}
                name={category.name}
                slug={targetSlug}
                href={`/product-category/${encodeURIComponent(targetSlug)}`}
                image={category.image}
                subcategories={category.subcategories}
                isSelected={isSelected}
                index={index}
                isGrid={isSmallCatalog}
                onClick={() => onSelectCategory && onSelectCategory(category.name, targetSlug)}
              />
            );
          })}
        </div>
      </div>

      {/* Pagination Indicators & Progress Tracking:
          - For small catalog (<= 4): Shown ONLY on mobile (< md) where horizontal scrolling occurs.
          - For 5 to 8 categories: Clean rounded pill dots.
          - For large catalog (> 8, e.g. 28 categories): Compact, elegant pill indicator showing current index & progress bar (prevents rendering 28 tiny dots across the screen).
      */}
      {categories.length > 1 && (
        <div
          className={`items-center justify-center gap-2.5 mt-4 sm:mt-5 ${
            isSmallCatalog ? 'flex md:hidden' : 'flex'
          }`}
        >
          {categories.length <= 8 ? (
            categories.map((cat, dotIdx) => {
              const isActive = dotIdx === activeIndex;
              return (
                <button
                  key={cat.slug || cat.name || dotIdx}
                  type="button"
                  onClick={() => handleDotClick(dotIdx)}
                  aria-label={`Go to ${cat.name}`}
                  className="p-1.5 -m-1 flex items-center justify-center min-w-[28px] min-h-[28px] cursor-pointer"
                >
                  <span
                    className={`transition-all duration-300 rounded-full block ${
                      isActive
                        ? 'w-7 h-2.5 bg-[#0B3B24] shadow-xs'
                        : 'w-2.5 h-2.5 bg-stone-300 hover:bg-stone-400'
                    }`}
                  />
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-3 bg-white/90 border border-stone-200/90 px-4 py-1.5 rounded-full text-xs font-semibold text-stone-600 shadow-xs">
              <span className="text-[#0B3B24] font-bold">
                {activeIndex + 1}
              </span>
              <span className="text-stone-300">/</span>
              <span>{categories.length} Categories</span>
              <div className="w-20 sm:w-28 h-2 bg-stone-100 rounded-full overflow-hidden ml-1 border border-stone-200">
                <div
                  className="h-full bg-gradient-to-r from-[#0B3B24] to-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(8, Math.round(((activeIndex + 1) / categories.length) * 100))
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
