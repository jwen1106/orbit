import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { sendManagerDashboardInvite } from '@/lib/email';

export const dynamic = 'force-dynamic';

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const cookieValue = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return false;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookieValue, true);
    return decoded.role === 'oaklin_admin';
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const teamDoc = await adminDb.collection('teams').doc(params.id).get();
    if (!teamDoc.exists) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const managerId = teamDoc.data()?.managerId;
    if (!managerId) return NextResponse.json({ error: 'No manager assigned to this team' }, { status: 400 });

    const userDoc = await adminDb.collection('users').doc(managerId).get();
    if (!userDoc.exists) return NextResponse.json({ error: 'Manager user not found' }, { status: 404 });

    const { email, displayName } = userDoc.data()!;
    await sendManagerDashboardInvite(email, displayName);

    return NextResponse.json({ ok: true, sentTo: email });
  } catch (err) {
    console.error('[teams/[id]/invite POST]', err);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
