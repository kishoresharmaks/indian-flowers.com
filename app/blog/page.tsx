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
  Search,
  Tag,
  ExternalLink,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import Settings from '@/models/Settings';
import { DEFAULT_BLOGS, IBlogPostItem } from '@/lib/defaultBlogs';
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
          alt: 'Indian-Flowers.com Floral Blog',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
  };
}

async function getBlogData() {
  try {
    await connectToDatabase();
    const [dbBlogs, storeSettings] = await Promise.all([
      Blog.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).lean(),
      Settings.findOne().lean(),
    ]);

    let blogs: any[] = dbBlogs;
    if (!blogs || blogs.length === 0) {
      // Auto-seed if empty
      try {
        await Blog.insertMany(DEFAULT_BLOGS);
        blogs = await Blog.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).lean();
      } catch (seedErr) {
        blogs = DEFAULT_BLOGS;
      }
    }

    return {
      blogs: blogs.map((b: any) => ({
        ...b,
        _id: b._id ? b._id.toString() : b.slug,
        publishedAt: b.publishedAt ? new Date(b.publishedAt).toISOString() : new Date().toISOString(),
      })),
      storeSettings: storeSettings ? JSON.parse(JSON.stringify(storeSettings)) : null,
    };
  } catch (err) {
    console.error('Failed to load blog page data:', err);
    return {
      blogs: DEFAULT_BLOGS,
      storeSettings: null,
    };
  }
}

export default async function BlogPage() {
  const { blogs, storeSettings } = await getBlogData();
  const siteUrl = getSiteUrl();

  // Find hero spotlight post
  const heroPost = blogs.find((b: any) => b.featured) || blogs[0];
  const regularPosts = blogs.filter((b: any) => b.slug !== heroPost?.slug);

  // JSON-LD Structured Data for Google Blog / CollectionPage Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'The Indian Flowers Journal & Care Guides',
    description:
      'Cultural insights, flower care tips, wedding garland inspiration, and puja floral guides for the Indian diaspora across the United States.',
    url: `${siteUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Indian Flowers',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/the-indian-flowers-logo.webp`,
      },
    },
    blogPost: blogs.map((b: any) => ({
      '@type': 'BlogPosting',
      headline: b.title,
      description: b.excerpt,
      image: b.image?.startsWith('http') ? b.image : `${siteUrl}${b.image}`,
      datePublished: b.publishedAt,
      url: `${siteUrl}/blog/${b.slug}`,
      author: {
        '@type': 'Person',
        name: b.author || 'Indian Flowers Editorial Team',
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] font-sans text-stone-800">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              Preserving sacred Indian floral heritage, wedding traditions, and practical tips to keep your imported blooms dewy and fresh across the United States.
            </p>
          </div>
        </section>

        {/* HERO SPOTLIGHT ARTICLE (PINNED) */}
        {heroPost && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200/80 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 relative aspect-[16/10] rounded-2xl overflow-hidden bg-stone-100 group">
                  <img
                    src={heroPost.image}
                    alt={heroPost.imageAlt || heroPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-[#0B3B24] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {heroPost.category}
                    </span>
                    <span className="bg-[#C85A78] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      ★ Featured Article
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-3 text-xs font-medium text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {new Date(heroPost.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {heroPost.readTime || '5 min read'}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3B24] tracking-tight leading-tight hover:text-[#1C563F] transition-colors">
                    <Link href={`/blog/${heroPost.slug}`}>{heroPost.title}</Link>
                  </h2>

                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
                    {heroPost.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(heroPost.tags || []).slice(0, 3).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium bg-[#F4F8F4] text-[#134633] px-2.5 py-1 rounded-lg border border-[#0B3B24]/10"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/blog/${heroPost.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs font-bold transition-all shadow-md shadow-[#0B3B24]/20 group/btn"
                    >
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ARTICLES GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0B3B24] tracking-tight">
                Latest Floral Guides & Articles
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Care tips, ritual meanings, and wedding inspirations updated regularly
              </p>
            </div>
            <span className="text-xs font-bold text-stone-400">
              Showing {blogs.length} articles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post: any) => (
              <article
                key={post.slug}
                className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                  <img
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-[#0B3B24]/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs font-medium text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {post.readTime || '5 min read'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#0B3B24] transition-colors leading-snug line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>

                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-stone-400 truncate max-w-[150px]">
                      <span>By {post.author}</span>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3B24] hover:text-[#C85A78] transition-colors"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* BOTTOM NEWSLETTER / TRUST BANNER */}
        <section className="bg-[#FAF6F0] pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#0B3B24] to-[#134633] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>Nationwide Floral Delivery</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Need Fresh Flowers for an Upcoming Ceremony?
              </h2>
              <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed">
                We handcraft authentic Jai Malas, import fresh Madurai Mallipoo weekly, and deliver temperature-controlled cold-chain boxes anywhere in the USA.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/shop"
                  className="px-6 py-3 rounded-2xl bg-white text-[#0B3B24] text-xs font-extrabold hover:bg-stone-100 transition-all shadow-md"
                >
                  Explore Fresh Flower Catalog
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 rounded-2xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all border border-white/20"
                >
                  Custom Wedding Inquiry
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer
        deliveryModes={storeSettings?.deliveryModes}
        pickupHubs={storeSettings?.pickupHubs}
      />
    </div>
  );
}
