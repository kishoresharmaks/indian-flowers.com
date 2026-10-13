import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import AdminUser from '@/models/AdminUser';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const email = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const secret = process.env.AUTH_SECRET;
    if (!secret) return NextResponse.json({ success: false, message: 'Authentication has not been configured.' }, { status: 503 });
    await connectToDatabase();
    const user = await AdminUser.findOne({ email }).select('+passwordHash');

    if (user && typeof password === 'string' && await bcrypt.compare(password, user.passwordHash)) {
      const response = NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      );

      // Set cookie for session
      response.cookies.set('admin_token', jwt.sign({ sub: String(user._id), email: user.email }, secret, { expiresIn: '24h' }), {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      await captureServerEvent(request, 'admin_logged_in', {
        authentication_method: 'password',
      }, 'admin-session');

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error: any) {
    await captureServerException(request, error, 'admin-session');
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
