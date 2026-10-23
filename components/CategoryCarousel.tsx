'use client';

import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';

export interface SubcategoryItem {
  _id?: string;
  name: string;
  slug?: string;
  image?: string;
  order?: number;
}

export interface CategoryItem {
  _id?: string;
  name: string;
  slug?: string;
  image?: string;
  order?: number;
  subcategories?: SubcategoryItem[];
}

interface CategoryCarouselProps {
  categories?: CategoryItem[];
  loading?: boolean;
  selectedCategory?: string;
  selectedSubcategory?: string;
  onSelectCategory?: (name: string, subcategory?: string) => void;
}

export default function CategoryCarousel({
  categories = [],
  loading = false,
  selectedCategory = 'All',
  selectedSubcategory = '',
  onSelectCategory,
}: CategoryCarouselProps) {
  if (loading && (!categories || categories.length === 0)) {
    return (
      <div className="w-full py-3 sm:py-4">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-20 sm:h-24 rounded-2xl bg-stone-200/60 animate-pulse border border-stone-200/80"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full pt-1 pb-4 sm:pt-2 sm:pb-6">
      <div className="w-full">
        {/* Section Heading & All Filter */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0B3B24]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0B3B24]">
              Browse Categories
            </h3>
          </div>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => onSelectCategory && onSelectCategory('All')}
              className="text-xs font-semibold text-[#0B3B24] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Flowers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Responsive Grid for All 12 Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-3.5">
          {categories.map((category) => {
            const isSelected =
              selectedCategory.trim().toLowerCase() === category.name.trim().toLowerCase();
            const categoryImageUrl =
              category.image && category.image.trim()
                ? category.image
                : DEFAULT_FLORAL_PLACEHOLDER;
            const subCount = category.subcategories?.length || 0;

            return (
              <button
                key={category._id || category.name}
                type="button"
                onClick={() => onSelectCategory && onSelectCategory(category.name)}
                className={`group relative flex items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 text-left cursor-pointer border min-h-[58px] sm:min-h-[66px] ${
                  isSelected
                    ? 'bg-white border-[#0B3B24] ring-2 ring-[#0B3B24]/20 shadow-md'
                    : 'bg-white/95 hover:bg-white border-stone-200/80 hover:border-[#0B3B24]/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  {/* Category Image */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-[#FAF6F0] border border-stone-200/60 p-0.5">
                    <img
                      src={categoryImageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-[6px] sm:rounded-[8px] group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FLORAL_PLACEHOLDER;
                      }}
                    />
                  </div>

                  {/* Category Name & Optional Subcategory Badge */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11.5px] sm:text-[12px] font-bold text-gray-900 group-hover:text-[#0B3B24] transition-colors leading-tight line-clamp-2">
                      {category.name}
                    </span>
                    {subCount > 0 && (
                      <span className="text-[9.5px] font-semibold text-emerald-700/80 mt-0.5 tracking-tight flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{subCount} subcategories</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron Arrow */}
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-stone-300 group-hover:text-[#0B3B24] transition-all shrink-0 ml-1">
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform stroke-[2]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
