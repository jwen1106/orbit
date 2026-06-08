import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = decoded.role as string;
    return NextResponse.json({ uid: decoded.uid, role, email: decoded.email });
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
