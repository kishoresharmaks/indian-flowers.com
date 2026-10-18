'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';

export interface CategoryItem {
  _id?: string;
  name: string;
  image?: string;
  order?: number;
}

interface CategoryCarouselProps {
  categories?: CategoryItem[];
  loading?: boolean;
  selectedCategory?: string;
  onSelectCategory?: (name: string) => void;
}

export default function CategoryCarousel({
  categories = [],
  loading = false,
  selectedCategory = 'Fresh Flower Strings & Jasmine',
  onSelectCategory,
}: CategoryCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fallback default categories matching reference
  const defaultCategories: CategoryItem[] = [
    {
      name: 'Fresh Flower Strings & Jasmine',
      image: '/images/categories/cat-jasmine-strings.jpg',
      order: 1,
    },
    {
      name: 'Wedding & Temple Garlands',
      image: '/images/categories/cat-wedding-garlands.jpg',
      order: 2,
    },
    {
      name: 'Loose Flowers for Daily Pooja',
      image: '/images/categories/cat-loose-pooja.jpg',
      order: 3,
    },
    {
      name: 'Sacred Pooja Leaves & Greenery',
      image: '/images/categories/cat-pooja-leaves.jpg',
      order: 4,
    },
    {
      name: 'Pooja Items & Kits',
      image: '/images/categories/cat-pooja-kits.jpg',
      order: 5,
    },
    {
      name: 'Bouquets & Flower Arrangements',
      image: '/images/categories/cat-bouquets.jpg',
      order: 6,
    },
  ];

  const items = categories && categories.length > 0 ? categories : defaultCategories;

  const checkScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(240, el.clientWidth * 0.65);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (loading && (!items || items.length === 0)) {
    return (
      <div className="w-full py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center gap-4 sm:gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center animate-pulse shrink-0">
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-amber-100/60 border-2 border-amber-200/50" />
                <div className="mt-2.5 h-3 w-16 bg-stone-200/80 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full pt-1 pb-4 sm:pt-2 sm:pb-6">
      {/* 
        NOTE: Removed duplicate top indicator dots.
        The hero banner above already has slide indicators, avoiding stacked duplicate dots.
      */}

      {/* CATEGORY TRACK CONTAINER WITH PREV/NEXT ARROWS */}
      <div className="relative w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto sm:px-4 lg:px-8 xl:px-10 2xl:px-12">
        {/* Left Navigation Arrow (Desktop/Tablet only) */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Previous categories"
          className="hidden md:flex absolute -left-2 lg:-left-4 top-1/2 -translate-y-6 z-20 w-9 h-9 lg:w-10 lg:h-10 items-center justify-center rounded-full bg-white/95 border border-stone-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-stone-700 hover:text-[#0B3B24] hover:border-[#0B3B24] hover:shadow-md transition-all active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Right Navigation Arrow (Desktop/Tablet only) */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label="Next categories"
          className="hidden md:flex absolute -right-2 lg:-right-4 top-1/2 -translate-y-6 z-20 w-9 h-9 lg:w-10 lg:h-10 items-center justify-center rounded-full bg-white/95 border border-stone-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-stone-700 hover:text-[#0B3B24] hover:border-[#0B3B24] hover:shadow-md transition-all active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Horizontal Category Track: Subtle 8px corner buffer on mobile to tackle sharp end corners, supports 6, 8, 12+ categories without clipping */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollState}
          className="flex items-start justify-start md:justify-center gap-3 sm:gap-5 lg:gap-7 xl:gap-8 2xl:gap-10 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 -mx-2 px-2 sm:mx-0 sm:px-0 focus:outline-none scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          tabIndex={0}
          role="region"
          aria-label="Categories"
        >
          {items.map((category) => {
            const isSelected =
              selectedCategory.trim().toLowerCase() === category.name.trim().toLowerCase();
            const categoryImageUrl =
              category.image && category.image.trim()
                ? category.image
                : DEFAULT_FLORAL_PLACEHOLDER;

            return (
              <button
                key={category._id || category.name}
                type="button"
                onClick={() => onSelectCategory && onSelectCategory(category.name)}
                className="group flex flex-col items-center text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3B24] rounded-2xl transition-all duration-300 hover:-translate-y-1 shrink-0 snap-start w-[88px] sm:w-[110px] md:w-[124px] lg:w-[134px] xl:w-[144px] 2xl:w-[154px]"
              >
                {/* Circular Floral Thumbnail with Thin Warm-Gold Border */}
                <div
                  className={`w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 lg:w-24 lg:h-24 xl:w-26 xl:h-26 2xl:w-28 2xl:h-28 rounded-full p-1 border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-[#0B3B24] ring-3 ring-[#0B3B24]/20 shadow-md scale-105 bg-white'
                      : 'border-amber-300/80 ring-1 ring-amber-200/50 hover:border-[#0B3B24] hover:ring-emerald-200/50 hover:shadow-md bg-white'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF6F0]">
                    <img
                      src={categoryImageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FLORAL_PLACEHOLDER;
                      }}
                    />
                  </div>
                </div>

                {/* Clean Centered Category Label without clipping */}
                <span
                  className={`mt-2 text-[11px] sm:text-[12.5px] lg:text-[13px] 2xl:text-[13.5px] leading-[1.25] text-center transition-colors px-0.5 line-clamp-2 min-h-[28px] sm:min-h-[32px] flex items-center justify-center ${
                    isSelected
                      ? 'text-[#0B3B24] font-bold'
                      : 'text-gray-800 font-medium group-hover:text-[#0B3B24]'
                  }`}
                >
                  {category.name}
                </span>
              </button>
            );
          })}
          {/* Mobile trailing spacer */}
          <div className="w-1 shrink-0 sm:hidden" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
