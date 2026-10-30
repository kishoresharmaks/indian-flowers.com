import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PasswordResetToken from '@/models/PasswordResetToken';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = (searchParams.get('token') || '').trim();
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    const accountType = searchParams.get('type') === 'admin' ? 'admin' : 'customer';

    if (!token || !email) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Token and email parameters are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const record = await PasswordResetToken.findOne({
      token,
      email,
      accountType,
      used: false,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!record) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'This password reset link has expired or has already been used.',
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: 'Token is valid.',
    });
  } catch (error: any) {
    console.error('API /api/auth/verify-reset-token error:', error);
    return NextResponse.json(
      { success: false, valid: false, message: 'Server verification error' },
      { status: 500 }
    );
  }
}
