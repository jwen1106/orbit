import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import type { Respondent } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function getInviteRespondent(engagementId: string, respondentId: string) {
  const ref = adminDb
    .collection('engagements')
    .doc(engagementId)
    .collection('respondents')
    .doc(respondentId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.accessMethod !== 'email_invite' || data.role !== 'member') return null;
  return { ref, data: { id: doc.id, ...data } as Respondent };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; respondentId: string } },
) {
  try {
    await requireAdmin(req);
    const engDoc = await adminDb.collection('engagements').doc(params.id).get();
    if (!engDoc.exists || engDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Engagement is not active' }, { status: 400 });
    }

    const respondent = await getInviteRespondent(params.id, params.respondentId);
    if (!respondent) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const { email, name } = await req.json();
    const updates: Record<string, string> = {};
    if (email?.trim()) updates.email = email.trim();
    if (name?.trim()) updates.name = name.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Email or name is required' }, { status: 400 });
    }

    await respondent.ref.update(updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[respondents PATCH]', err);
    return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; respondentId: string } },
) {
  try {
    await requireAdmin(req);
    const engDoc = await adminDb.collection('engagements').doc(params.id).get();
    if (!engDoc.exists || engDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Engagement is not active' }, { status: 400 });
    }

    const respondent = await getInviteRespondent(params.id, params.respondentId);
    if (!respondent) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (respondent.data.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot remove someone who has already completed the survey' },
        { status: 400 },
      );
    }

    const responsesSnap = await respondent.ref.collection('responses').get();
    const batch = adminDb.batch();
    responsesSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(respondent.ref);
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[respondents DELETE]', err);
    return NextResponse.json({ error: 'Failed to remove invite' }, { status: 500 });
  }
}
