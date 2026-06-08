import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { adminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const doc = await adminDb.collection('organisations').doc(params.id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[organisations/[id] GET]', err);
    return NextResponse.json({ error: 'Failed to fetch organisation' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const { name, industry } = await req.json();
    if (!name?.trim() || !industry?.trim()) {
      return NextResponse.json({ error: 'Name and industry are required' }, { status: 400 });
    }
    await adminDb.collection('organisations').doc(params.id).update({
      name: name.trim(),
      industry: industry.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[organisations/[id] PUT]', err);
    return NextResponse.json({ error: 'Failed to update organisation' }, { status: 500 });
  }
}
