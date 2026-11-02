'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Clock,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { getMinDeliveryDateString, formatReadableDate, MIN_DELIVERY_LEAD_DAYS } from '@/lib/dateUtils';

interface EventDeliveryCheckerProps {
  onCheckSuccess?: (date: string, zip: string) => void;
}

const URGENT_PHONE = '+1 (909) 379-3678';
const URGENT_PHONE_SHORT = '(909) 379-3678';
const URGENT_TEL = 'tel:+19093793678';
const URGENT_WHATSAPP =
  'https://wa.me/19093793678?text=Hello%20Indian%20Flowers,%20I%20have%20an%20urgent%20event%20order%20and%20need%20fresh%20flowers%20within%2010%20days.';

export default function EventDeliveryChecker({ onCheckSuccess }: EventDeliveryCheckerProps) {
  const [eventDate, setEventDate] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'urgent' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Earliest allowable delivery date (mandatory 10-day advance cold-chain notice)
  const minDeliveryDate = getMinDeliveryDateString(MIN_DELIVERY_LEAD_DAYS);

  const handleDateChange = (val: string) => {
    setEventDate(val);
    if (!val) {
      setStatus('idle');
      setErrorMessage('');
      return;
    }

    // If date is within the 10-day cooling period, proactively show the urgent contact state
    if (val < minDeliveryDate) {
      setStatus('urgent');
      setErrorMessage('');
    } else {
      if (status === 'urgent' || status === 'invalid') {
        setStatus('idle');
        setErrorMessage('');
      }
    }
  };

  const handleZipChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setZipCode(cleaned);
    if (status === 'invalid') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipCode.trim();

    // Check for 6-digit Indian PIN codes
    if (cleanZip.length === 6) {
      setStatus('invalid');
      setErrorMessage('Please enter a 5-digit US ZIP code. We deliver dewy fresh flowers exclusively across all 50 US States.');
      return;
    }

    // Require complete 5-digit US ZIP code
    if (!cleanZip || cleanZip.length !== 5 || !/^\d{5}$/.test(cleanZip)) {
      setStatus('invalid');
      setErrorMessage('Please enter a valid 5-digit US ZIP code (e.g. 94538).');
      return;
    }

    // Check if event date is empty
    if (!eventDate) {
      setStatus('invalid');
      setErrorMessage(
        `Please select your event date. Fresh flower orders require a 10-day cooling period (earliest: ${formatReadableDate(
          minDeliveryDate
        )}), or contact us for urgent orders.`
      );
      return;
    }

    // Check if event date is within the 10-day cooling window
    if (eventDate < minDeliveryDate) {
      setStatus('urgent');
      return;
    }

    // Valid check
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
    <section className="w-full bg-[#FAF6F0] pt-1 pb-3 sm:pt-2 sm:pb-4 px-3 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1480px] mx-auto">
        {/* Hallmark Delivery Card - Balanced, Responsive, and Never Clipped */}
        <div className="w-full rounded-2xl sm:rounded-3xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow p-3 sm:p-4.5 lg:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">
            {/* Left Info: Icon + Clear Typography + Badges */}
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/80 text-[#0B3B24] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                <ShieldCheck className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-[#0B3B24]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-[13px] sm:text-[15px] font-bold text-[#0B3B24] tracking-[-0.015em]">
                    Check Delivery for Your Event Date
                  </h3>
                  <div className="inline-flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-900 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border border-emerald-200/50 whitespace-nowrap">
                      🌿 USA Cold-Chain
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100/70 text-amber-900 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border border-amber-200/60 whitespace-nowrap">
                      ❄️ 10-Day Cooling
                    </span>
                  </div>
                </div>
                <p className="text-[11px] sm:text-[12.5px] text-stone-500 font-normal leading-relaxed mt-0.5">
                  Guaranteed arrival before 10:30 AM for your Muhurtham or morning puja
                </p>
              </div>
            </div>

            {/* Right Form: Touch-Friendly 2-Column on Mobile, Sleek Horizontal Bar on Desktop */}
            <form
              onSubmit={handleCheck}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full lg:w-auto"
            >
              {/* Inputs Container: 2-column grid on mobile (<640px), inline on tablet/desktop */}
              <div className="grid grid-cols-[1.3fr_1fr] sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                {/* Event Date Input */}
                <div className="relative flex items-center bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/90 focus-within:border-[#0B3B24] focus-within:ring-2 focus-within:ring-[#0B3B24]/15 px-2.5 sm:px-3 py-1.5 sm:py-2 sm:w-52 transition-all min-h-[42px] sm:min-h-[44px]">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0B3B24] shrink-0 mr-1.5 sm:mr-2" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-500 leading-none mb-0.5 truncate">
                      Event Date
                    </span>
                    <input
                      type="date"
                      min={minDeliveryDate}
                      value={eventDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full text-xs sm:text-[13px] font-semibold text-stone-900 bg-transparent outline-none cursor-pointer p-0 [color-scheme:light]"
                    />
                  </div>
                </div>

                {/* US ZIP Input */}
                <div className="relative flex items-center bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/90 focus-within:border-[#0B3B24] focus-within:ring-2 focus-within:ring-[#0B3B24]/15 px-2.5 sm:px-3 py-1.5 sm:py-2 sm:w-36 transition-all min-h-[42px] sm:min-h-[44px]">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0B3B24] shrink-0 mr-1.5 sm:mr-2" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-500 leading-none mb-0.5">
                      US ZIP Code
                    </span>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="e.g. 94538"
                      value={zipCode}
                      onChange={(e) => handleZipChange(e.target.value)}
                      className="w-full text-xs sm:text-[13px] font-semibold text-stone-900 bg-transparent outline-none placeholder:text-stone-400 p-0"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={status === 'checking'}
                className="min-h-[42px] sm:min-h-[44px] px-4 sm:px-5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] active:bg-[#072718] text-white font-bold text-xs sm:text-[12.5px] tracking-wide shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75 w-full sm:w-auto"
              >
                <span>{status === 'checking' ? 'Checking Availability...' : 'Check Delivery'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Always Visible Cooling & Urgent Order Help Strip */}
          <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] sm:text-[12px] text-stone-600 bg-stone-50/70 rounded-xl px-2.5 sm:px-3 py-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="leading-tight">
                <strong className="text-stone-800 font-semibold">10-Day Cooling Window:</strong> Fresh floral harvest requires 10 days
                advance cold-chain preparation.
              </span>
            </div>
            <div className="flex items-center flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 pt-1 md:pt-0 border-t border-stone-200/50 md:border-t-0 font-medium shrink-0">
              <span className="text-stone-700 text-[11px] sm:text-xs whitespace-nowrap">Urgent order within 10 days?</span>
              <div className="inline-flex items-center gap-1.5">
                <a
                  href={URGENT_TEL}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-[#0B3B24] border border-stone-200/90 hover:border-emerald-300 font-bold text-[10.5px] sm:text-[11.5px] transition-all shadow-2xs whitespace-nowrap active:scale-95"
                >
                  <PhoneCall className="w-3 h-3 text-[#0B3B24]" />
                  <span>Call {URGENT_PHONE_SHORT}</span>
                </a>
                <span className="text-stone-400 text-[10px]">or</span>
                <a
                  href={URGENT_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10.5px] sm:text-[11.5px] transition-all shadow-2xs whitespace-nowrap active:scale-95"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* URGENT RUSH ORDER BANNER (< 10 Days) */}
          {status === 'urgent' && (
            <div className="mt-3 p-3 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-[13px] font-bold text-amber-900">
                    Urgent Order Notice (Within 10-Day Cooling Window)
                  </h4>
                  <p className="text-[11px] sm:text-[12px] text-amber-800 leading-relaxed">
                    {eventDate ? (
                      <>
                        Your event date (<strong>{formatReadableDate(eventDate)}</strong>) is within our 10-day cooling &amp; preparation
                        window.
                      </>
                    ) : (
                      <>Fresh flower orders normally require a 10-day advance cooling &amp; preparation period.</>
                    )}{' '}
                    For emergency rush orders, please contact our florist team immediately to verify same-day flight cargo
                    or priority overnight availability.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                <a
                  href={URGENT_TEL}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs font-bold transition-all shadow-2xs whitespace-nowrap active:scale-95 text-center"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {URGENT_PHONE_SHORT}</span>
                </a>
                <a
                  href={URGENT_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-2xs whitespace-nowrap active:scale-95 text-center"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* SUCCESS / AVAILABLE STATE */}
          {status === 'available' && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in duration-200">
              <div className="flex items-start sm:items-center gap-2 text-emerald-900 font-semibold text-[11.5px] sm:text-[13px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  ✓ Guaranteed cold-chain overnight delivery available to ZIP <strong>{zipCode}</strong> for{' '}
                  <strong>{formatReadableDate(eventDate)}</strong> via FedEx Priority &amp; Southwest Cargo!
                </span>
              </div>
              <button
                type="button"
                onClick={handleBrowseCatalog}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B3B24] hover:bg-[#1C563F] text-white font-bold text-xs transition-all shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* INVALID STATE */}
          {status === 'invalid' && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-rose-800 text-[11.5px] sm:text-[12.5px] font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <a
                href={URGENT_TEL}
                className="inline-flex items-center gap-1 text-[#0B3B24] font-bold hover:underline shrink-0 text-xs self-start sm:self-auto"
              >
                <PhoneCall className="w-3 h-3 text-[#0B3B24]" />
                <span>Call {URGENT_PHONE_SHORT} for Help</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
