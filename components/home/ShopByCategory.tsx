'use client';

import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import CategoryCarousel, { CategoryItem } from './CategoryCarousel';
import { SEED_CATEGORIES } from '@/lib/seedData';

// Authentic Auspicious SVG Icons for Category Shortcuts matching Style 5 mockup
function DiyaLampIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* Flame */}
      <path
        d="M12 2C12 2 14.5 5 14.5 7.5C14.5 8.88 13.38 10 12 10C10.62 10 9.5 8.88 9.5 7.5C9.5 5 12 2 12 2Z"
        fill="#F59E0B"
      />
      <path
        d="M12 4.5C12 4.5 13.2 6.2 13.2 7.5C13.2 8.16 12.66 8.7 12 8.7C11.34 8.7 10.8 8.16 10.8 7.5C10.8 6.2 12 4.5 12 4.5Z"
        fill="#EF4444"
      />
      {/* Brass Lamp Base */}
      <path
        d="M4 13C4 13 4 17 12 17C20 17 20 13 20 13L21.5 13.5C21.8 13.6 22 13.9 22 14.2C21.7 17.5 17.5 20 12 20C6.5 20 2.3 17.5 2 14.2C2 13.9 2.2 13.6 2.5 13.5L4 13Z"
        fill="#D97706"
      />
      <ellipse cx="12" cy="13" rx="8" ry="2.2" fill="#FBBF24" />
      <path d="M10 20H14V22H10V20Z" fill="#B45309" />
    </svg>
  );
}

function CoconutShortcutIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* Brown Husk */}
      <circle cx="12" cy="13" r="8" fill="#78350F" />
      <circle cx="12" cy="13" r="6.8" fill="#92400E" />
      {/* Auspicious Green Tuft on top */}
      <path d="M12 5C10.5 2 12 0.5 12 0.5C12 0.5 13.5 2 12 5Z" fill="#15803D" />
      <path d="M10 6C8 3.5 9.5 2 9.5 2C9.5 2 11 3.5 10 6Z" fill="#16A34A" />
      <path d="M14 6C16 3.5 14.5 2 14.5 2C14.5 2 13 3.5 14 6Z" fill="#16A34A" />
      {/* Inner White Coconut Meat & Auspicious 3 Eyes */}
      <circle cx="10.5" cy="11.5" r="1.1" fill="#451A03" />
      <circle cx="13.5" cy="11.5" r="1.1" fill="#451A03" />
      <circle cx="12" cy="14.5" r="1.1" fill="#451A03" />
    </svg>
  );
}

function ToranArchIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* Entrance Arch Pillars */}
      <rect x="3" y="6" width="3" height="16" rx="1" fill="#B45309" />
      <rect x="18" y="6" width="3" height="16" rx="1" fill="#B45309" />
      <path d="M2 6H22V9H2V6Z" fill="#DC2626" />
      {/* Festoon / Garland Swag */}
      <path
        d="M4 9C4 9 7 13 12 13C17 13 20 9 20 9"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="7" cy="11.5" r="1.5" fill="#EF4444" />
      <circle cx="12" cy="13" r="1.8" fill="#F97316" />
      <circle cx="17" cy="11.5" r="1.5" fill="#EF4444" />
      <path d="M12 2L15 6H9L12 2Z" fill="#F59E0B" />
    </svg>
  );
}

function TempleKalasamIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* Temple Gopuram / Tower Silhouette */}
      <path d="M12 2L14 5H10L12 2Z" fill="#F59E0B" />
      <rect x="11.2" y="1" width="1.6" height="3" fill="#D97706" />
      <path d="M8 5H16L17 9H7L8 5Z" fill="#D97706" />
      <path d="M6 9H18L19 14H5L6 9Z" fill="#F59E0B" />
      <path d="M4 14H20V22H4V14Z" fill="#B45309" />
      {/* Inner Shrine Doorway */}
      <path d="M9 17C9 15.34 10.34 14 12 14C13.66 14 15 15.34 15 17V22H9V17Z" fill="#FEF3C7" />
    </svg>
  );
}

function HouseWarmingIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* Traditional Indian House Roof */}
      <path d="M12 3L2 11H5V21H19V11H22L12 3Z" fill="#EA580C" />
      {/* Auspicious Mango Leaves Toran on doorway */}
      <path d="M7 11C7 11 9.5 13 12 13C14.5 13 17 11 17 11" stroke="#16A34A" strokeWidth="1.5" />
      <path d="M9 13C9 13 12 15 15 13" stroke="#F59E0B" strokeWidth="1.2" />
      <rect x="9.5" y="14" width="5" height="7" rx="1" fill="#FEF3C7" />
    </svg>
  );
}

function VeniGarlandIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* Circular Floral Veni / Hair Garland */}
      <circle cx="12" cy="12" r="8" stroke="#FEF3C7" strokeWidth="3.5" fill="none" />
      <circle cx="12" cy="12" r="8" stroke="#FDE68A" strokeWidth="2.5" strokeDasharray="3 3" fill="none" />
      <circle cx="6.5" cy="8" r="1.8" fill="#E11D48" />
      <circle cx="17.5" cy="8" r="1.8" fill="#E11D48" />
      <circle cx="12" cy="4.5" r="2" fill="#E11D48" />
      <circle cx="12" cy="19.5" r="2" fill="#E11D48" />
      <circle cx="6.5" cy="16" r="1.8" fill="#E11D48" />
      <circle cx="17.5" cy="16" r="1.8" fill="#E11D48" />
    </svg>
  );
}

function MarigoldFlowerIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#F59E0B" />
      <circle cx="12" cy="12" r="6.5" fill="#D97706" />
      <circle cx="12" cy="12" r="4" fill="#B45309" />
      <circle cx="12" cy="12" r="2" fill="#FEF3C7" />
      <path
        d="M12 3V21M3 12H21M5.6 5.6L18.4 18.4M18.4 5.6L5.6 18.4"
        stroke="#FEF3C7"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BetelLeavesIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 2C7 6 4 11 4 15C4 18.87 7.13 22 11 22C11.34 22 11.67 21.98 12 21.93C12.33 21.98 12.66 22 13 22C16.87 22 20 18.87 20 15C20 11 17 6 12 2Z"
        fill="#16A34A"
      />
      <path
        d="M12 2V21M12 9C9 11 6.5 13 6.5 13M12 13C15 15 17.5 17 17.5 17M12 6C15 8 17.5 10 17.5 10M12 16C9 18 7.5 19 7.5 19"
        stroke="#86EFAC"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function JasmineStringsIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 2V22" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="5" r="2.5" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1" />
      <circle cx="12" cy="10" r="2.5" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1" />
      <circle cx="12" cy="15" r="2.5" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1" />
      <circle cx="12" cy="20" r="2.5" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1" />
      <circle cx="12" cy="10" r="1.2" fill="#E11D48" />
    </svg>
  );
}

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

  // Compact Popular Shortcuts configuration aligned with 4 parent categories
  const shortcuts = [
    {
      name: 'Strings & Jasmine',
      categoryName: 'STRINGS & LEAVES',
      subcategoryName: 'Strings / Jasmine Strings',
      icon: JasmineStringsIcon,
      bg: 'bg-[#FAF7F2]',
      border: 'border-[#EDE5D8]',
    },
    {
      name: 'Wedding Garlands',
      categoryName: 'WEDDING GARLANDS',
      icon: VeniGarlandIcon,
      bg: 'bg-[#FFF0F3]',
      border: 'border-[#FFE2E8]',
    },
    {
      name: 'House Warming',
      categoryName: 'HOUSE WARMING GARLANDS',
      icon: HouseWarmingIcon,
      bg: 'bg-[#FFF6F0]',
      border: 'border-[#FEE7D8]',
    },
    {
      name: 'Temple Garlands',
      categoryName: 'TEMPLE GARLANDS',
      icon: TempleKalasamIcon,
      bg: 'bg-[#FFFBF0]',
      border: 'border-[#FEEFC4]',
    },
    {
      name: 'Pooja Leaves',
      categoryName: 'STRINGS & LEAVES',
      subcategoryName: 'Pooja Leaves',
      icon: BetelLeavesIcon,
      bg: 'bg-[#F2FBF5]',
      border: 'border-[#D1F4DE]',
    },
    {
      name: 'Decor Items',
      categoryName: 'STRINGS & LEAVES',
      subcategoryName: 'Decor Items',
      icon: DiyaLampIcon,
      bg: 'bg-[#FFF8F2]',
      border: 'border-[#FFE3D1]',
    },
  ];

  // Additional shortcuts on mobile for 3x2 grid view matching screenshot
  const mobileShortcuts = [
    {
      name: 'Jasmine Strings',
      categoryName: 'STRINGS & LEAVES',
      subcategoryName: 'Strings / Jasmine Strings',
      icon: JasmineStringsIcon,
      bg: 'bg-[#FAF7F2]',
      border: 'border-[#EDE5D8]',
    },
    {
      name: 'Wedding Garlands',
      categoryName: 'WEDDING GARLANDS',
      icon: VeniGarlandIcon,
      bg: 'bg-[#FFF0F3]',
      border: 'border-[#FFE2E8]',
    },
    {
      name: 'House Warming',
      categoryName: 'HOUSE WARMING GARLANDS',
      icon: HouseWarmingIcon,
      bg: 'bg-[#FFF6F0]',
      border: 'border-[#FEE7D8]',
    },
    {
      name: 'Temple Garlands',
      categoryName: 'TEMPLE GARLANDS',
      icon: TempleKalasamIcon,
      bg: 'bg-[#FFFBF0]',
      border: 'border-[#FEEFC4]',
    },
    {
      name: 'Pooja Flowers',
      categoryName: 'STRINGS & LEAVES',
      subcategoryName: 'Pooja Flowers',
      icon: MarigoldFlowerIcon,
      bg: 'bg-[#FFFDF0]',
      border: 'border-[#FEF0C7]',
    },
    {
      name: 'Pooja Leaves',
      categoryName: 'STRINGS & LEAVES',
      subcategoryName: 'Pooja Leaves',
      icon: BetelLeavesIcon,
      bg: 'bg-[#F2FBF5]',
      border: 'border-[#D1F4DE]',
    },
  ];

  return (
    <section
      aria-labelledby="shop-by-category-heading"
      className="relative w-full py-4 sm:py-6 lg:py-8"
    >
      <div className="w-full space-y-4 sm:space-y-6">
        {/* 1. SECTION HEADER (Style 5: Left green accent bar, title, subtitle + Right View All) */}
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
                className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-[#111827] tracking-tight leading-tight"
              >
                Shop by Category
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-normal mt-0.5">
                Explore our wide range of fresh flowers, garlands and traditional items
              </p>
            </div>
          </div>

          {/* Right Action: "View all categories →" */}
          <button
            type="button"
            onClick={() => onSelectCategory && onSelectCategory('All')}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#F97316] hover:text-[#EA580C] transition-colors self-start sm:self-auto cursor-pointer"
            aria-label="View all categories and flowers"
          >
            <span>View all categories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* 2. MAIN HORIZONTAL CATEGORY CAROUSEL */}
        {loading && (!categories || categories.length === 0) ? (
          // Loading Skeleton
          <div className="flex items-stretch gap-3 sm:gap-4 overflow-hidden py-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-[145px] sm:w-[175px] md:w-[195px] lg:w-[205px] h-[220px] sm:h-[260px] rounded-2xl bg-stone-200/60 animate-pulse border border-stone-200 shrink-0"
              />
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

        {/* 3. OPTIONAL CATEGORY SHORTCUTS (Style 5: Row of circular icon shortcuts below carousel) */}
        <div className="pt-2 sm:pt-4 border-t border-stone-200/50">
          {/* Desktop & Tablet: Horizontal Row */}
          <div className="hidden sm:flex items-center justify-around gap-3 lg:gap-6 flex-wrap">
            {shortcuts.map((sc) => {
              const IconComp = sc.icon;
              const isSelected =
                selectedCategory.trim().toLowerCase() === sc.categoryName.trim().toLowerCase() &&
                (!sc.subcategoryName ||
                  selectedSubcategory.trim().toLowerCase() === sc.subcategoryName.trim().toLowerCase());

              return (
                <button
                  key={sc.name}
                  type="button"
                  onClick={() =>
                    onSelectCategory && onSelectCategory(sc.categoryName, sc.subcategoryName)
                  }
                  className="group flex flex-col items-center gap-2 text-center transition-transform hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 rounded-2xl p-1.5"
                >
                  <div
                    className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-2xs border transition-all duration-300 ${
                      sc.bg
                    } ${sc.border} ${
                      isSelected
                        ? 'ring-2 ring-[#064E3B] border-[#064E3B] scale-105 shadow-md'
                        : 'group-hover:shadow-md group-hover:border-[#064E3B]/40'
                    }`}
                  >
                    <IconComp className="w-7 h-7 lg:w-8 lg:h-8 transition-transform group-hover:scale-110 duration-300" />
                  </div>
                  <span
                    className={`text-xs font-bold tracking-tight transition-colors ${
                      isSelected
                        ? 'text-[#064E3B]'
                        : 'text-stone-700 group-hover:text-[#064E3B]'
                    }`}
                  >
                    {sc.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile: 3-column x 2-row Compact Grid matching reference screenshot */}
          <div className="grid grid-cols-3 sm:hidden gap-3 px-1">
            {mobileShortcuts.map((sc) => {
              const IconComp = sc.icon;
              const isSelected =
                selectedCategory.trim().toLowerCase() === sc.categoryName.trim().toLowerCase() &&
                (!sc.subcategoryName ||
                  selectedSubcategory.trim().toLowerCase() === sc.subcategoryName.trim().toLowerCase());

              return (
                <button
                  key={sc.name}
                  type="button"
                  onClick={() =>
                    onSelectCategory && onSelectCategory(sc.categoryName, sc.subcategoryName)
                  }
                  className="group flex flex-col items-center gap-1.5 text-center transition-transform active:scale-95 cursor-pointer p-1"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xs border transition-all ${
                      sc.bg
                    } ${sc.border} ${
                      isSelected
                        ? 'ring-2 ring-[#064E3B] border-[#064E3B] scale-105'
                        : 'group-hover:border-[#064E3B]'
                    }`}
                  >
                    <IconComp className="w-6 h-6 transition-transform group-hover:scale-110" />
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-tight leading-tight line-clamp-1 ${
                      isSelected ? 'text-[#064E3B]' : 'text-stone-700'
                    }`}
                  >
                    {sc.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
