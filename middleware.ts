import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = '__session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (!isAdminRoute && !isDashboardRoute) {
    return NextResponse.next();
  }

  // No session at all — send to login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const verifyUrl = new URL('/api/auth/verify', request.url);
    const verifyRes = await fetch(verifyUrl, {
      headers: { cookie: `${SESSION_COOKIE}=${sessionCookie}` },
    });

    if (!verifyRes.ok) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { role } = await verifyRes.json();

    // Admin trying to access /dashboard/* — send to admin home
    if (isDashboardRoute && role === 'oaklin_admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Team manager trying to access /admin/* — send to their dashboard
    if (isAdminRoute && role === 'team_manager') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Unknown role — send to login
    if (isAdminRoute && role !== 'oaklin_admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (isDashboardRoute && role !== 'team_manager') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
