import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const ref = adminDb.collection('engagements').doc(params.id);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (doc.data()?.status !== 'draft') {
      return NextResponse.json({ error: 'Engagement is not in draft status' }, { status: 400 });
    }
    await ref.update({ status: 'active', activatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[activate]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
