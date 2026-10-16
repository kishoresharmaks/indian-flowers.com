import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import Policy, { IPolicy } from '@/models/Policy';
import { DEFAULT_POLICIES } from '@/lib/defaultPolicies';
import PolicyContentRenderer from '@/components/policies/PolicyContentRenderer';
import PrintPolicyButton from '@/components/policies/PrintPolicyButton';
import {
  ShieldCheck,
  Lock,
  Calendar,
  RefreshCw,
  Phone,
  Mail,
  ArrowLeft,
  ChevronRight,
  FileText,
  Truck,
  RotateCcw,
  AlertTriangle,
  Cookie,
  Flower2,
  CheckCircle2,
} from 'lucide-react';

interface PolicyPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';

async function getPolicy(slug: string): Promise<IPolicy | typeof DEFAULT_POLICIES[0] | null> {
  try {
    await connectToDatabase();
    const cleanSlug = slug.trim().toLowerCase();
    const policy = await Policy.findOne({ slug: cleanSlug }).lean();
    if (policy) return policy as any;
  } catch (err) {
    console.warn('DB lookup failed for policy, falling back to defaults:', err);
  }

  // Fallback to default in-memory templates
  const fallback = DEFAULT_POLICIES.find((p) => p.slug === slug.trim().toLowerCase());
  return fallback || null;
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const policy = await getPolicy(params.slug);
  if (!policy) {
    return {
      title: 'Policy Not Found | Indian-Flowers.com',
    };
  }

  return {
    title: `${policy.title} | Indian-Flowers.com USA`,
    description: policy.metaDescription || policy.subtitle || `Official ${policy.title} for Indian-Flowers.com US storefront.`,
  };
}

const POLICY_NAV = [
  { slug: 'privacy-policy', label: 'Privacy Policy', icon: ShieldCheck, desc: 'CCPA/CPRA & payment security' },
  { slug: 'shipping-policy', label: 'Shipping & Delivery', icon: Truck, desc: 'Cold-chain overnight USA delivery' },
  { slug: 'terms-and-conditions', label: 'Terms & Conditions', icon: FileText, desc: 'US legal agreement & ordering terms' },
  { slug: 'refund-policy', label: 'Refund & Cancellation', icon: RotateCcw, desc: '24-hour floral quality guarantee' },
  { slug: 'disclaimer', label: 'Disclaimer & Notices', icon: AlertTriangle, desc: 'Ceremonial use & non-consumption' },
  { slug: 'cookie-policy', label: 'Cookie Policy', icon: Cookie, desc: 'Cart tokens & privacy controls' },
];

export default async function PolicyPage({ params }: PolicyPageProps) {
  const policy = await getPolicy(params.slug);

  if (!policy) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]/60 text-stone-900 font-sans flex flex-col justify-between">
      {/* 1. TOP UTILITY BAR & BRAND HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/90 shadow-2xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Brand Identity */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-full bg-[#0B3B24] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Flower2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl text-[#0B3B24] tracking-tight block leading-tight">
                  Indian-Flowers.com
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-stone-500 block">
                  USA Fresh Floral Delivery
                </span>
              </div>
            </Link>

            {/* Right: Quick actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#0B3B24] bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
              </Link>
              <a
                href="tel:+15105795199"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#0B3B24] border border-stone-200 hover:border-stone-300 bg-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#0B3B24]" />
                <span className="hidden md:inline">+1 (510) 579-5199</span>
                <span className="md:hidden">Support</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMBS & HERO SECTION */}
      <div className="bg-gradient-to-b from-white to-[#F4F8F4]/50 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 font-medium">
            <Link href="/" className="hover:text-[#0B3B24] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <span className="text-stone-600">Legal &amp; Customer Trust</span>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <span className="text-[#0B3B24] font-semibold">{policy.title}</span>
          </nav>

          {/* Policy Title & Subtitle */}
          <div className="max-w-4xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-50 text-[#0B3B24] border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              United States E-Commerce Compliance
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B3B24] leading-tight">
              {policy.title}
            </h1>

            {policy.subtitle && (
              <p className="text-sm sm:text-base text-stone-600 font-normal leading-relaxed max-w-3xl">
                {policy.subtitle}
              </p>
            )}

            {/* Verification Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2 text-xs text-stone-500">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#0B3B24]" />
                <span>Effective: <strong>{policy.effectiveDate || 'October 15, 2026'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>Last Updated: <strong>{policy.lastUpdated || 'October 15, 2026'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-[#0B3B24]" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT LAYOUT (SIDEBAR + DOCUMENT) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* A. LEFT SIDEBAR: Policy Directory */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Store Policies &amp; Compliance
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  US Standards
                </span>
              </div>

              <nav className="space-y-1.5">
                {POLICY_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.slug === params.slug;

                  return (
                    <Link
                      key={item.slug}
                      href={`/policy/${item.slug}`}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#0B3B24] text-white shadow-xs font-semibold'
                          : 'bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 border border-transparent hover:border-stone-200'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          isActive ? 'text-emerald-300' : 'text-[#0B3B24]'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold truncate">
                          {item.label}
                        </div>
                        <div
                          className={`text-[11px] truncate ${
                            isActive ? 'text-emerald-100/90' : 'text-stone-500'
                          }`}
                        >
                          {item.desc}
                        </div>
                      </div>
                      {isActive && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 self-center" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Customer Support Box */}
            <div className="bg-[#FAF6F0] rounded-2xl border border-[#0B3B24]/15 p-5 space-y-3.5 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B3B24]">
                Customer Support Concierge
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed font-normal">
                Have questions about custom floral muhurthams, FedEx morning cold-chain delivery, or policy terms?
              </p>
              <div className="space-y-2 pt-1 text-xs">
                <a
                  href="tel:+15105795199"
                  className="flex items-center gap-2 text-stone-800 font-semibold hover:text-[#0B3B24] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#0B3B24]" />
                  <span>+1 (510) 579-5199</span>
                </a>
                <a
                  href="mailto:support@indian-flowers.com"
                  className="flex items-center gap-2 text-stone-800 font-semibold hover:text-[#0B3B24] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#0B3B24]" />
                  <span>support@indian-flowers.com</span>
                </a>
              </div>
              <div className="pt-2 border-t border-stone-200/80 text-[11px] text-stone-500">
                Support Hours: Mon – Sat, 7:00 AM – 7:00 PM PST
              </div>
            </div>
          </aside>

          {/* B. RIGHT COLUMN: Policy Content Reader */}
          <article className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                Official Document &bull; US Market
              </span>
              <PrintPolicyButton />
            </div>

            {/* Formatted Content Renderer */}
            <PolicyContentRenderer content={policy.content} />

            {/* Bottom Inquiries Callout */}
            <div className="mt-12 p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-2">
              <strong className="block font-bold text-[#0B3B24] text-sm sm:text-base">
                Questions or Ceremonial Requests?
              </strong>
              <p className="text-stone-700 leading-relaxed font-normal">
                Our floral specialists are available to coordinate delivery schedules, custom wedding garland specifications, and address deliverability checks for your local zip code.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#0B3B24]">
                <a href="mailto:support@indian-flowers.com" className="hover:underline flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> support@indian-flowers.com
                </a>
                <a href="tel:+15105795199" className="hover:underline flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> +1 (510) 579-5199
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#0B3B24] text-white pt-12 pb-8 border-t border-emerald-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div className="space-y-3">
              <span className="font-extrabold text-base tracking-tight text-white block">
                Indian-Flowers.com
              </span>
              <p className="text-xs text-white/75 leading-relaxed font-normal">
                Authentic, dewy Indian blossoms, temple malas, jasmine strings, and sacred puja leaves delivered fresh across all 50 states of the USA.
              </p>
              <div className="pt-1 text-xs text-emerald-300 font-semibold">
                Toll Free: +1 (510) 579-5199
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
                Fresh Collections
              </h4>
              <ul className="space-y-2 text-xs text-white/75">
                <li><Link href="/#categories" className="hover:text-white transition-colors">Jasmine &amp; Fragrant Strings</Link></li>
                <li><Link href="/#categories" className="hover:text-white transition-colors">Ceremonial &amp; Wedding Jai Malas</Link></li>
                <li><Link href="/#categories" className="hover:text-white transition-colors">Daily Pooja Loose Blooms</Link></li>
                <li><Link href="/#categories" className="hover:text-white transition-colors">Sacred Mango &amp; Betel Leaves</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
                Customer Services
              </h4>
              <ul className="space-y-2 text-xs text-white/75">
                <li><Link href="/policy/shipping-policy" className="hover:text-white transition-colors">USA Shipping &amp; Delivery</Link></li>
                <li><Link href="/policy/refund-policy" className="hover:text-white transition-colors">24-Hour Freshness Guarantee</Link></li>
                <li><Link href="/#custom-orders" className="hover:text-white transition-colors">Custom Wedding Consultations</Link></li>
                <li><Link href="/#faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">
                Policies &amp; Compliance
              </h4>
              <ul className="space-y-2 text-xs text-white/75">
                <li><Link href="/policy/privacy-policy" className="hover:text-white transition-colors">Privacy Policy (CCPA/CPRA)</Link></li>
                <li><Link href="/policy/terms-and-conditions" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/policy/refund-policy" className="hover:text-white transition-colors">Refund &amp; Cancellation</Link></li>
                <li><Link href="/policy/disclaimer" className="hover:text-white transition-colors">Disclaimer &amp; Disclosures</Link></li>
                <li><Link href="/policy/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <div>
              &copy; {new Date().getFullYear()} <strong>Indian-Flowers.com</strong>. All Rights Reserved. US Registered E-Commerce.
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> SSL Protected</span>
              <span>&bull;</span>
              <span>Currency: <strong>USD ($)</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
