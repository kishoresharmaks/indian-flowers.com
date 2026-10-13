import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function isAuthenticatedAdmin(req: NextRequest): boolean {
  const adminToken = req.cookies.get('admin_token')?.value;
  const secret = process.env.AUTH_SECRET;
  if (!adminToken || !secret) return false;
  try { return Boolean(jwt.verify(adminToken, secret)); } catch { return false; }
}

export function unauthenticatedResponse() {
  return NextResponse.json(
    { success: false, message: 'Unauthorized. Admin session required.' },
    { status: 401 }
  );
}
