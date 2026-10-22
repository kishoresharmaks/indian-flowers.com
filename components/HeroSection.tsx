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
    image: '/images/banners/hero-wedding-1920x650.jpg',
    mobileImage: '/images/banners/hero-wedding-750x850.jpg',
    title: 'Indian Wedding Garlands',
    link: '#products-section',
  },
  {
    image: '/images/banners/hero-tradition-1920x650.jpg',
    mobileImage: '/images/banners/hero-tradition-750x850.jpg',
    title: 'Authentic Indian Blooms',
    link: '#products-section',
  },
  {
    image: '/images/banners/hero-pooja-1920x650.jpg',
    mobileImage: '/images/banners/hero-pooja-750x850.jpg',
    title: 'Fresh Pooja Flowers',
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
      <section className="w-full bg-[#FAF6F0] py-2 sm:py-3 md:py-4">
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full aspect-[16/9] rounded-2xl sm:rounded-3xl bg-stone-200/60 animate-pulse border border-stone-200/80" />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#FAF6F0] py-2 sm:py-3 md:py-4">
      {/* Contained within responsive site max-width (Proper size, not oversized) */}
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Frame with Proper Rounded Corners & Border */}
        <div
          className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-stone-200/80 bg-stone-100 select-none group"
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
              const desktopImageUrl = slide.image || slide.bgImage || '';
              const mobileImageUrl = slide.mobileImage || desktopImageUrl;

              return (
                <div
                  key={slide._id || slide.id || idx}
                  className="w-full shrink-0 relative cursor-pointer aspect-[16/9]"
                  onClick={() => handleSlideClick(slide)}
                >
                  <picture className="w-full h-full block">
                    {mobileImageUrl && (
                      <source media="(max-width: 639px)" srcSet={mobileImageUrl} />
                    )}
                    <img
                      src={desktopImageUrl}
                      alt={slide.title || `Indian Flowers Banner ${idx + 1}`}
                      className="w-full h-full object-cover object-top select-none pointer-events-none"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </picture>
                </div>
              );
            })}
          </div>

          {/* Subtle Desktop Prev Chevron (Appears on desktop hover only, 0 buttons on mobile) */}
          {activeSlides.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="hidden md:flex absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 border border-white/80 backdrop-blur-xs"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
          )}

          {/* Subtle Desktop Next Chevron (Appears on desktop hover only, 0 buttons on mobile) */}
          {activeSlides.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="hidden md:flex absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 border border-white/80 backdrop-blur-xs"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
          )}

          {/* Discreet Slide Indicator Dots */}
          {activeSlides.length > 1 && (
            <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-xs">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(idx);
                  }}
                  className={`h-1.5 sm:h-2 transition-all duration-300 rounded-full ${
                    currentSlide === idx
                      ? 'w-5 sm:w-6 bg-white shadow-xs'
                      : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
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
