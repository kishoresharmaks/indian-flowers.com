'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
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
  // Fallback default categories matching reference mockup
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
  ];

  const items = categories && categories.length > 0 ? categories : defaultCategories;
  // Display the 4 primary featured categories matching the mockup
  const featuredCategories = items.slice(0, 4);

  if (loading && (!items || items.length === 0)) {
    return (
      <div className="w-full py-2 sm:py-3 md:py-4">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 sm:h-22 rounded-2xl sm:rounded-3xl bg-stone-200/60 animate-pulse border border-stone-200/80"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full pt-1 pb-4 sm:pt-2 sm:pb-6">
      {/* Aligned with Hero Slider container */}
      <div className="w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4 lg:gap-5">
          {featuredCategories.map((category) => {
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
                className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl sm:rounded-[22px] transition-all duration-200 text-left cursor-pointer border ${
                  isSelected
                    ? 'bg-white border-[#0B3B24] ring-2 ring-[#0B3B24]/20 shadow-md'
                    : 'bg-white/95 hover:bg-white border-stone-200/80 hover:border-[#0B3B24]/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  {/* Category Image */}
                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-[#FAF6F0] border border-stone-200/60 p-0.5">
                    <img
                      src={categoryImageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-[10px] sm:rounded-[14px] group-hover:scale-108 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FLORAL_PLACEHOLDER;
                      }}
                    />
                  </div>

                  {/* Category Name */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-[13px] md:text-sm font-semibold text-gray-900 group-hover:text-[#0B3B24] transition-colors leading-snug line-clamp-2">
                      {category.name}
                    </span>
                  </div>
                </div>

                {/* Chevron Arrow */}
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-stone-400 group-hover:text-[#0B3B24] group-hover:bg-emerald-50 transition-all shrink-0 ml-1.5">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform stroke-[2.2]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
