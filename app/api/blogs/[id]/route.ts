import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { DEFAULT_BLOGS, calculateReadTime, generateSlug } from '@/lib/defaultBlogs';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const incViews = searchParams.get('incViews') === 'true';

    let blog = null;

    if (mongoose.isValidObjectId(id)) {
      if (incViews) {
        blog = await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();
      } else {
        blog = await Blog.findById(id).lean();
      }
    }

    if (!blog) {
      if (incViews) {
        blog = await Blog.findOneAndUpdate(
          { slug: id },
          { $inc: { views: 1 } },
          { new: true }
        ).lean();
      } else {
        blog = await Blog.findOne({ slug: id }).lean();
      }
    }

    // Fallback to DEFAULT_BLOGS if not in DB yet
    if (!blog) {
      const fallback = DEFAULT_BLOGS.find((b) => b.slug === id);
      if (fallback) {
        return NextResponse.json({
          success: true,
          data: fallback,
        });
      }
      return NextResponse.json(
        { success: false, message: 'Blog article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    console.error('API /api/blogs/[id] GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();

    const { id } = params;
    const body = await request.json();

    const updateFields: any = {};
    if (typeof body.title === 'string' && body.title.trim()) {
      updateFields.title = body.title.trim();
    }

    if (typeof body.slug === 'string' && body.slug.trim()) {
      const newSlug = generateSlug(body.slug.trim());
      // Check if slug is used by another article
      const existing = await Blog.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Slug is already in use by another article.' },
          { status: 400 }
        );
      }
      updateFields.slug = newSlug;
    }

    if (typeof body.excerpt === 'string') updateFields.excerpt = body.excerpt.trim();
    if (typeof body.description === 'string' && !updateFields.excerpt) {
      updateFields.excerpt = body.description.trim();
    }
    if (typeof body.content === 'string') {
      updateFields.content = body.content;
      if (!body.readTime) {
        updateFields.readTime = calculateReadTime(body.content);
      }
    }
    if (typeof body.readTime === 'string' && body.readTime.trim()) {
      updateFields.readTime = body.readTime.trim();
    }
    if (typeof body.image === 'string') updateFields.image = body.image.trim();
    if (typeof body.imageAlt === 'string') updateFields.imageAlt = body.imageAlt.trim();
    if (typeof body.category === 'string') updateFields.category = body.category.trim();
    if (typeof body.author === 'string') updateFields.author = body.author.trim();
    if (typeof body.isPublished === 'boolean') updateFields.isPublished = body.isPublished;
    if (typeof body.featured === 'boolean') updateFields.featured = body.featured;

    if (Array.isArray(body.tags)) {
      updateFields.tags = body.tags.map((t: any) => String(t).trim()).filter(Boolean);
    } else if (typeof body.tags === 'string') {
      updateFields.tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    if (body.seo) {
      const seoInput = body.seo;
      let keywords: string[] = [];
      if (Array.isArray(seoInput.keywords)) {
        keywords = seoInput.keywords.map((k: any) => String(k).trim()).filter(Boolean);
      } else if (typeof seoInput.keywords === 'string') {
        keywords = seoInput.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
      }

      updateFields.seo = {
        metaTitle: typeof seoInput.metaTitle === 'string' ? seoInput.metaTitle.trim() : '',
        metaDescription: typeof seoInput.metaDescription === 'string' ? seoInput.metaDescription.trim() : '',
        keywords: keywords,
        canonicalUrl: typeof seoInput.canonicalUrl === 'string' ? seoInput.canonicalUrl.trim() : '',
        ogImage: typeof seoInput.ogImage === 'string' ? seoInput.ogImage.trim() : '',
        noIndex: seoInput.noIndex === true,
      };
    }

    let updated = null;
    if (mongoose.isValidObjectId(id)) {
      updated = await Blog.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    } else {
      updated = await Blog.findOneAndUpdate({ slug: id }, { $set: updateFields }, { new: true });
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Blog article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blog updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('API /api/blogs/[id] PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update blog' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();

    const { id } = params;
    let deleted = null;

    if (mongoose.isValidObjectId(id)) {
      deleted = await Blog.findByIdAndDelete(id);
    } else {
      deleted = await Blog.findOneAndDelete({ slug: id });
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Blog article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error: any) {
    console.error('API /api/blogs/[id] DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
