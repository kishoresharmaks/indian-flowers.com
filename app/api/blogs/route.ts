import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { DEFAULT_BLOGS, calculateReadTime, generateSlug } from '@/lib/defaultBlogs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    try {
      await Blog.createIndexes();
    } catch (e) {}

    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    // Build query filter
    const query: any = {};

    // Only authenticated admins can fetch unpublished/draft articles with ?all=true
    if (!fetchAll || !isAuthenticatedAdmin(request)) {
      query.isPublished = true;
    }

    if (category && category !== 'ALL') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (search && search.trim().length > 0) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { excerpt: { $regex: s, $options: 'i' } },
        { tags: { $in: [new RegExp(s, 'i')] } },
      ];
    }

    let blogs = await Blog.find(query).sort({ publishedAt: -1, createdAt: -1 }).lean();

    // Auto-seed default blogs if database collection is completely empty
    if ((!blogs || blogs.length === 0) && !fetchAll && !category && !search) {
      const totalInDb = await Blog.countDocuments();
      if (totalInDb === 0) {
        try {
          await Blog.insertMany(DEFAULT_BLOGS);
          blogs = await Blog.find({ isPublished: true })
            .sort({ publishedAt: -1, createdAt: -1 })
            .lean();
        } catch (seedErr) {
          console.warn('Could not auto-seed blogs into MongoDB:', seedErr);
        }
      }
      if (!blogs || blogs.length === 0) {
        return NextResponse.json({
          success: true,
          count: DEFAULT_BLOGS.length,
          data: DEFAULT_BLOGS,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error: any) {
    console.error('API /api/blogs GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch blogs', data: DEFAULT_BLOGS },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();

    const body = await request.json();
    const title = (body.title || '').trim();
    const content = body.content || '';

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Blog title is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, message: 'Blog content is required' },
        { status: 400 }
      );
    }

    // Auto-generate or sanitize slug
    let rawSlug = (body.slug || '').trim();
    if (!rawSlug) {
      rawSlug = generateSlug(title);
    } else {
      rawSlug = generateSlug(rawSlug);
    }

    // Ensure slug uniqueness
    let finalSlug = rawSlug;
    let counter = 1;
    while (await Blog.findOne({ slug: finalSlug })) {
      finalSlug = `${rawSlug}-${counter}`;
      counter++;
    }

    const excerpt = (body.excerpt || '').trim() || (body.description || '').trim() || title;
    const category = (body.category || 'FLORAL GUIDES').trim();
    const readTime = (body.readTime || '').trim() || calculateReadTime(content);
    const author = (body.author || 'Indian Flowers Editorial Team').trim();
    const image = (body.image || '/images/banners/hero-wedding-tif-rose.jpg').trim();
    const imageAlt = (body.imageAlt || title).trim();
    const isPublished = body.isPublished !== false;
    const featured = body.featured === true;

    // Process tags
    let tags: string[] = [];
    if (Array.isArray(body.tags)) {
      tags = body.tags.map((t: any) => String(t).trim()).filter(Boolean);
    } else if (typeof body.tags === 'string') {
      tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    // Process SEO fields
    const seoInput = body.seo || {};
    let keywords: string[] = [];
    if (Array.isArray(seoInput.keywords)) {
      keywords = seoInput.keywords.map((k: any) => String(k).trim()).filter(Boolean);
    } else if (typeof seoInput.keywords === 'string') {
      keywords = seoInput.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }

    const seo = {
      metaTitle: (seoInput.metaTitle || title).trim(),
      metaDescription: (seoInput.metaDescription || excerpt).trim(),
      keywords: keywords.length > 0 ? keywords : tags,
      canonicalUrl: (seoInput.canonicalUrl || '').trim(),
      ogImage: (seoInput.ogImage || image).trim(),
      noIndex: seoInput.noIndex === true,
    };

    const newBlog = await Blog.create({
      title,
      slug: finalSlug,
      excerpt,
      content,
      image,
      imageAlt,
      category,
      tags,
      author,
      readTime,
      isPublished,
      featured,
      views: 0,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      seo,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Blog post created successfully',
        data: newBlog,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /api/blogs POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
