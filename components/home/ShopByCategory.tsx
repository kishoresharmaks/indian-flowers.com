'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CategoryCarousel, { CategoryItem } from './CategoryCarousel';
import { SEED_CATEGORIES } from '@/lib/seedData';

interface ShopByCategoryProps {
  categories?: CategoryItem[];
  loading?: boolean;
  selectedCategory?: string;
  selectedSubcategory?: string;
  onSelectCategory?: (name: string, subcategory?: string) => void;
}

export default function ShopByCategory({
  categories = [],
  loading = false,
  selectedCategory = 'All',
  selectedSubcategory = '',
  onSelectCategory,
}: ShopByCategoryProps) {
  // Graceful fallback to default seed categories if database returns 0 items
  const activeCategories =
    categories && categories.length > 0 ? categories : (SEED_CATEGORIES as CategoryItem[]);

  return (
    <section
      aria-labelledby="shop-by-category-heading"
      className="relative w-full py-4 sm:py-6 lg:py-8"
    >
      <div className="w-full space-y-4 sm:space-y-6">
        {/* 1. SECTION HEADER (Left green accent bar, title, subtitle + Right View All) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 px-1">
          <div className="flex items-start gap-3">
            {/* Vertical Accent Pill */}
            <span
              className="w-1.5 h-6 sm:h-7 rounded-full bg-[#064E3B] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h2
                id="shop-by-category-heading"
                className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-[#111827] tracking-tight leading-tight font-heading"
              >
                Shop by Category
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-normal mt-0.5">
                Explore our wide range of fresh flowers, garlands and traditional items
              </p>
            </div>
          </div>

          {/* Right Action: "View all categories →" */}
          <Link
            href="/shop"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#F97316] hover:text-[#EA580C] transition-colors self-start sm:self-auto cursor-pointer"
            aria-label="View all categories and flowers"
          >
            <span>View all categories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 2. MAIN HORIZONTAL CATEGORY CAROUSEL */}
        {loading && (!categories || categories.length === 0) ? (
          // Loading Skeleton matching auto-aligned layout
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 py-2 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full h-[320px] sm:h-[340px] lg:h-[360px] rounded-3xl bg-stone-100/90 animate-pulse border border-stone-200/60 p-4 flex flex-col justify-between"
              >
                <div className="w-24 h-5 rounded-full bg-stone-200" />
                <div className="w-full h-[180px] rounded-2xl bg-stone-200/70" />
                <div className="space-y-2 pt-2">
                  <div className="w-3/4 h-5 rounded-lg bg-stone-200" />
                  <div className="w-1/2 h-4 rounded-lg bg-stone-200/60" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CategoryCarousel
            categories={activeCategories}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onSelectCategory={onSelectCategory}
          />
        )}
      </div>
    </section>
  );
}
