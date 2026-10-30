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
    <section className="w-full bg-[#FAF6F0] pt-1 pb-3 sm:pt-2 sm:pb-4 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1480px] mx-auto">
        {/* Hallmark Delivery Card - Balanced, Responsive, and Never Clipped */}
        <div className="w-full rounded-2xl sm:rounded-3xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow p-3 sm:p-3.5 lg:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">
            {/* Left Info: Icon + Clear Non-Truncated Typography */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200/70 text-[#0B3B24] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                <ShieldCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#0B3B24]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs sm:text-[14.5px] font-bold text-[#0B3B24] tracking-[-0.015em]">
                    Check Delivery for Your Event Date
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-900 text-[9.5px] sm:text-[10px] font-bold tracking-wider uppercase border border-emerald-200/50">
                    🌿 USA Cold-Chain
                  </span>
                </div>
                <p className="text-[11.5px] sm:text-[12.5px] text-stone-500 font-normal leading-relaxed mt-0.5">
                  Guaranteed arrival before 10:30 AM for your Muhurtham or morning puja
                </p>
              </div>
            </div>

            {/* Right Form: Touch-Friendly on Mobile, Sleek Horizontal Bar on Desktop */}
            <form
              onSubmit={handleCheck}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0"
            >
              {/* Event Date Input */}
              <div className="relative flex items-center bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/90 focus-within:border-[#0B3B24] focus-within:ring-2 focus-within:ring-[#0B3B24]/15 px-3 py-1.5 sm:py-2 sm:w-48 transition-all h-10 sm:h-11">
                <Calendar className="w-4 h-4 text-[#0B3B24] shrink-0 mr-2" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-0.5 truncate">
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
                    className="w-full text-xs sm:text-[13px] font-semibold text-stone-900 bg-transparent outline-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* US ZIP Input */}
              <div className="relative flex items-center bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/90 focus-within:border-[#0B3B24] focus-within:ring-2 focus-within:ring-[#0B3B24]/15 px-3 py-1.5 sm:py-2 sm:w-36 transition-all h-10 sm:h-11">
                <MapPin className="w-4 h-4 text-[#0B3B24] shrink-0 mr-2" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-0.5">
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
                    className="w-full text-xs sm:text-[13px] font-semibold text-stone-900 bg-transparent outline-none placeholder:text-stone-400 p-0"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={status === 'checking'}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] active:bg-[#072718] text-white font-bold text-xs sm:text-[12.5px] tracking-wide shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75"
              >
                <span>{status === 'checking' ? 'Checking...' : 'Check Delivery'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
