import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import AdminUser from '@/models/AdminUser';
import PasswordResetToken from '@/models/PasswordResetToken';
import { sendPasswordResetEmail } from '@/lib/passwordResetEmail';
import { getSiteUrl } from '@/lib/siteUrl';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = checkRateLimit(`forgot-password:${ip}`, 4, 15 * 60 * 1000);
    if (!allowed) {
      return rateLimitResponse(retryAfterSeconds);
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const accountType = body.accountType === 'admin' ? 'admin' : 'customer';

    if (!rawEmail || !rawEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let userFound = false;
    let userName = 'Customer';

    if (accountType === 'admin') {
      const admin = await AdminUser.findOne({ email: rawEmail });
      if (admin) {
        userFound = true;
        userName = 'Store Administrator';
      }
    } else {
      const customer = await Customer.findOne({ email: rawEmail });
      if (customer) {
        userFound = true;
        userName = customer.name || 'Valued Customer';
      }
    }

    // Generic response message to prevent email enumeration attacks
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account matches this email, a reset link and 6-digit code has been sent.',
    });

    if (!userFound) {
      // Return simulated success without sending email
      return successResponse;
    }

    // Invalidate any existing unused tokens for this email & accountType
    await PasswordResetToken.deleteMany({ email: rawEmail, accountType });

    // Generate secure token & 6-digit OTP
    const token = crypto.randomBytes(32).toString('hex');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity

    await PasswordResetToken.create({
      email: rawEmail,
      token,
      otp,
      accountType,
      expiresAt,
      used: false,
    });

    // Generate reset URL
    const siteUrl = getSiteUrl();
    const resetUrl = `${siteUrl}/forgot-password/reset?token=${token}&email=${encodeURIComponent(rawEmail)}${
      accountType === 'admin' ? '&type=admin' : ''
    }`;

    // Dispatch email through configured provider
    try {
      await sendPasswordResetEmail({
        toEmail: rawEmail,
        recipientName: userName,
        resetUrl,
        otpCode: otp,
        accountType,
      });
    } catch (emailErr) {
      console.error('Failed to dispatch password reset email:', emailErr);
    }

    return successResponse;
  } catch (error: any) {
    console.error('API /api/auth/forgot-password error:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to process password reset request. Please try again.' },
      { status: 500 }
    );
  }
}
