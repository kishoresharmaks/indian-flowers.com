'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HeroSlide {
  _id?: string;
  id?: number | string;
  eyebrow?: string;
  title?: string;
  description?: string;
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

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    image: '/images/banners/b1.jpg',
    mobileImage: '/images/banners/b1.jpg',
    title: 'Indian Wedding Garlands & Fresh Pooja Flowers',
    link: '#products-section',
  },
];

export default function HeroSection({
  slides = [],
  loading = false,
  onShopClick,
}: HeroSectionProps) {
  // Use slides from props if available and non-empty, otherwise fallback to defaults
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Mobile touch swipe gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const prevSlide = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  }, [activeSlides.length]);

  const nextSlide = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentSlide((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1));
  }, [activeSlides.length]);

  // Auto-advance every 6 seconds (pauses on desktop hover)
  useEffect(() => {
    if (activeSlides.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length, isHovered]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  const handleSlideClick = (slide: HeroSlide) => {
    if (slide.link && slide.link.startsWith('#')) {
      const el = document.querySelector(slide.link);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    } else if (slide.link) {
      window.location.href = slide.link;
      return;
    }
    onShopClick();
  };

  // Sized placeholder during initial loading with matching rounded border corners
  if (loading && (!slides || slides.length === 0)) {
    return (
      <section className="w-full bg-[#FAF6F0] py-1.5 sm:py-2 md:py-3">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full aspect-[16/9] sm:aspect-[2.4/1] md:aspect-[2.9/1] lg:aspect-[3.4/1] xl:aspect-[3.6/1] max-h-[340px] sm:max-h-[360px] lg:max-h-[380px] xl:max-h-[400px] rounded-2xl sm:rounded-3xl lg:rounded-[26px] bg-stone-200/60 animate-pulse border border-stone-200/80" />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#FAF6F0] py-1.5 sm:py-2 md:py-3">
      {/* Contained within responsive site max-width exactly matching reference mockup */}
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Frame with High-End Rounded Corners & Border */}
        <div
          className="relative w-full rounded-2xl sm:rounded-3xl lg:rounded-[26px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-stone-200/80 bg-stone-100 select-none group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Horizontal Slider Track */}
          <div
            className="flex w-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {activeSlides.map((slide, idx) => {
              const desktopImageUrl = slide.image || slide.bgImage || '/images/banners/b1.jpg';
              const mobileImageUrl = slide.mobileImage || desktopImageUrl;

              return (
                <div
                  key={slide._id || slide.id || idx}
                  className="w-full shrink-0 relative cursor-pointer aspect-[16/9] sm:aspect-[2.4/1] md:aspect-[2.9/1] lg:aspect-[3.4/1] xl:aspect-[3.6/1] max-h-[340px] sm:max-h-[360px] lg:max-h-[380px] xl:max-h-[400px]"
                  onClick={() => handleSlideClick(slide)}
                >
                  <picture className="w-full h-full block">
                    {mobileImageUrl && (
                      <source media="(max-width: 639px)" srcSet={mobileImageUrl} />
                    )}
                    <img
                      src={desktopImageUrl}
                      alt={slide.title || `Indian Flowers Banner ${idx + 1}`}
                      className="w-full h-full object-cover object-center select-none pointer-events-none"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </picture>
                </div>
              );
            })}
          </div>

          {/* Left Circular Navigation Arrow matching reference mockup */}
          {activeSlides.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:shadow-lg flex items-center justify-center text-stone-800 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer border border-stone-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800 stroke-[2.2]" />
            </button>
          )}

          {/* Right Circular Navigation Arrow matching reference mockup */}
          {activeSlides.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:shadow-lg flex items-center justify-center text-stone-800 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer border border-stone-100"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800 stroke-[2.2]" />
            </button>
          )}

          {/* Floating White Pill Indicator with Elongated Active Bar matching reference mockup */}
          {activeSlides.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-stone-100">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(idx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentSlide === idx
                      ? 'w-6 h-2 bg-[#0B3B24]'
                      : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
