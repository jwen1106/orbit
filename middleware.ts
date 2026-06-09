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

  // No session — send to home page (sign in via View Results card)
  if (!sessionCookie) {
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(homeUrl);
  }

  try {
    const verifyUrl = new URL('/api/auth/verify', request.url);
    const verifyRes = await fetch(verifyUrl, {
      headers: { cookie: `${SESSION_COOKIE}=${sessionCookie}` },
    });

    if (!verifyRes.ok) {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(homeUrl);
    }

    const { role } = await verifyRes.json();

    if (isDashboardRoute && role === 'oaklin_admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (isAdminRoute && role === 'team_manager') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isAdminRoute && role !== 'oaklin_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isDashboardRoute && role !== 'team_manager') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
