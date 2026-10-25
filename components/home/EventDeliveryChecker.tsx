'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

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
    }, 350);
  };

  const handleBrowseCatalog = () => {
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="w-full bg-[#FAF6F0] pt-1 pb-4 sm:pt-2 sm:pb-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto">
        {/* Seamless Utility Bar - Blends with site canvas, NO overlap, NO cut rectangle */}
        <div className="w-full rounded-2xl bg-white/80 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-shadow p-3 sm:p-3.5 lg:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">
            {/* Left Info: Compact & Clear */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-[14px] font-bold text-[#0B3B24] tracking-[-0.01em] truncate">
                    Check Delivery for Your Event Date
                  </h3>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-900 text-[10px] font-bold tracking-wide uppercase">
                    USA Cold-Chain
                  </span>
                </div>
                <p className="text-[11px] sm:text-[12px] text-stone-500 font-normal truncate">
                  Guaranteed arrival before 10:30 AM for your Muhurtham or morning puja
                </p>
              </div>
            </div>

            {/* Right Form: Highly Responsive across Mobile & Desktop */}
            <form
              onSubmit={handleCheck}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0"
            >
              {/* Mobile 2-column input row, desktop inline */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5">
                {/* Event Date Input */}
                <div className="relative flex items-center bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/90 focus-within:border-[#0B3B24] focus-within:ring-1 focus-within:ring-[#0B3B24] px-2.5 py-2 transition-all">
                  <Calendar className="w-3.5 h-3.5 text-[#0B3B24] shrink-0 mr-2" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-0.5">
                      Event Date
                    </span>
                    <input
                      type="date"
                      min={todayStr}
                      value={eventDate}
                      onChange={(e) => {
                        setEventDate(e.target.value);
                        if (status !== 'idle') setStatus('idle');
                      }}
                      className="w-full text-xs font-semibold text-stone-900 bg-transparent outline-none cursor-pointer p-0"
                    />
                  </div>
                </div>

                {/* US ZIP Input */}
                <div className="relative flex items-center bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/90 focus-within:border-[#0B3B24] focus-within:ring-1 focus-within:ring-[#0B3B24] px-2.5 py-2 transition-all sm:w-36">
                  <MapPin className="w-3.5 h-3.5 text-[#0B3B24] shrink-0 mr-1.5" />
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
                      className="w-full text-xs font-semibold text-stone-900 bg-transparent outline-none placeholder:text-stone-400 p-0"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={status === 'checking'}
                className="h-10 sm:h-auto sm:self-stretch px-4 sm:px-5 py-2 rounded-xl bg-[#0B3B24] hover:bg-[#134633] active:bg-[#072718] text-white font-semibold text-xs sm:text-[12.5px] tracking-wide shadow-xs hover:shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75"
              >
                <span>{status === 'checking' ? 'Checking...' : 'Check Delivery'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Dynamic Result State */}
          {status === 'available' && (
            <div className="mt-2.5 pt-2.5 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  ✓ Guaranteed cold-chain overnight delivery available to ZIP {zipCode} via FedEx Priority &amp; Southwest!
                </span>
              </div>
              <button
                type="button"
                onClick={handleBrowseCatalog}
                className="inline-flex items-center gap-1 text-[#0B3B24] font-bold hover:underline cursor-pointer self-start sm:self-auto text-xs"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {status === 'invalid' && (
            <div className="mt-2.5 pt-2 border-t border-rose-100 text-xs text-rose-600 font-medium">
              Please enter a valid 5-digit US ZIP code (e.g. 94538, 75001, 08820).
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
