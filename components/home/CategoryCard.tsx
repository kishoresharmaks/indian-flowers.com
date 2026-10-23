'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';

export interface CategoryCardProps {
  name: string;
  slug?: string;
  image?: string;
  isSelected?: boolean;
  onClick?: () => void;
  index?: number;
}

// Category-specific pastel palettes matching Style 5 mockup
interface ThemeStyle {
  bgGradient: string;
  borderColor: string;
  hoverBorder: string;
  arrowColor: string;
}

function getCategoryTheme(name: string, index: number): ThemeStyle {
  const lower = name.toLowerCase();

  if (lower.includes('wedding')) {
    return {
      bgGradient: 'from-[#FFF0F3] via-[#FFF5F7] to-[#FFE2E8]',
      borderColor: 'border-rose-100',
      hoverBorder: 'hover:border-rose-300',
      arrowColor: 'text-rose-700',
    };
  }
  if (lower.includes('nanthiyavattom') || lower.includes('mallipoo')) {
    return {
      bgGradient: 'from-[#F2FBF5] via-[#F8FCF9] to-[#E2F7EB]',
      borderColor: 'border-emerald-100',
      hoverBorder: 'hover:border-emerald-300',
      arrowColor: 'text-[#064E3B]',
    };
  }
  if (lower.includes('tube rose') || lower.includes('lily') || lower.includes('sampangi')) {
    return {
      bgGradient: 'from-[#FFF0F7] via-[#FFF5F9] to-[#FCE2EF]',
      borderColor: 'border-pink-100',
      hoverBorder: 'hover:border-pink-300',
      arrowColor: 'text-pink-700',
    };
  }
  if (lower.includes('pooja flower') || lower.includes('loose flower')) {
    return {
      bgGradient: 'from-[#FFFDF0] via-[#FFFDF5] to-[#FFF6D6]',
      borderColor: 'border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      arrowColor: 'text-amber-700',
    };
  }
  if (lower.includes('pooja leave') || lower.includes('leaves')) {
    return {
      bgGradient: 'from-[#F4FAF5] via-[#F7FCF8] to-[#E5F5E8]',
      borderColor: 'border-emerald-100',
      hoverBorder: 'hover:border-emerald-300',
      arrowColor: 'text-[#064E3B]',
    };
  }
  if (lower.includes('string') || lower.includes('garland string')) {
    return {
      bgGradient: 'from-[#FAF7F2] via-[#FDFBF8] to-[#F3EDE2]',
      borderColor: 'border-stone-200',
      hoverBorder: 'hover:border-stone-300',
      arrowColor: 'text-stone-700',
    };
  }
  if (lower.includes('decor')) {
    return {
      bgGradient: 'from-[#FFF9F2] via-[#FFFDF8] to-[#FEEED8]',
      borderColor: 'border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      arrowColor: 'text-amber-800',
    };
  }
  if (lower.includes('coconut')) {
    return {
      bgGradient: 'from-[#FAF6F2] via-[#FDFBF9] to-[#F1EAE2]',
      borderColor: 'border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      arrowColor: 'text-amber-900',
    };
  }
  if (lower.includes('event')) {
    return {
      bgGradient: 'from-[#FFF5F2] via-[#FFF9F7] to-[#FEE8E2]',
      borderColor: 'border-rose-100',
      hoverBorder: 'hover:border-rose-300',
      arrowColor: 'text-rose-700',
    };
  }
  if (lower.includes('temple')) {
    return {
      bgGradient: 'from-[#FFFBF0] via-[#FFFDF7] to-[#FEF4DA]',
      borderColor: 'border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      arrowColor: 'text-amber-800',
    };
  }
  if (lower.includes('house warming')) {
    return {
      bgGradient: 'from-[#FFF5F0] via-[#FFF8F5] to-[#FEE9DD]',
      borderColor: 'border-orange-100',
      hoverBorder: 'hover:border-orange-300',
      arrowColor: 'text-orange-800',
    };
  }
  if (lower.includes('veni')) {
    return {
      bgGradient: 'from-[#FAF7F2] via-[#FCFAF6] to-[#F3EFE6]',
      borderColor: 'border-stone-200',
      hoverBorder: 'hover:border-stone-300',
      arrowColor: 'text-stone-700',
    };
  }

  // Fallback cyclic rotation
  const fallbacks: ThemeStyle[] = [
    {
      bgGradient: 'from-[#FFF0F3] via-[#FFF5F7] to-[#FFE2E8]',
      borderColor: 'border-rose-100',
      hoverBorder: 'hover:border-rose-300',
      arrowColor: 'text-rose-700',
    },
    {
      bgGradient: 'from-[#F2FBF5] via-[#F8FCF9] to-[#E2F7EB]',
      borderColor: 'border-emerald-100',
      hoverBorder: 'hover:border-emerald-300',
      arrowColor: 'text-[#064E3B]',
    },
    {
      bgGradient: 'from-[#FFFDF0] via-[#FFFDF5] to-[#FFF6D6]',
      borderColor: 'border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      arrowColor: 'text-amber-700',
    },
  ];
  return fallbacks[index % fallbacks.length];
}

export default function CategoryCard({
  name,
  image,
  isSelected = false,
  onClick,
  index = 0,
}: CategoryCardProps) {
  const [imgSrc, setImgSrc] = useState(image || DEFAULT_FLORAL_PLACEHOLDER);
  const theme = getCategoryTheme(name, index);

  return (
    <div
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 text-left cursor-pointer select-none snap-start bg-gradient-to-b ${
        theme.bgGradient
      } ${theme.borderColor} ${theme.hoverBorder} ${
        isSelected
          ? 'ring-2 ring-[#064E3B] border-[#064E3B] shadow-md'
          : 'shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5'
      } w-[142px] min-w-[142px] sm:w-[172px] sm:min-w-[172px] md:w-[190px] md:min-w-[190px] lg:w-[204px] lg:min-w-[204px] h-[220px] sm:h-[250px] md:h-[270px] lg:h-[280px] p-2.5 sm:p-3 shrink-0`}
    >
      {/* Top Image Showcase with Soft Floral Shadow & Subtle Rounded Container */}
      <div className="relative w-full h-[135px] sm:h-[155px] md:h-[170px] lg:h-[178px] rounded-xl overflow-hidden bg-white/70 shadow-xs flex items-center justify-center p-1 sm:p-1.5 transition-colors group-hover:bg-white">
        <img
          src={imgSrc}
          alt={`${name} collection`}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_FLORAL_PLACEHOLDER)}
          className="w-full h-full object-cover object-center rounded-lg transition-transform duration-500 ease-out group-hover:scale-108"
        />
      </div>

      {/* Bottom Content Area: Category Name + Circular Arrow Action */}
      <div className="pt-2 sm:pt-2.5 flex items-end justify-between gap-1.5 min-w-0">
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] sm:text-[14px] md:text-[14.5px] font-bold text-[#18231F] group-hover:text-[#064E3B] transition-colors leading-[1.2] line-clamp-2">
            {name}
          </h4>
        </div>

        {/* Circular Action Button */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-xs border border-stone-200/60 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-[#064E3B] group-hover:border-[#064E3B] group-hover:scale-105 ${
            isSelected ? 'bg-[#064E3B] border-[#064E3B]' : ''
          }`}
          aria-hidden="true"
        >
          <ArrowRight
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isSelected ? 'text-white' : `${theme.arrowColor} group-hover:text-white`
            }`}
          />
        </div>
      </div>
    </div>
  );
}
