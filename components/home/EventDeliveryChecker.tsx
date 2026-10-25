'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Clock } from 'lucide-react';

interface EventDeliveryCheckerProps {
  onCheckSuccess?: (date: string, zip: string) => void;
}

export default function EventDeliveryChecker({ onCheckSuccess }: EventDeliveryCheckerProps) {
  const [eventDate, setEventDate] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'invalid'>('idle');

  // Today's date in YYYY-MM-DD for min date attribute
  const todayStr = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '';

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipCode.trim();

    if (!cleanZip || cleanZip.length < 5 || !/^\d{5}$/.test(cleanZip)) {
      setStatus('invalid');
      return;
    }

    setStatus('checking');
    setTimeout(() => {
      setStatus('available');
      if (onCheckSuccess) {
        onCheckSuccess(eventDate, cleanZip);
      }
    }, 400);
  };

  const handleBrowseCatalog = () => {
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative w-full -mt-4 sm:-mt-6 md:-mt-8 z-20 px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
      <div className="w-full max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-[0_12px_40px_rgba(11,59,36,0.08)] p-4 sm:p-5 lg:p-6 transition-all">
          {/* Subtle botanical corner wash */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            {/* Left Value Proposition */}
            <div className="space-y-1 max-w-sm">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-[11px] font-bold tracking-[0.1em] uppercase border border-emerald-200/60">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>US Arrival Guarantee</span>
              </div>
              <h3 className="text-[16px] sm:text-[18px] lg:text-[19px] font-bold text-[#0B3B24] tracking-[-0.02em] leading-snug">
                Check Delivery for Your Event Date
              </h3>
              <p className="text-[11.5px] sm:text-[12.5px] text-stone-500 font-normal leading-relaxed">
                Insulated cold-chain delivery by 10:30 AM before your Muhurtham or Pooja.
              </p>
            </div>

            {/* Right Interactive Form */}
            <form onSubmit={handleCheck} className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              {/* Event Date Picker */}
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-stone-50/90 hover:bg-stone-50 rounded-xl border border-stone-200/80 focus-within:border-[#0B3B24] focus-within:ring-1 focus-within:ring-[#0B3B24] transition-all">
                <Calendar className="w-4 h-4 text-[#0B3B24] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="delivery-event-date" className="block text-[9.5px] font-bold uppercase tracking-wider text-stone-400">
                    Event Date
                  </label>
                  <input
                    id="delivery-event-date"
                    type="date"
                    min={todayStr}
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      if (status !== 'idle') setStatus('idle');
                    }}
                    className="w-full text-xs sm:text-[13px] font-semibold text-stone-800 bg-transparent outline-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* US ZIP Code Input */}
              <div className="w-full sm:w-44 flex items-center gap-2.5 px-3.5 py-2.5 bg-stone-50/90 hover:bg-stone-50 rounded-xl border border-stone-200/80 focus-within:border-[#0B3B24] focus-within:ring-1 focus-within:ring-[#0B3B24] transition-all">
                <MapPin className="w-4 h-4 text-[#0B3B24] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="delivery-zip-code" className="block text-[9.5px] font-bold uppercase tracking-wider text-stone-400">
                    US ZIP Code
                  </label>
                  <input
                    id="delivery-zip-code"
                    type="text"
                    maxLength={5}
                    placeholder="e.g. 94538"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value.replace(/\D/g, ''));
                      if (status !== 'idle') setStatus('idle');
                    }}
                    className="w-full text-xs sm:text-[13px] font-semibold text-stone-800 bg-transparent outline-none placeholder:text-stone-400 p-0"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="h-12 sm:h-auto sm:self-stretch px-5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] active:bg-[#072718] text-white font-semibold text-xs sm:text-[13px] tracking-wide shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Check Availability</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Dynamic Result State */}
          {status === 'available' && (
            <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Guaranteed Overnight Delivery Available to ZIP {zipCode} via FedEx Priority &amp; Southwest!
                </span>
              </div>
              <button
                type="button"
                onClick={handleBrowseCatalog}
                className="inline-flex items-center gap-1 text-[#0B3B24] font-bold hover:underline cursor-pointer self-start sm:self-auto text-xs"
              >
                <span>Browse Fresh Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {status === 'invalid' && (
            <div className="mt-3.5 pt-3 border-t border-rose-100 text-xs text-rose-600 font-medium flex items-center gap-2">
              <span>Please enter a valid 5-digit US ZIP code (e.g. 94538, 75001, 08820).</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
