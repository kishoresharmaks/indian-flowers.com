import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import AdminUser from '@/models/AdminUser';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = checkRateLimit(`admin-login:${ip}`, 5, 60 * 1000);
    if (!allowed) {
      return rateLimitResponse(retryAfterSeconds);
    }

    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Please enter both username and password' },
        { status: 400 }
      );
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, message: 'Authentication has not been configured.' },
        { status: 503 }
      );
    }

    // 1. Check if input credentials match configured environment variables
    const envUser = (
      process.env.ADMIN_USERNAME ||
      process.env.ADMIN_EMAIL ||
      process.env.ADMIN_USER ||
      ''
    ).trim().toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || '';

    const isEnvMatch = Boolean(
      envUser &&
      envPass &&
      username === envUser &&
      password === envPass
    );

    if (isEnvMatch) {
      let userId = 'admin-env';

      // Keep MongoDB AdminUser record synchronized with configured environment credentials
      try {
        await connectToDatabase();
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(envPass, salt);
        const syncedUser = await AdminUser.findOneAndUpdate(
          { email: envUser },
          { $set: { email: envUser, passwordHash } },
          { upsert: true, new: true }
        );
        if (syncedUser?._id) {
          userId = String(syncedUser._id);
        }
      } catch (dbError) {
        console.error('[Admin Auth] Warning: could not synchronize admin user to MongoDB:', dbError);
      }

      const response = NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      );

      response.cookies.set(
        'admin_token',
        jwt.sign({ sub: userId, email: envUser }, secret, { expiresIn: '24h' }),
        {
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60 * 24, // 1 day
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
        }
      );

      await captureServerEvent(
        request,
        'admin_logged_in',
        { authentication_method: 'env_credentials' },
        'admin-session'
      );

      return response;
    }

    // 2. Fallback: Authenticate against MongoDB AdminUser collection
    try {
      await connectToDatabase();
      const user = await AdminUser.findOne({ email: username }).select('+passwordHash');

      if (user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
        const response = NextResponse.json(
          { success: true, message: 'Authentication successful' },
          { status: 200 }
        );

        response.cookies.set(
          'admin_token',
          jwt.sign({ sub: String(user._id), email: user.email }, secret, { expiresIn: '24h' }),
          {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
          }
        );

        await captureServerEvent(
          request,
          'admin_logged_in',
          { authentication_method: 'database_credentials' },
          'admin-session'
        );

        return response;
      }
    } catch (dbLookupError) {
      console.error('[Admin Auth] Database error during authentication:', dbLookupError);
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
