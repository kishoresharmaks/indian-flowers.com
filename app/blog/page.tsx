import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Flower2,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  return {
    title: 'Floral Blog & Care Guides | Indian-Flowers.com — US Nationwide',
    description:
      'Cultural insights, flower care tips, wedding garland inspiration, and puja floral guides for the Indian diaspora across the United States.',
    alternates: {
      canonical: `${siteUrl}/blog`,
    },
    openGraph: {
      title: 'Floral Blog & Cultural Traditions | Indian-Flowers.com',
      description:
        'Discover Indian floral traditions, jasmine care, wedding varmala styling, and temple puja leaf guides.',
      url: `${siteUrl}/blog`,
      siteName: 'Indian-Flowers.com',
      images: [
        {
          url: '/images/banners/hero-wedding-tif-rose.jpg',
          width: 1200,
          height: 630,
          alt: 'Indian-Flowers.com Blog',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
  };
}

const BLOG_POSTS = [
  {
    slug: 'guide-to-fresh-indian-wedding-garlands',
    title: 'The Ultimate Guide to Fresh Indian Wedding Garlands (Jai Mala & Varmala)',
    category: 'WEDDING GARLANDS',
    date: 'October 2026',
    readTime: '6 min read',
    excerpt:
      'From dewy red rose petals and delicate button roses to fragrant carnations, discover how to select the perfect matching garlands for your US wedding muhurtham.',
    image: '/images/banners/hero-wedding-tif-exch.jpg',
    targetLink: '/?category=WEDDING%20GARLANDS#products-section',
    tags: ['Wedding Garlands', 'Jai Mala', 'Varmala', 'Bridal Guide'],
  },
  {
    slug: 'how-to-keep-madurai-mallipoo-fresh',
    title: 'How to Care for Fresh Madurai Mallipoo & Jasmine Strands Upon Arrival',
    category: 'STRINGS & LEAVES',
    date: 'October 2026',
    readTime: '4 min read',
    excerpt:
      'Simple steps to store, mist, and refrigerate your imported South Indian jasmine strings so they remain fragrant and dewy for days.',
    image: '/images/products/prod-madurai-mallipoo.jpg',
    targetLink: '/?category=STRINGS%20%26%20LEAVES&subcategory=Strings%20%2F%20Jasmine%20Strings#products-section',
    tags: ['Mallipoo', 'Jasmine Strings', 'Floral Care', 'South Indian'],
  },
  {
    slug: 'sacred-leaves-for-puja-and-kalash',
    title: 'Significance of Bilva (Vilvam), Mango & Betel Leaves in Vedic Worship',
    category: 'TEMPLE GARLANDS',
    date: 'October 2026',
    readTime: '5 min read',
    excerpt:
      'Why sacred Bilva leaves please Lord Shiva, why mango leaves guard entryways during Grihapravesam, and the purity of auspicious betel leaves.',
    image: '/images/products/prod-durva-bilva-combo.jpg',
    targetLink: '/?category=TEMPLE%20GARLANDS&subcategory=Vilvam%20Garlands#products-section',
    tags: ['Bilva Leaves', 'Vilvam', 'Puja Leaves', 'Temple Rituals'],
  },
  {
    slug: 'house-warming-floral-decor-ideas',
    title: 'Grihapravesam Harmony: Traditional Doorway Torans & Blessing Strands',
    category: 'HOUSE WARMING GARLANDS',
    date: 'October 2026',
    readTime: '5 min read',
    excerpt:
      'Transform your new American home with fragrant button rose entrance garlands, handcrafted coconut leaf thoranams, and positive Vedic energy.',
    image: '/images/banners/hero-wedding-tif-temple.jpg',
    targetLink: '/?category=HOUSE%20WARMING%20GARLANDS#products-section',
    tags: ['House Warming', 'Grihapravesam', 'Thoranam', 'Home Decor'],
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] font-sans text-stone-800">
      <Header />

      <main className="flex-1">
        {/* HERO BANNER */}
        <section className="bg-gradient-to-b from-[#0B3B24] to-[#134633] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,90,120,0.18),transparent_50%)] pointer-events-none" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold tracking-wider uppercase mb-4 backdrop-blur-xs">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>The Indian Flowers Journal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Floral Wisdom, Traditions & Care Guides
            </h1>
            <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
              Preserving sacred Indian floral heritage, wedding traditions, and practical tips to keep your imported blooms fresh across the United States.
            </p>
          </div>
        </section>

        {/* ARTICLES GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-60 w-full overflow-hidden bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-[#0B3B24]/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs font-medium text-stone-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {post.date}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-[#0B3B24] transition-colors leading-snug mb-3">
                      {post.title}
                    </h2>

                    <p className="text-stone-600 text-sm leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={post.targetLink}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#0B3B24] group-hover:text-[#1C563F] group-hover:translate-x-1 transition-all"
                    >
                      <span>Explore Collection & Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* CULTURAL COMMITMENT CALLOUT */}
          <div className="mt-16 bg-gradient-to-r from-[#F4F8F4] to-[#FAF6F0] rounded-3xl p-8 sm:p-12 border border-emerald-200/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Our Heritage Promise</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                Fresh From South Indian Farms to Your Sanctum
              </h3>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                Whether you need sacred Vilvam leaves for Somavaram puja or bridal garlands for an American wedding muhurtham, our temperature-regulated cold chain ensures dewy freshness every single time.
              </p>
            </div>

            <Link
              href="/#products-section"
              className="shrink-0 px-6 py-3.5 rounded-2xl bg-[#0B3B24] hover:bg-[#1C563F] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Shop All Fresh Flowers
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
