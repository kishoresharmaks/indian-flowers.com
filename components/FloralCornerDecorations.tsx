'use client';

import React from 'react';

interface FloralCornerDecorationsProps {
  className?: string;
}

export default function FloralCornerDecorations({
  className = '',
}: FloralCornerDecorationsProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
    >
      <div className="relative w-full max-w-[1920px] 3xl:max-w-[2040px] h-full mx-auto">
        {/* 1. TOP-LEFT: Fresh Madurai Jasmine Blossoms with Glossy Leaves */}
        <div className="absolute top-2 left-2 sm:top-0 sm:left-0 w-28 sm:w-36 md:w-44 lg:w-56 xl:w-64 max-w-[260px] aspect-[762/812] transform origin-top-left transition-all duration-500">
          <img
            src="/images/floral-decorations/jasmine-corner.webp"
            alt=""
            className="w-full h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] opacity-85 sm:opacity-90"
            loading="eager"
          />
        </div>

        {/* 2. TOP-RIGHT: Soft Pink Sacred Lotus in Bloom */}
        <div className="absolute top-2 right-2 sm:top-0 sm:right-0 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-52 max-w-[220px] aspect-[568/992] transform origin-top-right transition-all duration-500">
          <img
            src="/images/floral-decorations/lotus-corner.webp"
            alt=""
            className="w-full h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] opacity-85 sm:opacity-90"
            loading="eager"
          />
        </div>

        {/* 3. MID-HEIGHT SIDE ACCENTS & CREATIVE IN-BETWEEN DESIGNS */}

        {/* Mid-Left Handcrafted Varmala Strand (Around Category 2) */}
        <div className="absolute left-0 top-[28%] w-14 sm:w-20 md:w-24 lg:w-28 xl:w-32 aspect-[304/1328] transform origin-left transition-all duration-500 opacity-60 sm:opacity-75 lg:opacity-85 pointer-events-none">
          <img
            src="/images/floral-decorations/varmala-left-strand.webp"
            alt=""
            className="w-full h-full max-w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
            loading="lazy"
          />
        </div>

        {/* Mid-Right Festive Marigold & Lotus Cascade (Around Category 3/4) */}
        <div className="absolute right-0 top-[52%] w-16 sm:w-24 md:w-28 lg:w-32 xl:w-36 aspect-[554/1264] transform origin-right transition-all duration-500 opacity-60 sm:opacity-75 lg:opacity-85 pointer-events-none">
          <img
            src="/images/floral-decorations/marigold-right-cascade.webp"
            alt=""
            className="w-full h-full max-w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
            loading="lazy"
          />
        </div>

        {/* Scattered Floating Petals Down Left Margin */}
        <div className="absolute left-3 sm:left-6 md:left-10 top-[18%] w-4 h-4 sm:w-5 sm:h-5 opacity-50 sm:opacity-60 blur-[0.2px] pointer-events-none">
          <span className="block w-full h-full rounded-[50%_50%_50%_50%/70%_70%_30%_30%] bg-gradient-to-br from-pink-300 to-rose-400/80 rotate-45 shadow-xs" />
        </div>
        <div className="absolute left-4 sm:left-8 md:left-14 top-[48%] w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-45 sm:opacity-55 pointer-events-none">
          <span className="block w-full h-full rounded-full bg-gradient-to-br from-amber-300 to-orange-400/80 -rotate-12 shadow-xs" />
        </div>
        <div className="absolute left-2 sm:left-6 md:left-12 top-[76%] w-4 h-4 sm:w-5 sm:h-5 opacity-40 sm:opacity-50 pointer-events-none">
          <span className="block w-full h-full rounded-[50%_50%_50%_50%/70%_70%_30%_30%] bg-gradient-to-br from-pink-200 to-rose-300/70 rotate-30 shadow-xs" />
        </div>

        {/* Scattered Floating Petals Down Right Margin */}
        <div className="absolute right-3 sm:right-8 md:left-auto md:right-10 top-[22%] w-4 h-4 sm:w-4.5 sm:h-4.5 opacity-50 sm:opacity-60 pointer-events-none">
          <span className="block w-full h-full rounded-full bg-gradient-to-br from-amber-300 to-orange-400/80 rotate-45 shadow-xs" />
        </div>
        <div className="absolute right-4 sm:right-8 md:right-14 top-[44%] w-4 h-4 sm:w-5 sm:h-5 opacity-45 sm:opacity-55 blur-[0.3px] pointer-events-none">
          <span className="block w-full h-full rounded-[50%_50%_50%_50%/70%_70%_30%_30%] bg-gradient-to-br from-pink-300 to-rose-400/70 -rotate-30 shadow-xs" />
        </div>
        <div className="absolute right-3 sm:right-6 md:right-10 top-[78%] w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-40 sm:opacity-50 pointer-events-none">
          <span className="block w-full h-full rounded-[50%_50%_50%_50%/70%_70%_30%_30%] bg-gradient-to-br from-rose-300 to-pink-400/60 rotate-15 shadow-xs" />
        </div>

        {/* 4. BOTTOM-LEFT: Botanical Jasmine Arch with Lotus Petals & Greenery */}
        <div className="absolute bottom-2 left-2 sm:bottom-0 sm:left-0 w-28 sm:w-36 md:w-48 lg:w-56 xl:w-64 max-w-[250px] aspect-[917/954] transform origin-bottom-left transition-all duration-500">
          <img
            src="/images/floral-decorations/jasmine-foliage-corner.webp"
            alt=""
            className="w-full h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] opacity-80 sm:opacity-85"
            loading="lazy"
          />
        </div>

        {/* 5. BOTTOM-RIGHT: Jasmine Blossoms & Floating Pink Lotus Petals */}
        <div className="absolute bottom-2 right-2 sm:bottom-0 sm:right-0 w-24 sm:w-32 md:w-44 lg:w-52 xl:w-60 max-w-[240px] aspect-[904/913] transform origin-bottom-right transition-all duration-500">
          <img
            src="/images/floral-decorations/lotus-petal-accent.webp"
            alt=""
            className="w-full h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] opacity-85 sm:opacity-90"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
