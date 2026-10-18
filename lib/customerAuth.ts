import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface CustomerJwtPayload {
  customerId: string;
  email: string;
  name: string;
}

export const CUSTOMER_COOKIE_NAME = 'customer_token';

/**
 * Signs a JWT session token for a customer (valid for 30 days)
 */
export function signCustomerToken(payload: { id: string; email: string; name: string }): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured in server environment.');
  }
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email.toLowerCase().trim(),
      name: payload.name.trim(),
    },
    secret,
    { expiresIn: '30d' }
  );
}

/**
 * Extracts and verifies the customer JWT from request cookies
 */
export function getCustomerFromToken(req: NextRequest | Request): CustomerJwtPayload | null {
  try {
    let token: string | undefined;

    if ('cookies' in req && typeof (req as NextRequest).cookies?.get === 'function') {
      token = (req as NextRequest).cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    } else {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CUSTOMER_COOKIE_NAME}=([^;]+)`));
      token = match ? decodeURIComponent(match[1]) : undefined;
    }

    if (!token) return null;
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as any;
    if (!decoded || !decoded.sub) return null;

    return {
      customerId: String(decoded.sub),
      email: String(decoded.email || ''),
      name: String(decoded.name || ''),
    };
  } catch {
    return null;
  }
}

/**
 * Attaches the customer_token HTTP-only cookie to the response
 */
export function setCustomerSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * Clears the customer_token cookie upon logout
 */
export function clearCustomerSessionCookie(response: NextResponse) {
  response.cookies.set(CUSTOMER_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
