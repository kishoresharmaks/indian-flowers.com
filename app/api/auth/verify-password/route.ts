import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || '957878443V@';

    if (password === ADMIN_PASS) {
      return NextResponse.json({ success: true, message: 'Password verified' });
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
