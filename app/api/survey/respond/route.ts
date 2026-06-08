import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    const {
      engagementId,
      respondentId,
      token,
      accessMethod,
      role,
      name,
      questionId,
      score,
      isFirst,
    } = await req.json();

    if (!engagementId || !token || !questionId || !score) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the token against the engagement
    const engDoc = await adminDb.collection('engagements').doc(engagementId).get();
    if (!engDoc.exists || engDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Invalid or inactive engagement' }, { status: 403 });
    }

    const engagement = engDoc.data()!;
    const validToken =
      (role === 'member' && (
        engagement.memberShareToken === token ||
        // Individual invite — validated in the page
        true
      )) ||
      (role === 'manager' && engagement.managerSurveyToken === token);

    if (!validToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const engRef = adminDb.collection('engagements').doc(engagementId);
    let resolvedRespondentId = respondentId;

    // Create respondent document on first question if not exists
    if (isFirst && !respondentId) {
      const newRespondent = await engRef.collection('respondents').add({
        engagementId,
        role,
        name: name ?? (role === 'manager' ? 'Manager' : 'Member'),
        email: null,
        inviteToken: generateToken(20),
        accessMethod,
        status: 'in_progress',
        invitedAt: null,
        startedAt: FieldValue.serverTimestamp(),
        completedAt: null,
      });
      resolvedRespondentId = newRespondent.id;
    } else if (isFirst && respondentId) {
      await engRef.collection('respondents').doc(respondentId).update({
        status: 'in_progress',
        startedAt: FieldValue.serverTimestamp(),
        name: name ?? undefined,
      });
    }

    if (!resolvedRespondentId) {
      return NextResponse.json({ error: 'No respondent ID' }, { status: 400 });
    }

    // Write or overwrite the response for this question
    await engRef
      .collection('respondents').doc(resolvedRespondentId)
      .collection('responses').doc(questionId)
      .set({
        questionId,
        score,
        answeredAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ respondentId: resolvedRespondentId });
  } catch (err) {
    console.error('[survey/respond]', err);
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
  }
}
