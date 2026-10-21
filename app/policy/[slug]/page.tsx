import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import Policy, { IPolicy } from '@/models/Policy';
import { DEFAULT_POLICIES } from '@/lib/defaultPolicies';
import PolicyContentRenderer from '@/components/policies/PolicyContentRenderer';
import PrintPolicyButton from '@/components/policies/PrintPolicyButton';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import BrandLogo from '@/components/BrandLogo';
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
      robots: { index: false, follow: true },
    };
  }

  const title = `${policy.title} | Indian-Flowers.com USA`;
  const description =
    policy.metaDescription ||
    policy.subtitle ||
    `Official ${policy.title} for Indian-Flowers.com US storefront.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://indian-flowers.com/policy/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://indian-flowers.com/policy/${params.slug}`,
      siteName: 'Indian-Flowers.com',
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
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

  const policyJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `https://indian-flowers.com/policy/${params.slug}#webpage`,
        url: `https://indian-flowers.com/policy/${params.slug}`,
        name: `${policy.title} | Indian-Flowers.com USA`,
        description:
          policy.metaDescription ||
          policy.subtitle ||
          `Official ${policy.title} for Indian-Flowers.com storefront.`,
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://indian-flowers.com/#website',
          url: 'https://indian-flowers.com',
          name: 'Indian-Flowers.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Indian-Flowers.com',
          url: 'https://indian-flowers.com',
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
            name: 'Store Policies',
            item: 'https://indian-flowers.com/policy/privacy-policy',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: policy.title,
            item: `https://indian-flowers.com/policy/${params.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0]/60 text-stone-900 font-sans flex flex-col justify-between pb-16 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(policyJsonLd),
        }}
      />
      {/* Storefront Header */}
      <Header />

      {/* 2. BREADCRUMBS & HERO SECTION */}
      <div className="bg-gradient-to-b from-white to-[#F4F8F4]/50 border-b border-stone-200/80">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 sm:py-12">
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
      <main className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 sm:py-12 flex-1">
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
                <a href="mailto:indianflowersorder@gmail.com" className="hover:underline flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> indianflowersorder@gmail.com
                </a>
                <a href="tel:+19093793678" className="hover:underline flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> +1 (909) 379-3678
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* 4. UNIFIED BRAND FOOTER */}
      <Footer
        contactPhone="+1 (909) 379-3678"
        contactEmail="indianflowersorder@gmail.com"
      />
    </div>
  );
}
