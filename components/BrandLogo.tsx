import React from 'react';
import Link from 'next/link';

export interface LotusIconProps {
  className?: string;
}

/**
 * The Indian Flowers Authentic Floral Emblem
 */
export function LotusIcon({ className = 'w-6 h-6 sm:w-7 sm:h-7' }: LotusIconProps) {
  return (
    <img
      src="/the-indian-flowers-emblem-sm.webp?v=3"
      alt="The Indian Flowers Emblem"
      width={32}
      height={32}
      className={`${className} object-contain`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/the-indian-flowers-emblem.webp?v=2';
      }}
    />
  );
}

export interface BrandLogoProps {
  storeName?: string;
  storeTagline?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  imgClassName?: string;
  asLink?: boolean;
  href?: string;
}

export default function BrandLogo({
  storeName = 'The Indian Flowers',
  storeTagline = 'Fresh Indian Garlands • USA',
  variant = 'light',
  size = 'md',
  showTagline = false,
  className = '',
  imgClassName = '',
  asLink = true,
  href = '/',
}: BrandLogoProps) {
  const isDark = variant === 'dark';

  // Height sizing for the official logo
  // The official horizontal brand logo has an aspect ratio of 24:7 (480x140)
  // Scaled height classes provide prominent, crystal-sharp branding across viewports
  const logoHeightClasses = {
    sm: 'h-9 sm:h-10 max-h-[42px]',
    md: 'h-12 sm:h-13 md:h-15 lg:h-[66px] xl:h-[72px] max-h-[76px]',
    lg: 'h-14 sm:h-16 md:h-18 lg:h-[76px] xl:h-[84px] max-h-[88px]',
  }[size];

  const content = isDark ? (
    <div className="inline-flex items-center px-3.5 py-2 bg-[#FAF6F0] rounded-2xl border border-white/20 shadow-xs group-hover:shadow-sm transition-all">
      <img
        src="/the-indian-flowers-logo.png?v=9"
        alt={storeName}
        width={240}
        height={70}
        className={`${logoHeightClasses} w-auto object-contain aspect-[24/7] ${imgClassName}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/the-indian-flowers-logo.webp?v=9';
        }}
      />
    </div>
  ) : (
    <div className="inline-flex flex-col items-start">
      <img
        src="/the-indian-flowers-logo.png?v=9"
        alt={storeName}
        width={240}
        height={70}
        className={`${logoHeightClasses} w-auto object-contain aspect-[24/7] transition-transform duration-200 group-hover:scale-102 ${imgClassName}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/the-indian-flowers-logo.webp?v=9';
        }}
      />
      {showTagline && (
        <span className="text-[11px] sm:text-xs font-semibold text-stone-600 tracking-wide mt-1 truncate">
          {storeTagline}
        </span>
      )}
    </div>
  );

  const wrapperClasses = `inline-flex items-center group min-w-0 ${className}`;

  if (asLink) {
    return (
      <Link href={href} className={wrapperClasses} aria-label={storeName}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClasses}>{content}</div>;
}
