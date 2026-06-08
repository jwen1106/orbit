import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME, SESSION_DURATION, createSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const role = decoded.role as string | undefined;
    if (!role || !['oaklin_admin', 'team_manager'].includes(role)) {
      return NextResponse.json(
        { error: 'Access denied. Your account has no platform role.' },
        { status: 403 },
      );
    }

    const sessionCookie = await createSessionCookie(idToken);

    const response = NextResponse.json({ role });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_DURATION / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[auth/session]', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
