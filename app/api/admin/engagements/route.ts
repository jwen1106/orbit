import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { generateEngagementTokens } from '@/lib/tokens';
import { QUESTION_SET_VERSION } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { teamId, organisationId, title } = await req.json();
    if (!teamId || !organisationId) {
      return NextResponse.json({ error: 'teamId and organisationId are required' }, { status: 400 });
    }
    const { memberShareToken, managerSurveyToken } = generateEngagementTokens();
    const ref = await adminDb.collection('engagements').add({
      title: title?.trim() || null,
      teamId,
      organisationId,
      status: 'draft',
      memberShareToken,
      managerSurveyToken,
      questionSetVersion: QUESTION_SET_VERSION,
      createdAt: FieldValue.serverTimestamp(),
      activatedAt: null,
      closedAt: null,
      analysedAt: null,
      createdBy: session.uid,
    });
    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error('[admin/engagements POST]', err);
    return NextResponse.json({ error: 'Failed to create engagement' }, { status: 500 });
  }
}
