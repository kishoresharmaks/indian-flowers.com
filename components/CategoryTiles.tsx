'use client';

import React from 'react';

export interface CategoryItem {
  _id?: string;
  name: string;
  image?: string;
  order?: number;
}

interface CategoryTilesProps {
  categories?: CategoryItem[];
  loading?: boolean;
  selectedCategory?: string;
  onSelectCategory?: (name: string) => void;
}

export default function CategoryTiles({
  categories = [],
  loading = false,
  selectedCategory = 'All',
  onSelectCategory,
}: CategoryTilesProps) {
  if (loading) {
    return (
      <section className="py-6 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-hidden md:grid md:grid-cols-8 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse shrink-0">
                <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-[#FAF6F0] border border-gray-100" />
                <div className="mt-2.5 h-3 w-14 bg-gray-200 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-none sm:mx-0 sm:px-0 md:grid md:grid-cols-8 md:gap-6 md:overflow-visible md:pb-0 md:snap-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.name;
            return (
              <button
                key={category._id || category.name}
                type="button"
                onClick={() => onSelectCategory && onSelectCategory(category.name)}
                className="group flex w-[4.75rem] sm:w-auto shrink-0 snap-start flex-col items-center text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3B24] focus-visible:ring-offset-2 rounded-xl"
              >
                <div
                  className={`w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden p-1 border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-[#0B3B24] ring-2 ring-[#0B3B24]/20 shadow-md'
                      : 'border-amber-100/70 hover:border-[#0B3B24] group-hover:shadow-md'
                  } bg-[#FBF9F4]`}
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt=""
                      className="w-full h-full object-cover rounded-full group-hover:scale-[1.06] transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-emerald-50 flex items-center justify-center text-[#0B3B24] text-xs font-semibold">
                      {category.name.charAt(0)}
                    </div>
                  )}
                </div>

                <span
                  className={`mt-2 text-[11px] sm:text-[13px] leading-tight max-w-[5.5rem] sm:max-w-[100px] line-clamp-2 transition-colors ${
                    isSelected
                      ? 'text-[#0B3B24] font-semibold'
                      : 'text-gray-700 font-medium group-hover:text-[#0B3B24]'
                  }`}
                >
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
