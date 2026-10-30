import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Share2,
  Flower2,
  BookOpen,
  ChevronRight,
  Sparkles,
  Eye,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import Settings from '@/models/Settings';
import { DEFAULT_BLOGS, IBlogPostItem } from '@/lib/defaultBlogs';
import { getSiteUrl } from '@/lib/siteUrl';
import PolicyContentRenderer from '@/components/policies/PolicyContentRenderer';

export const dynamic = 'force-dynamic';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

async function getArticleAndRelated(slug: string) {
  try {
    await connectToDatabase();

    // Increment views asynchronously on page view
    const article = await Blog.findOneAndUpdate(
      { slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    const [relatedPosts, storeSettings] = await Promise.all([
      Blog.find({ slug: { $ne: slug }, isPublished: true })
        .sort({ publishedAt: -1 })
        .limit(3)
        .lean(),
      Settings.findOne().lean(),
    ]);

    let finalArticle = article;
    if (!finalArticle) {
      finalArticle = DEFAULT_BLOGS.find((b) => b.slug === slug) as any;
    }

    let finalRelated = relatedPosts;
    if (!finalRelated || finalRelated.length === 0) {
      finalRelated = DEFAULT_BLOGS.filter((b) => b.slug !== slug).slice(0, 3) as any;
    }

    return {
      article: finalArticle ? JSON.parse(JSON.stringify(finalArticle)) : null,
      relatedPosts: finalRelated ? JSON.parse(JSON.stringify(finalRelated)) : [],
      storeSettings: storeSettings ? JSON.parse(JSON.stringify(storeSettings)) : null,
    };
  } catch (err) {
    console.error('Failed to load blog article:', err);
    const fallback = DEFAULT_BLOGS.find((b) => b.slug === slug);
    const related = DEFAULT_BLOGS.filter((b) => b.slug !== slug).slice(0, 3);
    return {
      article: fallback || null,
      relatedPosts: related,
      storeSettings: null,
    };
  }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = params;
  const siteUrl = getSiteUrl();

  try {
    await connectToDatabase();
    let blog = await Blog.findOne({ slug }).lean();
    if (!blog) {
      blog = DEFAULT_BLOGS.find((b) => b.slug === slug) as any;
    }

    if (!blog) {
      return {
        title: 'Article Not Found | Indian-Flowers.com',
        description: 'The requested floral guide or care article could not be located.',
      };
    }

    const title = blog.seo?.metaTitle || `${blog.title} | Indian-Flowers.com`;
    const description = blog.seo?.metaDescription || blog.excerpt;
    const canonical = blog.seo?.canonicalUrl || `${siteUrl}/blog/${blog.slug}`;
    const ogImage = blog.seo?.ogImage || blog.image;
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      robots: {
        index: !blog.seo?.noIndex,
        follow: !blog.seo?.noIndex,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Indian-Flowers.com',
        images: [
          {
            url: fullOgImage,
            width: 1200,
            height: 630,
            alt: blog.imageAlt || blog.title,
          },
        ],
        type: 'article',
        publishedTime: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
        modifiedTime: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
        authors: [blog.author || 'Indian Flowers Editorial Team'],
        tags: blog.tags || [],
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [fullOgImage],
      },
    };
  } catch (error) {
    return {
      title: 'Floral Blog & Cultural Guides | Indian-Flowers.com',
      description: 'Explore Indian floral guides, wedding traditions, and pooja flower care.',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = params;
  const { article, relatedPosts, storeSettings } = await getArticleAndRelated(slug);
  const siteUrl = getSiteUrl();

  if (!article) {
    notFound();
  }

  const fullImageUrl = article.image.startsWith('http')
    ? article.image
    : `${siteUrl}${article.image}`;

  // JSON-LD Structured Data: BlogPosting Schema
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.excerpt,
    image: [fullImageUrl],
    datePublished: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date().toISOString(),
    dateModified: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: article.author || 'Indian Flowers Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Indian Flowers',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/the-indian-flowers-logo.webp`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${article.slug}`,
    },
    keywords: (article.seo?.keywords || article.tags || []).join(', '),
  };

  // JSON-LD Structured Data: BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Floral Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${siteUrl}/blog/${article.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] font-sans text-stone-800">
      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="flex-1">
        {/* BREADCRUMB & BACK NAVIGATION */}
        <section className="bg-white border-b border-stone-200/80 py-3.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-1.5 truncate">
              <Link href="/" className="hover:text-[#0B3B24] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              <Link href="/blog" className="hover:text-[#0B3B24] transition-colors">
                Blog
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              <span className="text-stone-800 font-semibold truncate max-w-[220px] sm:max-w-md">
                {article.title}
              </span>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-[#0B3B24] hover:text-[#1C563F] font-bold shrink-0 ml-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Articles</span>
            </Link>
          </div>
        </section>

        {/* MAIN ARTICLE CONTAINER */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
          {/* Article Header */}
          <header className="space-y-4 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#0B3B24] text-white shadow-xs">
                {article.category}
              </span>
              {article.featured && (
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#C85A78] text-white shadow-xs flex items-center gap-1">
                  ★ Featured Guide
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B3B24] tracking-tight leading-[1.15]">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 pt-4 border-t border-stone-200/80 text-xs text-stone-500">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-stone-800">
                  By {article.author || 'Indian Flowers Editorial Team'}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {article.readTime || '5 min read'}
                </span>
              </div>

              {article.views !== undefined && article.views > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-stone-400">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{article.views.toLocaleString()} reads</span>
                </div>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {article.image && (
            <figure className="aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-lg border border-stone-200/80 bg-stone-100">
              <img
                src={article.image}
                alt={article.imageAlt || article.title}
                className="w-full h-full object-cover"
              />
            </figure>
          )}

          {/* Article Body */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-stone-200/80">
            <PolicyContentRenderer content={article.content} />
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-bold text-stone-500 flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5" /> Topics:
              </span>
              {article.tags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#F4F8F4] text-[#134633] border border-[#0B3B24]/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* SHOP THE CEREMONY COLLECTION CTA */}
          <div className="bg-gradient-to-r from-[#0B3B24] to-[#134633] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Authentic US Delivery
              </span>
              <h3 className="text-xl font-bold tracking-tight">
                Order Fresh Indian Flowers for Your Upcoming Ceremony
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
                Handcrafted wedding garlands, South Indian Mallipoo strings, and sacred puja leaves delivered cold-chain fresh across the United States.
              </p>
            </div>
            <Link
              href="/shop"
              className="px-6 py-3 rounded-2xl bg-white text-[#0B3B24] text-xs font-extrabold hover:bg-stone-50 transition-all shadow-md shrink-0"
            >
              Shop All Fresh Flowers
            </Link>
          </div>

          {/* RELATED ARTICLES */}
          {relatedPosts.length > 0 && (
            <section className="pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-[#0B3B24] tracking-tight">
                  Related Guides & Traditions
                </h3>
                <Link
                  href="/blog"
                  className="text-xs font-bold text-[#0B3B24] hover:text-[#C85A78] transition-colors"
                >
                  View All Guides &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {relatedPosts.map((rel: any) => (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col group"
                  >
                    <div className="relative aspect-video w-full bg-stone-100 overflow-hidden">
                      <img
                        src={rel.image}
                        alt={rel.imageAlt || rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 bg-[#0B3B24]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {rel.category}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#0B3B24] transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                      <div className="text-[11px] text-stone-400 flex items-center justify-between">
                        <span>{rel.readTime || '4 min read'}</span>
                        <span className="font-bold text-[#0B3B24] group-hover:translate-x-0.5 transition-transform">
                          Read &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer
        deliveryModes={storeSettings?.deliveryModes}
        pickupHubs={storeSettings?.pickupHubs}
      />
    </div>
  );
}
