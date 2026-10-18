import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Flower2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Truck,
  ShieldCheck,
  Heart,
  ArrowLeft,
  Navigation,
  CheckCircle2,
  Building2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import BrandLogo from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'About Us | The Indian Flowers — Fresh Indian Garlands & Blooms USA',
  description:
    'Learn about The Indian Flowers. We pride ourselves on delivering fresh, quality handcrafted garlands, jasmine strings, and sacred pooja flowers across the United States.',
  alternates: {
    canonical: 'https://indian-flowers.com/about',
  },
  openGraph: {
    title: 'About Us | The Indian Flowers — Handcrafted Garlands & Blooms USA',
    description:
      'Learn about The Indian Flowers. We pride ourselves on delivering fresh, quality handcrafted garlands, jasmine strings, and sacred pooja flowers across the United States.',
    url: 'https://indian-flowers.com/about',
    siteName: 'Indian-Flowers.com',
    images: [
      {
        url: '/images/banners/hero-wedding-1920x650.jpg',
        width: 1200,
        height: 630,
        alt: 'About Indian-Flowers.com USA',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | The Indian Flowers',
    description:
      'Authentic fresh Indian flowers and handcrafted garlands delivered across the United States.',
    images: ['/images/banners/hero-wedding-1920x650.jpg'],
  },
};

const ABOUT_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': 'https://indian-flowers.com/about#webpage',
      url: 'https://indian-flowers.com/about',
      name: 'About Indian-Flowers.com — Fresh Indian Flowers, Garlands & Pooja Essentials in USA',
      description:
        'Learn about The Indian Flowers. We pride ourselves on delivering fresh, quality handcrafted garlands, jasmine strings, and sacred pooja flowers across the United States.',
      publisher: {
        '@type': 'Florist',
        name: 'Indian-Flowers.com',
        url: 'https://indian-flowers.com',
        telephone: '+1-909-379-3678',
        email: 'indianflowersorder@gmail.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '14922 Bobcat Lane',
          addressLocality: 'Fontana',
          addressRegion: 'CA',
          postalCode: '92336',
          addressCountry: 'US',
        },
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://indian-flowers.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'About Us',
          item: 'https://indian-flowers.com/about',
        },
      ],
    },
  ],
};

const PICKUP_HUBS = [
  {
    city: 'Houston',
    state: 'Texas',
    region: 'Greater Houston & Sugar Land',
    tag: 'Texas Hub',
  },
  {
    city: 'Tampa',
    state: 'Florida',
    region: 'Tampa Bay & Central Florida',
    tag: 'Florida Hub',
  },
  {
    city: 'Sacramento',
    state: 'California',
    region: 'Northern California & Central Valley',
    tag: 'NorCal Hub',
  },
  {
    city: 'Reminderville',
    state: 'Ohio',
    region: 'Cleveland & Akron Metro Area',
    tag: 'Midwest Hub',
  },
  {
    city: 'Livermore',
    state: 'California',
    region: 'San Francisco Bay Area & Tri-Valley',
    tag: 'Bay Area Hub',
  },
  {
    city: 'Greenwood Village',
    state: 'Colorado',
    region: 'South Denver Metro & DTC',
    tag: 'Colorado Hub',
  },
  {
    city: 'Denver',
    state: 'Colorado',
    region: 'Denver Metro & Front Range',
    tag: 'Mountain West Hub',
  },
];

const VALUES = [
  {
    icon: Flower2,
    title: 'Handcrafted Garland Artistry',
    description:
      'Every wedding garland (Jai Mala) and temple mala is lovingly hand-strung by master artisans using time-honored Indian traditions, ensuring symmetry, fragrance, and sacred elegance.',
  },
  {
    icon: Truck,
    title: 'Cold-Chain Overnight Logistics',
    description:
      'From our temperature-controlled packing facilities to your doorstep, our flowers travel in insulated thermal packaging with food-grade gel refrigerants to stay dewy and vibrant.',
  },
  {
    icon: Clock,
    title: 'Prompt Muhurtham Delivery',
    description:
      'We understand that wedding muhurthams and temple poojas cannot wait. We schedule priority morning delivery arrivals across all 50 US states so your flora arrives on time.',
  },
  {
    icon: ShieldCheck,
    title: '100% Freshness Guarantee',
    description:
      'We stand behind every stem we dispatch. If your blossoms ever arrive compromised by transit delays, our 24-hour floral guarantee provides immediate replacement or full reimbursement.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0]/50 text-stone-900 font-sans flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ABOUT_JSON_LD),
        }}
      />
      {/* Storefront Header */}
      <Header />

      {/* 2. HERO SECTION WITH USER MISSION STATEMENT */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F4F8F4]/40 to-[#FAF6F0]/60 border-b border-stone-200/80 pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Subtle Background Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-emerald-100/30 via-rose-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 text-center space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200/80 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#0B3B24]">
            <Truck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Delivering Freshness Across The United States</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-[#0B3B24] tracking-[-0.035em] leading-[1.15]">
            About <span className="text-[#C85A78]">The Indian Flowers</span>
          </h1>

          {/* Subtitle intro */}
          <p className="text-base sm:text-lg text-stone-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Authentic, dewy Indian garlands, fragrant jasmine strings, and sacred ceremonial flora hand-crafted with devotion and delivered nationwide.
          </p>

          {/* User's Exact Mission Statement Quote Card */}
          <div className="mt-8 text-left bg-white/95 rounded-3xl p-6 sm:p-10 border border-emerald-900/10 shadow-[0_12px_40px_-15px_rgba(11,59,36,0.08)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#0B3B24]" />
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest font-bold text-[#C85A78] flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-[#C85A78]" />
                Our Story &amp; Dedication
              </span>

              <blockquote className="text-stone-800 text-base sm:text-xl font-medium leading-relaxed italic">
                &ldquo;We pride ourselves on delivering fresh and quality garlands that exceed our customer’s expectations with every order. From the moment a customer places an order with us, we prioritize their satisfaction by ensuring prompt delivery of our finest garlands. Our commitment to freshness and quality shines through in every garland we create, reflecting our dedication to excellent garlands.&rdquo;
              </blockquote>

              <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs sm:text-sm text-stone-500">
                <span className="font-semibold text-[#0B3B24]">
                  — The Indian Flowers Team
                </span>
                <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  California • Minnesota • Nationwide
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE CRAFTSMANSHIP PILLARS */}
      <section className="py-16 sm:py-20 bg-white border-b border-stone-200/80">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-[0.14em] font-bold text-[#C85A78]">
              Quality You Can Feel
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0B3B24] tracking-tight">
              Why Indian Families &amp; Temples Across the USA Trust Us
            </h2>
            <p className="text-sm sm:text-base text-stone-600 font-normal">
              Every celebration deserves the sacred grace of fresh blossoms. We combine traditional artisan hand-weaving with temperature-controlled cold-chain logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className="bg-[#FAF6F0]/60 rounded-2xl p-6 border border-stone-200/70 hover:border-emerald-300 hover:shadow-md transition-all space-y-3.5 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0B3B24] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6 text-emerald-300" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B3B24] tracking-tight">
                    {val.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. LOCATIONS & NATIONWIDE HUBS SHOWCASE */}
      <section className="py-16 sm:py-24 bg-[#FAF6F0]/60 border-b border-stone-200/80">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#0B3B24] text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Locations &amp; Hubs
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0B3B24] tracking-tight">
              Our Locations Across the United States
            </h2>
            <p className="text-sm sm:text-base text-stone-600 font-normal">
              From our California headquarters to our Midwest regional branch and local pickup hubs across major metropolitan centers, we ensure your floral needs are seamlessly fulfilled.
            </p>
          </div>

          {/* Two Primary Operational Locations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Main Location (HQ) — 7 cols */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-9 border-2 border-emerald-800/20 shadow-sm relative space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900 text-emerald-100 text-xs font-bold uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Main Location (HQ)</span>
                  </span>
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    Mon – Sun: 7:00 AM – 8:00 PM PST
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0B3B24] tracking-tight">
                    Fontana Headquarters &amp; Primary Dispatch Hub
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    Central coordination for custom wedding garlands, cold-chain packing, and nationwide overnight express dispatch.
                  </p>
                </div>

                {/* Address Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F8F4] border border-emerald-200/60 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0B3B24] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-900 block">
                        Headquarters Address
                      </span>
                      <p className="text-sm sm:text-base font-bold text-stone-900 mt-0.5 leading-snug">
                        14922 Bobcat lane, Fontana, CA 92336, California, USA
                      </p>
                    </div>
                  </div>

                  {/* Direct Contact Links */}
                  <div className="pt-3 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <a
                      href="tel:+19093793678"
                      className="flex items-center gap-2 p-2 rounded-xl bg-white text-stone-800 hover:text-[#0B3B24] border border-emerald-100 font-semibold transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[#0B3B24] shrink-0" />
                      <span>+1 (909) 379-3678</span>
                    </a>
                    <a
                      href="mailto:indianflowersorder@gmail.com"
                      className="flex items-center gap-2 p-2 rounded-xl bg-white text-stone-800 hover:text-[#0B3B24] border border-emerald-100 font-semibold transition-colors truncate"
                    >
                      <Mail className="w-4 h-4 text-[#0B3B24] shrink-0" />
                      <span className="truncate">indianflowersorder@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Map & Direction Action */}
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=14922+Bobcat+lane,+Fontana,+CA+92336"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Navigation className="w-4 h-4 text-emerald-300" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-white/70" />
                </a>
                <a
                  href="tel:+19093793678"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 hover:border-[#0B3B24] bg-white text-stone-700 hover:text-[#0B3B24] text-xs font-semibold transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#0B3B24]" />
                  <span>Call Headquarters Concierge</span>
                </a>
              </div>
            </div>

            {/* Other Locations (Midwest Regional Hub) — 5 cols */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-9 border border-stone-200 shadow-sm relative space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#0B3B24] text-xs font-bold uppercase tracking-wider">
                  Branch Location (Midwest)
                </span>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0B3B24] tracking-tight">
                    Inver Grove Heights Regional Branch
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    Dedicated regional distribution serving Minnesota, Upper Midwest communities, and regional temples.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-bold tracking-wider text-stone-500 block">
                        Branch Address
                      </span>
                      <p className="text-sm sm:text-base font-bold text-stone-900 mt-0.5 leading-snug">
                        6893 Alverno ln, Inver Grove Heights, MN 55077
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Serving Twin Cities &amp; Midwest metropolitan areas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Rapid ground and air courier coordination</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=6893+Alverno+ln,+Inver+Grove+Heights,+MN+55077"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 hover:border-[#0B3B24] bg-white text-stone-700 hover:text-[#0B3B24] text-xs font-semibold transition-colors"
                >
                  <Navigation className="w-4 h-4 text-[#0B3B24]" />
                  <span>View Branch on Map</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>
              </div>
            </div>
          </div>

          {/* 7 Local Pickup Locations Grid */}
          <div className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-[0.14em] font-bold text-[#C85A78] block">
                  Convenient Regional Access
                </span>
                <h3 className="text-xl sm:text-3xl font-bold text-[#0B3B24] tracking-tight mt-1">
                  Local Pickup Locations
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 font-normal">
                  In addition to direct doorstep delivery, local pickup is available in the following metropolitan areas for custom wedding garlands and ceremonial pre-orders:
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 shrink-0">
                <Navigation className="w-3.5 h-3.5 text-[#0B3B24]" />
                <span>7 Strategic USA Hubs</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {PICKUP_HUBS.map((hub) => (
                <div
                  key={hub.city}
                  className="bg-white rounded-2xl p-5 border border-stone-200/80 hover:border-emerald-400/80 hover:shadow-md transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                      {hub.tag}
                    </span>
                    <MapPin className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-stone-900 group-hover:text-[#0B3B24] transition-colors">
                      {hub.city}, {hub.state}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {hub.region}
                    </p>
                  </div>

                  <p className="text-[11px] text-stone-400 pt-1 border-t border-stone-100 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Pickup available for pre-booked orders</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. CEREMONIAL FLORAL CATALOG BANNER */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="bg-[#0B3B24] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl space-y-6">
            <div className="relative z-10 space-y-4 max-w-2xl">
              <span className="text-xs uppercase tracking-widest font-bold text-emerald-300 flex items-center gap-1.5">
                <Flower2 className="w-3.5 h-3.5" />
                Special Events &amp; Weddings
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Planning a Wedding, Arangetram, or Temple Utsavam?
              </h2>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
                Our floral specialists consult directly with wedding coordinators and families to customize garland lengths, rose petal colors, and deliver dewy garlands on your auspicious day.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/#custom-orders"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-stone-100 text-[#0B3B24] font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
                >
                  Request Custom Wedding Garland
                </Link>
                <Link
                  href="/#products-section"
                  className="px-5 py-3 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors border border-emerald-700/80"
                >
                  Browse Fresh Bloom Strings
                </Link>
                <a
                  href="tel:+19093793678"
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-300" />
                  <span>+1 (909) 379-3678</span>
                </a>
              </div>
            </div>

            {/* Decorative Flower Icon in background */}
            <div className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none">
              <Flower2 className="w-72 h-72" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. UNIFIED BRAND FOOTER */}
      <Footer
        contactPhone="+1 (909) 379-3678"
        contactEmail="indianflowersorder@gmail.com"
      />
    </div>
  );
}
