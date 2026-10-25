'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';

export interface CategoryCardProps {
  name: string;
  slug?: string;
  image?: string;
  subcategories?: any[];
  isSelected?: boolean;
  onClick?: () => void;
  index?: number;
}

interface ThemeStyle {
  bgGradient: string;
  borderColor: string;
  hoverBorder: string;
  arrowColor: string;
  badgeBg: string;
  tagline: string;
  preview: string;
}

function getCategoryTheme(name: string, index: number): ThemeStyle {
  const lower = name.toLowerCase();

  if (lower.includes('wedding')) {
    return {
      bgGradient: 'from-[#FFF0F4] via-[#FFF6F8] to-[#FDE4EC]',
      borderColor: 'border-rose-200/80',
      hoverBorder: 'hover:border-rose-400',
      arrowColor: 'text-[#C85A78]',
      badgeBg: 'bg-rose-100 text-rose-800',
      tagline: 'Vivah & Varmala',
      preview: 'Rose Petal, Button Rose, Veni',
    };
  }
  if (lower.includes('house warming')) {
    return {
      bgGradient: 'from-[#FFF5F0] via-[#FFF8F5] to-[#FEE8DC]',
      borderColor: 'border-orange-200/80',
      hoverBorder: 'hover:border-orange-400',
      arrowColor: 'text-orange-700',
      badgeBg: 'bg-orange-100 text-orange-800',
      tagline: 'Grihapravesam',
      preview: 'Doorway Torans & Strands',
    };
  }
  if (lower.includes('temple')) {
    return {
      bgGradient: 'from-[#FFFDF0] via-[#FFFDF5] to-[#FEF3C7]',
      borderColor: 'border-amber-200/80',
      hoverBorder: 'hover:border-amber-400',
      arrowColor: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-800',
      tagline: 'Deity Offerings',
      preview: 'Vilvam, Vadamalli & Lilly',
    };
  }
  if (lower.includes('string') || lower.includes('leaves')) {
    return {
      bgGradient: 'from-[#F2FBF5] via-[#F7FCF9] to-[#E5F7ED]',
      borderColor: 'border-emerald-200/80',
      hoverBorder: 'hover:border-emerald-400',
      arrowColor: 'text-[#0B3B24]',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      tagline: 'Strings & Leaves',
      preview: 'Jasmine, Sacred Leaves, Decor',
    };
  }

  // Fallbacks
  const fallbacks: ThemeStyle[] = [
    {
      bgGradient: 'from-[#FFF0F4] via-[#FFF6F8] to-[#FDE4EC]',
      borderColor: 'border-rose-200/80',
      hoverBorder: 'hover:border-rose-400',
      arrowColor: 'text-[#C85A78]',
      badgeBg: 'bg-rose-100 text-rose-800',
      tagline: 'Wedding Flowers',
      preview: 'Traditional Garlands',
    },
    {
      bgGradient: 'from-[#F2FBF5] via-[#F7FCF9] to-[#E5F7ED]',
      borderColor: 'border-emerald-200/80',
      hoverBorder: 'hover:border-emerald-400',
      arrowColor: 'text-[#0B3B24]',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      tagline: 'Fresh Jasmine',
      preview: 'Sacred Floral Strands',
    },
    {
      bgGradient: 'from-[#FFFDF0] via-[#FFFDF5] to-[#FEF3C7]',
      borderColor: 'border-amber-200/80',
      hoverBorder: 'hover:border-amber-400',
      arrowColor: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-800',
      tagline: 'Temple Puja',
      preview: 'Auspicious Offerings',
    },
  ];
  return fallbacks[index % fallbacks.length];
}

export default function CategoryCard({
  name,
  image,
  subcategories = [],
  isSelected = false,
  onClick,
  index = 0,
}: CategoryCardProps) {
  const [imgSrc, setImgSrc] = useState(image || DEFAULT_FLORAL_PLACEHOLDER);
  const theme = getCategoryTheme(name, index);
  const subCount = Array.isArray(subcategories) ? subcategories.length : 0;

  return (
    <div
      data-category-card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Browse ${name} category`}
      className={`group/card relative flex flex-col justify-between overflow-hidden rounded-3xl border transition-all duration-300 text-left cursor-pointer select-none snap-center bg-gradient-to-b ${
        theme.bgGradient
      } ${theme.borderColor} ${theme.hoverBorder} ${
        isSelected
          ? 'ring-2 ring-[#0B3B24] border-[#0B3B24] shadow-md scale-[1.01]'
          : 'shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1.5'
      } w-[74vw] max-w-[290px] min-w-[230px] sm:w-[260px] sm:min-w-[260px] md:w-full md:min-w-0 md:max-w-none h-auto min-h-[300px] sm:min-h-[320px] md:min-h-[340px] lg:min-h-[360px] p-3.5 sm:p-4 shrink-0 md:shrink`}
    >
      {/* Top Header: Badge Eyebrow & Subcategory Count */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider ${theme.badgeBg}`}
        >
          {theme.tagline}
        </span>
        {subCount > 0 && (
          <span className="text-[11px] font-semibold text-stone-500/90">
            {subCount} Collections
          </span>
        )}
      </div>

      {/* Top Image Showcase with Soft Floral Shadow & Subtle Rounded Container */}
      <div className="relative w-full h-[165px] sm:h-[180px] md:h-[195px] lg:h-[215px] rounded-2xl overflow-hidden bg-white/80 shadow-xs flex items-center justify-center p-1.5 transition-colors group-hover/card:bg-white border border-white/60">
        <img
          src={imgSrc}
          alt={`${name} collection`}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_FLORAL_PLACEHOLDER)}
          className="w-full h-full object-cover object-center rounded-xl transition-transform duration-500 ease-out group-hover/card:scale-106"
        />
      </div>

      {/* Bottom Content Area: Category Name + Subtitle + Circular Arrow Action */}
      <div className="pt-3 sm:pt-3.5 flex items-end justify-between gap-2 min-w-0 mt-auto">
        <div className="min-w-0 flex-1">
          <h4 className="text-[14.5px] sm:text-[15.5px] md:text-[16px] lg:text-[17px] font-extrabold text-[#111827] group-hover/card:text-[#0B3B24] transition-colors leading-[1.25] tracking-tight line-clamp-2">
            {name}
          </h4>
          <p className="text-[11.5px] sm:text-xs text-stone-500 font-medium truncate mt-0.5">
            {theme.preview}
          </p>
        </div>

        {/* Circular Action Button */}
        <div
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-xs border border-stone-200/70 flex items-center justify-center shrink-0 transition-all duration-300 group-hover/card:bg-[#0B3B24] group-hover/card:border-[#0B3B24] group-hover/card:scale-105 ${
            isSelected ? 'bg-[#0B3B24] border-[#0B3B24]' : ''
          }`}
          aria-hidden="true"
        >
          <ArrowRight
            className={`w-4 h-4 transition-colors ${
              isSelected ? 'text-white' : `${theme.arrowColor} group-hover/card:text-white`
            }`}
          />
        </div>
      </div>
    </div>
  );
}
