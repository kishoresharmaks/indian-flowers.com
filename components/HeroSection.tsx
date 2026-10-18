'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Leaf, Truck, ShieldCheck } from 'lucide-react';

export interface HeroSlide {
  _id?: string;
  id?: number | string;
  eyebrow?: string;
  title: string;
  description: string;
  ctaText?: string;
  image?: string;
  mobileImage?: string;
  bgImage?: string;
  badgeText?: string;
  link?: string;
}

interface HeroSectionProps {
  slides?: HeroSlide[];
  loading?: boolean;
  onShopClick: () => void;
  onExploreGarlandsClick?: () => void;
}

/**
 * Dynamically highlights key title phrases in the signature rose accent color (#C85A78)
 */
function renderHeadline(title: string) {
  if (!title) return null;

  if (title.includes('Every Bloom')) {
    const parts = title.split('Every Bloom');
    return (
      <>
        <span>{parts[0]}</span>
        <span className="text-[#C85A78]">Every Bloom{parts[1] || ''}</span>
      </>
    );
  }

  if (title.includes('Vibrant Blooms')) {
    const parts = title.split('Vibrant Blooms');
    return (
      <>
        <span>{parts[0]}</span>
        <span className="text-[#C85A78]">Vibrant Blooms{parts[1] || ''}</span>
      </>
    );
  }

  if (title.includes('Daily Pooja')) {
    const parts = title.split('Daily Pooja');
    return (
      <>
        <span>{parts[0]}</span>
        <span className="text-[#C85A78]">Daily Pooja{parts[1] || ''}</span>
      </>
    );
  }

  if (title.includes(',')) {
    const [first, ...rest] = title.split(',');
    return (
      <>
        <span>{first}, </span>
        <span className="text-[#C85A78]">{rest.join(',').trim()}</span>
      </>
    );
  }

  const words = title.trim().split(' ');
  if (words.length >= 3) {
    const firstPart = words.slice(0, -2).join(' ');
    const lastPart = words.slice(-2).join(' ');
    return (
      <>
        <span>{firstPart} </span>
        <span className="text-[#C85A78]">{lastPart}</span>
      </>
    );
  }

  return <span>{title}</span>;
}

export default function HeroSection({
  slides = [],
  loading = false,
  onShopClick,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Auto advance every 7 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading && (!slides || slides.length === 0)) {
    return (
      <section className="relative w-full overflow-hidden bg-[#FAF6F0] min-h-[460px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] xl:min-h-[600px] 2xl:min-h-[640px] 3xl:min-h-[680px] flex items-center">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 animate-pulse">
          <div className="max-w-xl bg-white/80 p-6 rounded-3xl space-y-3">
            <div className="h-4 w-40 bg-rose-100 rounded-full" />
            <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-10 w-36 bg-emerald-100 rounded-full mt-3" />
          </div>
        </div>
      </section>
    );
  }

  const slide = slides[currentSlide] || slides[0];
  const desktopImageUrl = slide?.image || slide?.bgImage || '';

  return (
    <section className="relative w-full overflow-hidden bg-[#FAF6F0] select-none">
      {/* Slider Container: Proportioned for all screen widths from mobile to 4K ultrawide */}
      <div className="relative min-h-[460px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] xl:min-h-[600px] 2xl:min-h-[640px] 3xl:min-h-[680px] flex flex-col justify-end md:justify-center">
        {/* Responsive Background Image: <picture> Tag */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {desktopImageUrl && (
            <picture className="w-full h-full block">
              {slide?.mobileImage && (
                <source media="(max-width: 767px)" srcSet={slide.mobileImage} />
              )}
              <img
                src={desktopImageUrl}
                alt={slide?.title || 'Indian Flowers'}
                className="w-full h-full object-cover object-top md:object-[right_center] xl:object-[75%_center] transition-all duration-700 ease-in-out"
                loading="eager"
              />
            </picture>
          )}

          {/* Desktop left ambient gradient: localized behind text card to preserve vivid full-bleed background flowers */}
          <div className="absolute inset-y-0 left-0 hidden md:block w-full max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl bg-gradient-to-r from-[#FAF6F0]/95 via-[#FAF6F0]/65 to-transparent pointer-events-none z-[1]" />
          
          {/* Desktop bottom smooth fade - melts the photo progressively into the ivory canvas */}
          <div className="absolute inset-x-0 -bottom-1 h-24 sm:h-32 md:h-36 lg:h-40 hidden md:block bg-gradient-to-t from-[#FAF6F0] from-15% via-[#FAF6F0]/80 via-45% to-transparent pointer-events-none z-[2]" />

          {/* Mobile seamless bottom ivory melt: starts softly in lower half and dissolves 100% into #FAF6F0 at the bottom */}
          <div className="absolute inset-x-0 -bottom-1 h-80 sm:h-96 md:hidden bg-gradient-to-t from-[#FAF6F0] from-30% via-[#FAF6F0]/95 via-65% to-transparent pointer-events-none z-[2]" />
        </div>

        {/* Responsive Inner Container: Houses both the hero text card and aligned navigation buttons */}
        <div className="relative z-10 w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 pt-2 pb-6 sm:py-8 lg:py-10">
          {/* Floating Circular Prev / Next Slider Navigation Buttons (aligned with responsive inner container) */}
          {slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="hidden md:flex absolute -left-2 lg:-left-3 xl:-left-4 2xl:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-white/95 hover:bg-white text-gray-800 shadow-[0_4px_16px_rgba(0,0,0,0.12)] items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/90 backdrop-blur-sm"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>

              <button
                onClick={nextSlide}
                className="hidden md:flex absolute -right-2 lg:-right-3 xl:-right-4 2xl:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-white/95 hover:bg-white text-gray-800 shadow-[0_4px_16px_rgba(0,0,0,0.12)] items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/90 backdrop-blur-sm"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </>
          )}

          {/* Main Content:
              - Mobile: NO card layout! Unboxed, fluid, sits directly on smooth background
              - Desktop: Luxury frosted glass card floating on the left */}
          {slide && (
            <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-[620px] 2xl:max-w-[660px] bg-transparent p-0 border-0 shadow-none space-y-2 md:bg-white/70 md:backdrop-blur-md md:p-6 lg:p-7 xl:p-8 md:rounded-3xl md:border md:border-white/80 md:shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:space-y-3">
              {/* Eyebrow Pill Badge */}
              {slide.eyebrow && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50/95 sm:bg-white/90 backdrop-blur-md border border-[#F3D5DF] shadow-[0_2px_8px_rgba(200,90,120,0.06)] self-start">
                  <span className="text-[9.5px] sm:text-[10.5px] font-bold tracking-[0.14em] uppercase text-[#C85A78]">
                    {slide.eyebrow}
                  </span>
                </div>
              )}

              {/* Headline */}
              <h1 className="text-[21px] sm:text-2xl md:text-3xl lg:text-[34px] font-extrabold text-[#111827] leading-[1.2] tracking-tight sm:tracking-[-0.03em]">
                {renderHeadline(slide.title)}
              </h1>

              {/* Description */}
              <p className="text-[12.5px] sm:text-[13px] md:text-sm text-gray-700 font-normal leading-[1.6] line-clamp-2 sm:line-clamp-none max-w-lg">
                {slide.description}
              </p>

              {/* Action + Trust Container */}
              <div className="pt-1 sm:pt-2.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-5">
                {/* CTA Action Button */}
                <button
                  onClick={onShopClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white font-semibold text-xs sm:text-[13px] tracking-[0.02em] shadow-[0_4px_16px_rgba(11,59,36,0.22)] hover:shadow-[0_6px_22px_rgba(11,59,36,0.32)] transition-all hover:translate-x-0.5 active:scale-95 shrink-0"
                >
                  <span>{slide.ctaText || 'Shop Fresh Flowers'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Desktop Trust Row (md and above): 2-line stacked design */}
                <div className="hidden md:flex flex-wrap items-center gap-3 sm:gap-4 py-0.5">
                  {/* Badge 1: Farm Fresh Quality */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100/90 text-[#0B3B24]">
                      <Leaf className="w-3 h-3 text-[#0B3B24]" />
                    </span>
                    <div className="flex flex-col text-left leading-[1.15]">
                      <span className="text-xs font-semibold text-gray-900">Farm Fresh</span>
                      <span className="text-[10px] text-gray-500 font-medium">Quality</span>
                    </div>
                  </div>

                  <div className="w-px h-4 bg-gray-300/70" />

                  {/* Badge 2: Fast & Safe Delivery */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100/90 text-[#0B3B24]">
                      <Truck className="w-3 h-3 text-[#0B3B24]" />
                    </span>
                    <div className="flex flex-col text-left leading-[1.15]">
                      <span className="text-xs font-semibold text-gray-900">Fast & Safe</span>
                      <span className="text-[10px] text-gray-500 font-medium">Delivery</span>
                    </div>
                  </div>

                  <div className="w-px h-4 bg-gray-300/70" />

                  {/* Badge 3: Trusted by 10,000+ Customers */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100/90 text-[#0B3B24]">
                      <ShieldCheck className="w-3 h-3 text-[#0B3B24]" />
                    </span>
                    <div className="flex flex-col text-left leading-[1.15]">
                      <span className="text-xs font-semibold text-gray-900">Trusted by</span>
                      <span className="text-[10px] text-gray-500 font-medium">10,000+ Customers</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Micro-Trust Inline Row (< md): NO boxes, seamless inline chips */}
                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-semibold text-gray-700 md:hidden w-full max-w-sm">
                  <div className="flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5 text-[#0B3B24] shrink-0" />
                    <span>Farm Fresh</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#0B3B24] shrink-0" />
                    <span>Fast Delivery</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B3B24] shrink-0" />
                    <span>10k+ Happy</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slide Indicator Dots (Centered with safe clearance) */}
        {slides.length > 1 && (
          <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 transition-all duration-300 rounded-full ${
                  currentSlide === idx
                    ? 'w-7 sm:w-8 bg-[#0B3B24]'
                    : 'w-2 bg-[#0B3B24]/30 hover:bg-[#0B3B24]/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
