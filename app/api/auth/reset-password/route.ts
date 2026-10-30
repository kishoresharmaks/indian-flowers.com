import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import Customer from '@/models/Customer';
import AdminUser from '@/models/AdminUser';
import PasswordResetToken from '@/models/PasswordResetToken';
import { sendPasswordResetSuccessEmail } from '@/lib/passwordResetEmail';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = checkRateLimit(`reset-password:${ip}`, 5, 10 * 60 * 1000);
    if (!allowed) {
      return rateLimitResponse(retryAfterSeconds);
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const accountType = body.accountType === 'admin' ? 'admin' : 'customer';

    if (!rawEmail) {
      return NextResponse.json(
        { success: false, message: 'Email address is required.' },
        { status: 400 }
      );
    }

    if (!token && !otp) {
      return NextResponse.json(
        { success: false, message: 'Please provide either the reset link token or the 6-digit verification code.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Query for valid unexpired token
    const query: any = {
      email: rawEmail,
      accountType,
      used: false,
      expiresAt: { $gt: new Date() },
    };

    if (token) {
      query.token = token;
    } else if (otp) {
      query.otp = otp;
    }

    const resetRecord = await PasswordResetToken.findOne(query);

    if (!resetRecord) {
      return NextResponse.json(
        {
          success: false,
          message: 'The password reset link or verification code is invalid or has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    let recipientName = 'Customer';

    if (accountType === 'admin') {
      const admin = await AdminUser.findOne({ email: rawEmail });
      if (!admin) {
        return NextResponse.json(
          { success: false, message: 'Admin account not found.' },
          { status: 404 }
        );
      }
      admin.passwordHash = passwordHash;
      await admin.save();
      recipientName = 'Administrator';
    } else {
      const customer = await Customer.findOne({ email: rawEmail });
      if (!customer) {
        return NextResponse.json(
          { success: false, message: 'Customer account not found.' },
          { status: 404 }
        );
      }
      customer.passwordHash = passwordHash;
      await customer.save();
      recipientName = customer.name || 'Valued Customer';
    }

    // Mark reset record as used
    resetRecord.used = true;
    await resetRecord.save();

    // Invalidate all remaining tokens for this email
    await PasswordResetToken.deleteMany({ email: rawEmail, accountType, _id: { $ne: resetRecord._id } });

    // Send confirmation email
    try {
      await sendPasswordResetSuccessEmail({
        toEmail: rawEmail,
        recipientName,
      });
    } catch (confErr) {
      console.warn('Failed to send password reset confirmation email:', confErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully updated! You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('API /api/auth/reset-password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    );
  }
}
