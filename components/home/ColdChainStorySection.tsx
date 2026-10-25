'use client';

import React from 'react';
import { Flower2, Plane, Clock, ShieldCheck, CheckCircle2, Award, Truck, Sparkles } from 'lucide-react';

interface ColdChainStep {
  number: string;
  tag: string;
  title: string;
  description: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COLD_CHAIN_STEPS: ColdChainStep[] = [
  {
    number: '01',
    tag: 'ORIGIN HARVEST',
    title: 'Dawn Hand-Picking',
    description: 'Harvested at 4:30 AM from trusted floral farms across Madurai and Bengaluru while petals are tight and dew-fresh.',
    detail: 'Madurai Malli, Rose Petals, Sacred Tulsi',
    icon: Flower2,
  },
  {
    number: '02',
    tag: 'HANDCRAFTED',
    title: 'Artisan Garland Stringing',
    description: 'Master garland artisans hand-string each Jai Mala and jasmine strand using traditional organic cotton twine for featherweight strength.',
    detail: 'Balanced for wedding sherwanis & lehengas',
    icon: Sparkles,
  },
  {
    number: '03',
    tag: 'TEMPERATURE MONITORED',
    title: 'Cold-Chain Air Cargo',
    description: 'Packed into thermal-insulated containers with specialized cold ice-gel packs maintaining 38°F–42°F in pressurized aircraft cabins.',
    detail: 'FedEx Priority Overnight & Southwest Cargo',
    icon: Plane,
  },
  {
    number: '04',
    tag: 'CEREMONY ARRIVAL',
    title: '10:30 AM Venue Delivery',
    description: 'Direct doorstep arrival to your home, banquet hall, or temple venue before your auspicious Muhurtham or morning puja begins.',
    detail: 'Arrives crisp, fragrant, and ceremonial-ready',
    icon: Clock,
  },
];

export default function ColdChainStorySection() {
  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-[#FAF7F2] via-[#FAF6F0] to-[#FAF7F2] border-y border-stone-200/70 overflow-hidden">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Section Header with Editorial Rhythm */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-4xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/10 text-[#0B3B24] text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase border border-emerald-900/15">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0B3B24] shrink-0" />
              <span>THE COLD-CHAIN FRESHNESS PROMISE</span>
            </div>
            <h2 className="text-[26px] sm:text-[32px] lg:text-[38px] font-bold tracking-[-0.035em] text-[#0B3B24] leading-[1.18]">
              From Southern India to Your US Mandap
            </h2>
            <p className="text-xs sm:text-[14px] text-stone-600 font-normal leading-relaxed max-w-2xl">
              Authentic Indian flowers require unbroken temperature care. We don&apos;t keep shelf inventory; our garlands and loose blossoms are harvested, flown, and delivered fresh for your specific event date across the United States.
            </p>
          </div>
        </div>

        {/* 4-Step Asymmetric Journey Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {COLD_CHAIN_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(11,59,36,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <span className="text-[11px] font-bold text-stone-400 group-hover:text-[#0B3B24] transition-colors tabular-nums">
                    STEP {step.number}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] group-hover:bg-[#0B3B24] text-[#0B3B24] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                    <Icon className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                </div>

                {/* Step Body */}
                <div className="pt-4 space-y-2 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A78]">
                    {step.tag}
                  </span>
                  <h3 className="text-[16px] sm:text-[17px] font-bold text-stone-900 group-hover:text-[#0B3B24] transition-colors leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-[12px] sm:text-[12.5px] text-stone-600 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                {/* Step Footer Micro-Callout */}
                <div className="mt-4 pt-3 border-t border-stone-100/80 flex items-center gap-1.5 text-[10.5px] text-stone-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{step.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* High-Trust Guarantee Strip */}
        <div className="bg-white/80 rounded-2xl border border-stone-200/90 p-4 sm:p-5 flex flex-wrap items-center justify-around gap-4 sm:gap-6 text-center">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 leading-tight">100% US Dollar ($) Pricing</h4>
              <p className="text-[10.5px] text-stone-500 font-normal">No hidden international fees or exchange surprises</p>
            </div>
          </div>

          <div className="h-6 w-px bg-stone-200 hidden md:block" />

          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 leading-tight">FedEx Priority &amp; Southwest Cargo</h4>
              <p className="text-[10.5px] text-stone-500 font-normal">Nationwide cold-gel delivery direct to your address</p>
            </div>
          </div>

          <div className="h-6 w-px bg-stone-200 hidden md:block" />

          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 leading-tight">100% Fresh Arrival Guarantee</h4>
              <p className="text-[10.5px] text-stone-500 font-normal">Full replacement or immediate refund assurance</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
