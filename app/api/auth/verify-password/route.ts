import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import AdminUser from '@/models/AdminUser';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === 'string' ? body.password : '';

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    const envPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;

    // 1. Verify against configured environment variable
    if (envPass && password === envPass) {
      return NextResponse.json({ success: true, message: 'Password verified' });
    }

    // 2. Verify against database admin accounts
    try {
      await connectToDatabase();
      const adminUsers = await AdminUser.find().select('+passwordHash');
      for (const admin of adminUsers) {
        if (admin.passwordHash && (await bcrypt.compare(password, admin.passwordHash))) {
          return NextResponse.json({ success: true, message: 'Password verified' });
        }
      }
    } catch (dbError) {
      console.error('[Verify Password] Database lookup error:', dbError);
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Admin Password. Access Denied.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

