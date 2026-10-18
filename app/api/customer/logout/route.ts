import { NextResponse } from 'next/server';
import { clearCustomerSessionCookie } from '@/lib/customerAuth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Signed out successfully.' },
    { status: 200 }
  );
  clearCustomerSessionCookie(response);
  return response;
}
