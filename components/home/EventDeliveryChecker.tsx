'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { getMinDeliveryDateString, formatReadableDate, MIN_DELIVERY_LEAD_DAYS } from '@/lib/dateUtils';

interface EventDeliveryCheckerProps {
  onCheckSuccess?: (date: string, zip: string) => void;
}

export default function EventDeliveryChecker({ onCheckSuccess }: EventDeliveryCheckerProps) {
  const [eventDate, setEventDate] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'invalid'>('idle');

  // Earliest allowable delivery date (mandatory 10-day advance cold-chain notice)
  const minDeliveryDate = getMinDeliveryDateString(MIN_DELIVERY_LEAD_DAYS);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipCode.trim();

    if (!cleanZip || cleanZip.length < 5 || !/^\d{5}$/.test(cleanZip) || (eventDate && eventDate < minDeliveryDate)) {
      setStatus('invalid');
      return;
    }

    setStatus('checking');
    setTimeout(() => {
      setStatus('available');
      if (onCheckSuccess) {
        onCheckSuccess(eventDate, cleanZip);
      }
    }, 350);
  };

  const handleBrowseCatalog = () => {
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="w-full bg-[#FAF6F0] pt-2 pb-4 sm:pt-3 sm:pb-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto">
        {/* Hallmark Delivery Card - Balanced, Responsive, and Never Clipped */}
        <div className="w-full rounded-2xl sm:rounded-3xl bg-white border border-stone-200/90 shadow-xs hover:shadow-md transition-shadow p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
            {/* Left Info: Icon + Clear Non-Truncated Typography */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-[#0B3B24] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                <ShieldCheck className="w-5 h-5 text-[#0B3B24]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-[#0B3B24] tracking-[-0.015em]">
                    Check Delivery for Your Event Date
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-900 text-[10px] font-bold tracking-wider uppercase border border-emerald-200/50">
                    🌿 USA Cold-Chain
                  </span>
                </div>
                <p className="text-[12px] sm:text-[13px] text-stone-500 font-normal leading-relaxed mt-0.5">
                  Guaranteed arrival before 10:30 AM for your Muhurtham or morning puja
                </p>
              </div>
            </div>

            {/* Right Form: Touch-Friendly on Mobile, Sleek Horizontal Bar on Desktop */}
            <form
              onSubmit={handleCheck}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0"
            >
              {/* Event Date Input */}
              <div className="relative flex items-center bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/90 focus-within:border-[#0B3B24] focus-within:ring-2 focus-within:ring-[#0B3B24]/15 px-3 py-2 sm:py-2.5 sm:w-52 transition-all h-11 sm:h-12">
                <Calendar className="w-4 h-4 text-[#0B3B24] shrink-0 mr-2.5" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-0.5 truncate">
                    Event Date (Min 10 Days)
                  </span>
                  <input
                    type="date"
                    min={minDeliveryDate}
                    value={eventDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && val < minDeliveryDate) {
                        setEventDate('');
                        setStatus('invalid');
                        return;
                      }
                      setEventDate(val);
                      if (status !== 'idle') setStatus('idle');
                    }}
                    className="w-full text-xs sm:text-sm font-semibold text-stone-900 bg-transparent outline-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* US ZIP Input */}
              <div className="relative flex items-center bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/90 focus-within:border-[#0B3B24] focus-within:ring-2 focus-within:ring-[#0B3B24]/15 px-3 py-2 sm:py-2.5 sm:w-36 transition-all h-11 sm:h-12">
                <MapPin className="w-4 h-4 text-[#0B3B24] shrink-0 mr-2" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-0.5">
                    US ZIP Code
                  </span>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="e.g. 94538"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value.replace(/\D/g, ''));
                      if (status !== 'idle') setStatus('idle');
                    }}
                    className="w-full text-xs sm:text-sm font-semibold text-stone-900 bg-transparent outline-none placeholder:text-stone-400 p-0"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={status === 'checking'}
                className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] active:bg-[#072718] text-white font-bold text-xs sm:text-[13px] tracking-wide shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-75"
              >
                <span>{status === 'checking' ? 'Checking...' : 'Check Delivery'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Dynamic Result State */}
          {status === 'available' && (
            <div className="mt-3.5 pt-3.5 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs sm:text-[13px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  ✓ Guaranteed cold-chain overnight delivery available to ZIP {zipCode} via FedEx Priority &amp; Southwest Cargo!
                </span>
              </div>
              <button
                type="button"
                onClick={handleBrowseCatalog}
                className="inline-flex items-center gap-1.5 text-[#0B3B24] font-bold hover:underline cursor-pointer self-start sm:self-auto text-xs sm:text-[13px]"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {status === 'invalid' && (
            <div className="mt-3 pt-3 border-t border-rose-100 text-xs text-rose-600 font-medium">
              Please enter a valid 5-digit US ZIP code and select an event date on or after {formatReadableDate(minDeliveryDate)} (minimum 10-day advance notice for fresh flowers).
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
