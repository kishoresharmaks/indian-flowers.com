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
      src="/the-indian-flowers-emblem.webp?v=2"
      alt="The Indian Flowers Emblem"
      className={`${className} object-contain`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/the-indian-flowers-emblem.png?v=2';
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
  // Mobile heights (h-11 = 44px) ensure crisp visibility and full legibility of the emblem & brand typography
  const logoHeightClasses = {
    sm: 'h-8 sm:h-9 max-h-[36px]',
    md: 'h-11 sm:h-12 md:h-12 max-h-[48px]',
    lg: 'h-12 sm:h-14 md:h-16 max-h-[64px]',
  }[size];

  const content = isDark ? (
    <div className="inline-flex items-center px-3 py-1.5 bg-[#FAF6F0] rounded-xl border border-white/20 shadow-xs group-hover:shadow-sm transition-all">
      <img
        src="/the-indian-flowers-logo.webp?v=2"
        alt={storeName}
        className={`${logoHeightClasses} w-auto object-contain aspect-[692/640] ${imgClassName}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/the-indian-flowers-logo.png?v=2';
        }}
      />
    </div>
  ) : (
    <div className="inline-flex flex-col items-start">
      <img
        src="/the-indian-flowers-logo.webp?v=2"
        alt={storeName}
        className={`${logoHeightClasses} w-auto object-contain aspect-[692/640] transition-transform duration-200 group-hover:scale-102 ${imgClassName}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/the-indian-flowers-logo.png?v=2';
        }}
      />
      {showTagline && (
        <span className="text-[10px] sm:text-[10.5px] font-medium text-stone-500 tracking-wide mt-0.5 truncate">
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
