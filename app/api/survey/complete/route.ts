import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { engagementId, respondentId, token, role } = await req.json();
    if (!engagementId || !respondentId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const engDoc = await adminDb.collection('engagements').doc(engagementId).get();
    if (!engDoc.exists) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }

    const engagement = engDoc.data()!;
    const validToken =
      (role === 'manager' && engagement.managerSurveyToken === token) ||
      role === 'member';

    if (!validToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    await adminDb
      .collection('engagements').doc(engagementId)
      .collection('respondents').doc(respondentId)
      .update({
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[survey/complete]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
