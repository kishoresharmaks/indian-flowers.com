import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Policy from '@/models/Policy';
import { DEFAULT_POLICIES } from '@/lib/defaultPolicies';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    let policies = await Policy.find({}).sort({ order: 1, createdAt: 1 }).lean();

    // If no policies exist in DB, automatically seed default US policies
    if (!policies || policies.length === 0) {
      await Policy.insertMany(DEFAULT_POLICIES);
      policies = await Policy.find({}).sort({ order: 1, createdAt: 1 }).lean();
    }

    return NextResponse.json({
      success: true,
      data: policies,
    });
  } catch (error: any) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      slug,
      title,
      subtitle,
      category = 'legal',
      content,
      effectiveDate,
      lastUpdated,
      metaDescription,
      isPublished = true,
      order = 0,
      resetToDefault,
    } = body;

    // Handle full reset to default templates
    if (resetToDefault) {
      await Policy.deleteMany({});
      await Policy.insertMany(DEFAULT_POLICIES);
      const reseeded = await Policy.find({}).sort({ order: 1 }).lean();
      return NextResponse.json({
        success: true,
        message: 'All policies have been reset to official US legal templates.',
        data: reseeded,
      });
    }

    if (!slug || !title || !content) {
      return NextResponse.json(
        { success: false, message: 'Slug, title, and content are required.' },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const updatedPolicy = await Policy.findOneAndUpdate(
      { slug: cleanSlug },
      {
        title: title.trim(),
        subtitle: (subtitle || '').trim(),
        category,
        content,
        effectiveDate: effectiveDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        lastUpdated: lastUpdated || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        metaDescription: (metaDescription || '').trim(),
        isPublished: Boolean(isPublished),
        order: Number(order) || 0,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Policy "${updatedPolicy.title}" updated successfully.`,
      data: updatedPolicy,
    });
  } catch (error: any) {
    console.error('Error saving policy:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save policy' },
      { status: 500 }
    );
  }
}
