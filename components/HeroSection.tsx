'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Truck, Leaf, ShieldCheck, ArrowRight } from 'lucide-react';

export interface HeroSlide {
  _id?: string;
  id?: number | string;
  eyebrow?: string;
  title: string;
  description: string;
  ctaText?: string;
  image?: string;
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

export default function HeroSection({
  slides = [],
  loading = false,
  onShopClick,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeSlides = slides && slides.length > 0 ? slides : [];

  const prevSlide = () => {
    if (activeSlides.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    if (activeSlides.length === 0) return;
    setCurrentSlide((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1));
  };

  // Auto advance every 6 seconds
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  if (loading || activeSlides.length === 0) {
    return (
      <section className="relative w-full overflow-hidden bg-[#FAF6F0] min-h-[380px] sm:min-h-[520px] lg:min-h-[600px] flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full animate-pulse">
          <div className="max-w-xl space-y-4">
            <div className="h-4 w-48 bg-amber-200/50 rounded-md" />
            <div className="h-12 w-96 bg-gray-200 rounded-lg" />
            <div className="h-6 w-full max-w-md bg-gray-200 rounded-md" />
            <div className="h-10 w-44 bg-[#0B3B24]/30 rounded-full mt-4" />
          </div>
        </div>
      </section>
    );
  }

  const slide = activeSlides[currentSlide] || activeSlides[0];
  const slideImageUrl = slide.image || slide.bgImage || '';

  return (
    <section className="relative w-full overflow-hidden bg-[#FAF6F0]">
      {/* Slider Container */}
      <div className="relative min-h-[420px] sm:min-h-[520px] lg:min-h-[600px] flex items-center">
        {/* Background Image with Warm Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          {slideImageUrl && (
            <img
              src={slideImageUrl}
              alt={slide.title}
              className="w-full h-full object-cover object-center transition-all duration-700 ease-in-out scale-100"
            />
          )}
          {/* Subtle Warm Overlay so typography remains crisp and high-contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F0]/95 via-[#FAF6F0]/82 to-[#FAF6F0]/50 sm:hidden" />
          <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-[#FAF6F0]/95 via-[#FAF6F0]/85 to-transparent sm:w-3/4 lg:w-3/5" />
          <div className="absolute inset-0 bg-[#0B3B24]/10 mix-blend-multiply" />
        </div>

        {/* Prev / Next Slider Navigation Buttons */}
        {activeSlides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="hidden sm:flex absolute left-3 sm:left-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg items-center justify-center transition-all hover:scale-105"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={nextSlide}
              className="hidden sm:flex absolute right-3 sm:right-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg items-center justify-center transition-all hover:scale-105"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Main Content inside Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 w-full pb-16 sm:pb-24">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left Copy */}
            <div className="max-w-xl space-y-4 sm:space-y-5">
              {/* Eyebrow */}
              {slide.eyebrow && (
                <div className="inline-block">
                  <span className="text-[11px] sm:text-xs font-semibold tracking-[0.12em] uppercase text-amber-800 block">
                    {slide.eyebrow}
                  </span>
                </div>
              )}

              {/* Headline */}
              <h1 className="text-[32px] sm:text-[42px] lg:text-[50px] font-bold text-gray-900 leading-[1.15] tracking-[-0.035em]">
                {slide.title}
              </h1>

              {/* Subheading / Description */}
              <p className="text-sm sm:text-base text-gray-600 leading-[1.7] max-w-lg font-normal">
                {slide.description}
              </p>

              {/* Primary Action Button */}
              <div className="pt-2 sm:pt-4">
                <button
                  onClick={onShopClick}
                  className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white font-semibold text-sm sm:text-[15px] tracking-[0.02em] shadow-sm hover:shadow transition-all hover:translate-x-0.5 active:scale-95"
                >
                  <span>{slide.ctaText || 'Shop Fresh Flowers'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Side: Circular Decorative Badge from Screenshot */}
            <div className="hidden lg:flex items-center justify-center relative pr-8">
              <div className="w-44 h-44 rounded-full bg-[#0B3B24] text-white p-6 shadow-xl flex items-center justify-center text-center border-4 border-white/90 transform hover:rotate-6 transition-transform">
                <div className="space-y-1">
                  <span className="text-sm font-bold leading-snug block tracking-tight">
                    Fresh Flowers
                  </span>
                  <span className="text-xs text-emerald-200 block font-normal">
                    for Weddings, Festivals &amp;
                  </span>
                  <span className="text-xs font-semibold block text-amber-200">
                    Every Occasion
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators (Dots) */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-6 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 transition-all rounded-full ${
                  currentSlide === idx ? 'w-8 bg-[#0B3B24]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Trust Feature Bar (Positioned at bottom of hero) */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 mt-0 sm:-mt-12 pb-4 sm:pb-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_12px_32px_rgba(23,56,43,0.08)] py-3.5 sm:py-5 px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {/* Feature 1 */}
          <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center shrink-0 border border-emerald-100">
              <Truck className="w-5 h-5 text-[#0B3B24]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                Fresh &amp; On-Time Delivery
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5 font-normal">Across USA</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:pl-6">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
              <Leaf className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                Premium Quality
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5 font-normal">Direct from trusted sources</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:pl-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                Secure Payments
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5 font-normal">Shop with confidence</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
