import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Auth check — identical pattern to /api/auth/verify which is known to work
  const cookieValue = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  console.log('[questions GET] cookie present:', !!cookieValue);
  if (!cookieValue) {
    return NextResponse.json({ error: 'Unauthorised – no cookie' }, { status: 401 });
  }
  try {
    const decoded = await adminAuth.verifySessionCookie(cookieValue, true);
    console.log('[questions GET] role:', decoded.role);
    if (decoded.role !== 'oaklin_admin') {
      return NextResponse.json({ error: 'Unauthorised – wrong role' }, { status: 401 });
    }
  } catch (err) {
    console.error('[questions GET] session verify failed:', err);
    return NextResponse.json({ error: 'Unauthorised – invalid session' }, { status: 401 });
  }

  // Fetch questions
  try {
    const snap = await adminDb.collection('questions').get();
    const questions = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const cmpOrder = ['people_relationships', 'growth_impact', 'purpose_alignment'];
        const ci = cmpOrder.indexOf(a.competency as string) - cmpOrder.indexOf(b.competency as string);
        if (ci !== 0) return ci;
        return Number(a.order ?? 0) - Number(b.order ?? 0);
      });
    return NextResponse.json(questions);
  } catch (err) {
    console.error('[questions GET] Firestore error:', err);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const { text, subtext, competency, role, order, isActive, criteria, version, assignedOrganisationIds } = body;

    if (!text?.trim() || !competency || !role) {
      return NextResponse.json({ error: 'text, competency and role are required' }, { status: 400 });
    }

    const ref = await adminDb.collection('questions').add({
      version: version ?? 'v1',
      text: text.trim(),
      subtext: subtext?.trim() ?? '',
      competency,
      role,
      order: Number(order) || 1,
      isActive: isActive ?? true,
      criteria: criteria ?? {},
      assignedOrganisationIds: Array.isArray(assignedOrganisationIds) ? assignedOrganisationIds : [],
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error('[questions POST]', err);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
