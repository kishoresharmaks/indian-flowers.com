import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Policy from '@/models/Policy';
import { DEFAULT_POLICIES } from '@/lib/defaultPolicies';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = (params.slug || '').trim().toLowerCase();
    await connectToDatabase();

    let policy = await Policy.findOne({ slug }).lean();

    // If not found in DB, check default templates
    if (!policy) {
      const defaultMatch = DEFAULT_POLICIES.find((p) => p.slug === slug);
      if (defaultMatch) {
        // Auto-persist to DB so it can be managed
        policy = await Policy.create(defaultMatch);
      }
    }

    if (!policy) {
      return NextResponse.json(
        { success: false, message: `Policy "${slug}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error fetching policy by slug:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    const slug = (params.slug || '').trim().toLowerCase();
    await connectToDatabase();
    const body = await req.json();

    const {
      title,
      subtitle,
      category,
      content,
      effectiveDate,
      lastUpdated,
      metaDescription,
      isPublished,
      order,
      resetToDefault,
    } = body;

    // Reset this single policy to default template
    if (resetToDefault) {
      const defaultMatch = DEFAULT_POLICIES.find((p) => p.slug === slug);
      if (!defaultMatch) {
        return NextResponse.json(
          { success: false, message: `Default template for "${slug}" not found.` },
          { status: 404 }
        );
      }

      const resetPolicy = await Policy.findOneAndUpdate(
        { slug },
        { ...defaultMatch, lastUpdated: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: `Policy "${slug}" reset to default US template.`,
        data: resetPolicy,
      });
    }

    const updateFields: any = {
      lastUpdated: lastUpdated || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };

    if (title !== undefined) updateFields.title = title.trim();
    if (subtitle !== undefined) updateFields.subtitle = subtitle.trim();
    if (category !== undefined) updateFields.category = category;
    if (content !== undefined) updateFields.content = content;
    if (effectiveDate !== undefined) updateFields.effectiveDate = effectiveDate;
    if (metaDescription !== undefined) updateFields.metaDescription = metaDescription.trim();
    if (isPublished !== undefined) updateFields.isPublished = Boolean(isPublished);
    if (order !== undefined) updateFields.order = Number(order) || 0;

    const updated = await Policy.findOneAndUpdate(
      { slug },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Policy "${updated.title}" updated successfully.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating policy:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update policy' },
      { status: 500 }
    );
  }
}
