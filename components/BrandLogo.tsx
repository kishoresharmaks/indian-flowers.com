import React from 'react';
import Link from 'next/link';

export interface LotusIconProps {
  className?: string;
}

/**
 * Stylized Indian Lotus Emblem SVG
 * Multi-petal authentic Indian floral mark:
 * - Central sacred crimson petal (#E0533C)
 * - Radiant marigold/saffron side petals (#E58D3D)
 * - Fresh emerald base foliage petals (#15803D)
 */
export function LotusIcon({ className = 'w-5.5 h-5.5 sm:w-7 sm:h-7' }: LotusIconProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Central Lotus Blossom Petal */}
      <path
        d="M20 5C20 5 13 14 13 22C13 26 16.5 29 20 29C23.5 29 27 26 27 22C27 14 20 5 20 5Z"
        fill="#E0533C"
      />
      {/* Left Radiant Petal */}
      <path
        d="M17 12C17 12 8 18 8 24C8 28 11.5 31 16 30C12 26 14 19 17 12Z"
        fill="#E58D3D"
      />
      {/* Right Radiant Petal */}
      <path
        d="M23 12C23 12 32 18 32 24C32 28 28.5 31 24 30C28 26 26 19 23 12Z"
        fill="#E58D3D"
      />
      {/* Base Green Leaf Petals */}
      <path
        d="M11 26C7 28 6 32 8 33C11 34 16 32 18 29C15 28 12.5 27 11 26Z"
        fill="#15803D"
      />
      <path
        d="M29 26C33 28 34 32 32 33C29 34 24 32 22 29C25 28 27.5 27 29 26Z"
        fill="#15803D"
      />
    </svg>
  );
}

export interface BrandLogoProps {
  storeName?: string;
  storeTagline?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  asLink?: boolean;
  href?: string;
}

export default function BrandLogo({
  storeName = 'The Indian Flowers',
  storeTagline = 'Fresh Indian Garlands • USA',
  variant = 'light',
  size = 'md',
  showTagline = true,
  className = '',
  asLink = true,
  href = '/',
}: BrandLogoProps) {
  // Container sizes for emblem
  const badgeSizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-9 h-9 sm:w-10 sm:h-10',
  }[size];

  // SVG Icon sizes
  const iconSizeClasses = {
    sm: 'w-4.5 h-4.5 sm:w-5.5 sm:h-5.5',
    md: 'w-5.5 h-5.5 sm:w-7 sm:h-7',
    lg: 'w-6 h-6 sm:w-7.5 sm:h-7.5',
  }[size];

  // Typography styling
  const titleSizeClasses = {
    sm: 'text-sm sm:text-base font-bold',
    md: 'text-[14.5px] sm:text-xl font-bold',
    lg: 'text-base sm:text-xl font-bold',
  }[size];

  const isDark = variant === 'dark';

  const content = (
    <>
      {/* Stylized Indian Lotus Emblem Badge */}
      <div
        className={`${badgeSizeClasses} rounded-full bg-[#F4F8F4] border border-emerald-100/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
      >
        <LotusIcon className={iconSizeClasses} />
      </div>

      {/* Brand Typography */}
      <div className="min-w-0">
        <span
          className={`${titleSizeClasses} ${
            isDark ? 'text-white' : 'text-[#134633]'
          } tracking-[-0.03em] block leading-tight truncate`}
        >
          {storeName}
        </span>
        {showTagline && (
          <span
            className={`block text-[10px] sm:text-[10.5px] font-normal tracking-wide mt-0.5 truncate ${
              isDark ? 'text-emerald-300 font-medium' : 'text-gray-500'
            }`}
          >
            {storeTagline}
          </span>
        )}
      </div>
    </>
  );

  const wrapperClasses = `inline-flex items-center gap-2 group min-w-0 ${className}`;

  if (asLink) {
    return (
      <Link href={href} className={wrapperClasses}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClasses}>{content}</div>;
}
