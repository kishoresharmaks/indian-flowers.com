import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Block direct IP access (e.g., http://75.119.146.87)
  // Allow localhost / 127.0.0.1 for server-internal health checks
  const isDirectIp = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(host);
  if (isDirectIp && !host.startsWith('127.0.0.1') && !host.startsWith('localhost')) {
    return new NextResponse('Direct IP access is not allowed. Please visit https://indian-flowers.com', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken =
      request.cookies.get('admin_token')?.value ||
      request.cookies.get('__Host-admin_token')?.value;

    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
