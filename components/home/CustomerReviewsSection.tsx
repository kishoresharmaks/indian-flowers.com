'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Quote,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Heart,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { ReviewItem, DEFAULT_CUSTOMER_REVIEWS } from '@/lib/defaultReviews';

export default function CustomerReviewsSection() {
  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_CUSTOMER_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      try {
        const res = await fetch('/api/reviews', { cache: 'no-store' });
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setReviews(data.data);
        }
      } catch (err) {
        console.warn('Could not load reviews from API, using default fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalReviews = reviews.length;
  const averageRating = (
    reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / (totalReviews || 1)
  ).toFixed(1);

  const scrollPrev = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const scrollNext = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    setActiveIndex((prev) => Math.min(totalReviews - 1, prev + 1));
  };

  return (
    <section
      id="reviews-section"
      className="py-14 sm:py-20 bg-[#FAF6F0] relative overflow-hidden border-t border-[#E5E7EB]"
      aria-label="Customer Reviews and Testimonials"
    >
      {/* Subtle botanical background patterns */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#C85A78] text-[11px] sm:text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Devotion &amp; Trust Across America</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3B24] tracking-tight font-jakarta leading-tight">
              Loved by 10,000+ Indian Families Across the USA
            </h2>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-xl font-normal">
              From grand Indian wedding ceremonies to sacred home pujas and Diwali celebrations, see why devotees and families trust our cold-chain floral delivery.
            </p>
          </div>

          {/* Social Proof Summary & Navigation Arrows */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Overall Rating Pill */}
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-emerald-900/10 shadow-xs flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <div className="text-left border-l border-gray-200 pl-3">
                <span className="text-xs font-bold text-[#0B3B24] block">
                  {averageRating} / 5.0 Rating
                </span>
                <span className="text-[10px] text-gray-500 font-medium block">
                  1,200+ Verified Buyers
                </span>
              </div>
            </div>

            {/* Slider Navigation Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={scrollPrev}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-emerald-50 text-[#0B3B24] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                aria-label="Previous Reviews"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-emerald-50 text-[#0B3B24] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                aria-label="Next Reviews"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Cards Scrollable Row / Grid */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reviews.map((rev, index) => {
            const initials = rev.customerName
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={rev._id || index}
                className="w-[300px] sm:w-[350px] lg:w-[380px] shrink-0 snap-start bg-white rounded-3xl p-6 sm:p-7 border border-emerald-900/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                {/* Decorative Quote Watermark */}
                <Quote className="w-10 h-10 text-emerald-900/5 absolute top-5 right-5 pointer-events-none" />

                <div className="space-y-4">
                  {/* Rating Stars & Verified Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            star <= (rev.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0B3B24] text-[10.5px] font-bold border border-emerald-200/80">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified Buyer</span>
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-[13.5px] text-[#334155] leading-relaxed font-normal">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Footer: Customer Profile & Product Tag */}
                <div className="pt-5 mt-5 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B3B24] to-[#1C563F] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 tracking-wider">
                      {initials || 'IF'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-[#0B3B24] truncate font-jakarta">
                        {rev.customerName}
                      </h3>
                      <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-[#C85A78] shrink-0" />
                        <span>{rev.location || 'USA'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Product Tag */}
                  {rev.productName && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F4F8F4] text-[#134633] text-[10.5px] font-semibold border border-emerald-900/10 truncate max-w-full">
                      <Flower2 className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{rev.productName}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Notice */}
        <div className="flex sm:hidden items-center justify-center gap-1 text-[11px] text-gray-500 pt-3">
          <span>&larr; Swipe to view more verified customer reviews &rarr;</span>
        </div>
      </div>
    </section>
  );
}
