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
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [totalDots, setTotalDots] = useState(5);

  // Compute scroll boundaries and active pagination indicator
  const checkScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < maxScroll - 6);

    if (maxScroll > 0) {
      // Calculate dot index (0 to totalDots - 1)
      const ratio = scrollLeft / maxScroll;
      const computedIndex = Math.min(
        Math.max(0, Math.round(ratio * (totalDots - 1))),
        totalDots - 1
      );
      setActiveIndex(computedIndex);
    }
  }, [totalDots]);

  useEffect(() => {
    // Dynamic calculation of total pagination dots based on total items
    const count = Math.min(Math.max(3, Math.ceil(categories.length / 2.5)), 6);
    setTotalDots(count);
  }, [categories.length]);

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

  // Scroll by card stride (approx 2 cards on mobile, 3 on desktop)
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = Math.max(220, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Scroll to dot position
  const handleDotClick = (dotIndex: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetScroll = (dotIndex / (totalDots - 1)) * maxScroll;
    el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setActiveIndex(dotIndex);
  };

  return (
    <div className="relative w-full">
      {/* Outer Wrapper with Left/Right Edge Fades on Mobile & Floating Arrows on Desktop */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Scroll categories left"
          className={`absolute -left-3 sm:-left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-[#064E3B] hover:border-[#064E3B] transition-all duration-200 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label="Scroll categories right"
          className={`absolute -right-3 sm:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-[#064E3B] hover:border-[#064E3B] transition-all duration-200 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable Track with CSS Scroll-Snap */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          role="region"
          aria-label="Category carousel"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              handleScroll('left');
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              handleScroll('right');
            }
          }}
          className="flex items-stretch gap-3 sm:gap-3.5 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 rounded-2xl no-scrollbar"
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
                isSelected={isSelected}
                index={index}
                onClick={() => onSelectCategory && onSelectCategory(category.name)}
              />
            );
          })}
        </div>
      </div>

      {/* Pagination Indicators (Dots) */}
      <div
        className="flex items-center justify-center gap-1.5 mt-3 sm:mt-4"
        aria-hidden="true"
      >
        {Array.from({ length: totalDots }).map((_, dotIdx) => {
          const isActive = dotIdx === activeIndex;
          return (
            <button
              key={dotIdx}
              type="button"
              onClick={() => handleDotClick(dotIdx)}
              aria-label={`Go to carousel slide page ${dotIdx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? 'w-6 h-2 bg-[#064E3B]'
                  : 'w-2 h-2 bg-stone-300 hover:bg-stone-400 cursor-pointer'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
