'use client';

import React, { useState, useEffect } from 'react';
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
  isGrid?: boolean;
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
  if (lower.includes('brass')) {
    return {
      bgGradient: 'from-[#FFFDF0] via-[#FFFDF5] to-[#FEF3C7]',
      borderColor: 'border-amber-200/80',
      hoverBorder: 'hover:border-amber-400',
      arrowColor: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-900',
      tagline: 'Brass & Sacred Decor',
      preview: 'Pooja Idols, Lamps & Plates',
    };
  }
  if (lower.includes('pooja') || lower.includes('puja')) {
    return {
      bgGradient: 'from-[#F2FBF5] via-[#F7FCF9] to-[#E5F7ED]',
      borderColor: 'border-emerald-200/80',
      hoverBorder: 'hover:border-emerald-400',
      arrowColor: 'text-[#0B3B24]',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      tagline: 'Sacred Pooja',
      preview: 'Fresh Offerings & Leaves',
    };
  }
  if (lower.includes('carnation')) {
    return {
      bgGradient: 'from-[#FFF0F4] via-[#FFF6F8] to-[#FDE4EC]',
      borderColor: 'border-rose-200/80',
      hoverBorder: 'hover:border-rose-400',
      arrowColor: 'text-[#C85A78]',
      badgeBg: 'bg-rose-100 text-rose-800',
      tagline: 'Carnation Garlands',
      preview: 'Handcrafted Celebrations',
    };
  }
  if (lower.includes('rose')) {
    return {
      bgGradient: 'from-[#FFF0F4] via-[#FFF6F8] to-[#FDE4EC]',
      borderColor: 'border-rose-200/80',
      hoverBorder: 'hover:border-rose-400',
      arrowColor: 'text-[#C85A78]',
      badgeBg: 'bg-rose-100 text-rose-800',
      tagline: 'Fresh Roses',
      preview: 'Button Rose & Petals',
    };
  }
  if (lower.includes('string') || lower.includes('leaves') || lower.includes('jasmine')) {
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

  // Balanced Fallbacks
  const fallbacks: ThemeStyle[] = [
    {
      bgGradient: 'from-[#FFF0F4] via-[#FFF6F8] to-[#FDE4EC]',
      borderColor: 'border-rose-200/80',
      hoverBorder: 'hover:border-rose-400',
      arrowColor: 'text-[#C85A78]',
      badgeBg: 'bg-rose-100 text-rose-800',
      tagline: 'Floral Collection',
      preview: 'Traditional Garlands',
    },
    {
      bgGradient: 'from-[#F2FBF5] via-[#F7FCF9] to-[#E5F7ED]',
      borderColor: 'border-emerald-200/80',
      hoverBorder: 'hover:border-emerald-400',
      arrowColor: 'text-[#0B3B24]',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      tagline: 'Fresh Flowers',
      preview: 'Auspicious Strands',
    },
    {
      bgGradient: 'from-[#FFFDF0] via-[#FFFDF5] to-[#FEF3C7]',
      borderColor: 'border-amber-200/80',
      hoverBorder: 'hover:border-amber-400',
      arrowColor: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-800',
      tagline: 'Ceremonial Essentials',
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
  isGrid = false,
}: CategoryCardProps) {
  const [imgSrc, setImgSrc] = useState(image || DEFAULT_FLORAL_PLACEHOLDER);
  const theme = getCategoryTheme(name, index);
  const subCount = Array.isArray(subcategories) ? subcategories.length : 0;

  useEffect(() => {
    if (image) {
      setImgSrc(image);
    }
  }, [image]);

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
      className={`group/card relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 text-left cursor-pointer select-none snap-center sm:snap-start bg-gradient-to-b ${
        theme.bgGradient
      } ${theme.borderColor} ${theme.hoverBorder} ${
        isSelected
          ? 'ring-2 ring-[#0B3B24] border-[#0B3B24] shadow-md scale-[1.01]'
          : 'shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1.5'
      } ${
        isGrid
          ? 'w-[75vw] min-w-[240px] max-w-[280px] shrink-0 md:w-full md:min-w-0 md:max-w-none md:shrink'
          : 'w-[75vw] min-w-[240px] max-w-[280px] sm:w-[250px] sm:min-w-[250px] md:w-[270px] md:min-w-[270px] lg:w-[280px] lg:min-w-[280px] shrink-0'
      } h-[310px] sm:h-[330px] md:h-[350px] p-3.5 sm:p-4`}
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
      <div className="relative w-full h-[155px] sm:h-[170px] md:h-[185px] rounded-2xl overflow-hidden bg-white/85 shadow-xs flex items-center justify-center p-2 transition-colors group-hover/card:bg-white border border-white/60">
        <img
          src={imgSrc}
          alt={`${name} collection`}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_FLORAL_PLACEHOLDER)}
          className="w-full h-full object-cover object-center rounded-xl transition-transform duration-500 ease-out group-hover/card:scale-105"
        />
      </div>

      {/* Bottom Content Area: Category Name + Subtitle + Circular Arrow Action */}
      <div className="pt-2.5 sm:pt-3 flex items-end justify-between gap-2 min-w-0 mt-auto">
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] sm:text-[15px] md:text-[16px] font-extrabold text-[#111827] group-hover/card:text-[#0B3B24] transition-colors leading-[1.3] tracking-tight line-clamp-2">
            {name}
          </h4>
          <p className="text-[11px] sm:text-xs text-stone-500 font-medium truncate mt-0.5">
            {theme.preview}
          </p>
        </div>

        {/* Circular Action Button — Forest Green with Crisp White Arrow */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0B3B24] text-white shadow-xs flex items-center justify-center shrink-0 transition-all duration-300 group-hover/card:bg-[#1C563F] group-hover/card:scale-110 active:scale-95"
          aria-hidden="true"
        >
          <ArrowRight className="w-4 h-4 text-white stroke-[2.2] transition-transform duration-300 group-hover/card:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
