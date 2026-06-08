import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';
import type { UserRole } from '@/types';

const SESSION_COOKIE = '__session';
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });
}

async function decodeSession(cookieValue: string): Promise<{
  uid: string;
  role: UserRole;
  email: string;
} | null> {
  try {
    const decoded = await adminAuth.verifySessionCookie(cookieValue, true);
    const role = (decoded.role as UserRole) ?? null;
    if (!role) return null;
    return { uid: decoded.uid, role, email: decoded.email ?? '' };
  } catch {
    return null;
  }
}

/** Use in Server Components and POST/PATCH/DELETE route handlers */
export async function verifySession(): Promise<{
  uid: string;
  role: UserRole;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;
  return decodeSession(sessionCookie);
}

/** Use in GET route handlers — reads cookie directly from the request */
export async function verifySessionFromRequest(req: NextRequest): Promise<{
  uid: string;
  role: UserRole;
  email: string;
} | null> {
  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;
  return decodeSession(sessionCookie);
}

export async function requireAdmin(req?: NextRequest) {
  const session = req ? await verifySessionFromRequest(req) : await verifySession();
  if (!session || session.role !== 'oaklin_admin') {
    throw new Error('Unauthorised');
  }
  return session;
}

export async function requireManager(req?: NextRequest) {
  const session = req ? await verifySessionFromRequest(req) : await verifySession();
  if (!session || session.role !== 'team_manager') {
    throw new Error('Unauthorised');
  }
  return session;
}

export async function getManagerTeamId(uid: string): Promise<string | null> {
  const teamsSnap = await adminDb
    .collection('teams')
    .where('managerId', '==', uid)
    .limit(1)
    .get();
  if (teamsSnap.empty) return null;
  return teamsSnap.docs[0].id;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_DURATION = SESSION_DURATION_MS;
