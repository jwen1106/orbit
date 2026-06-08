import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { generateToken } from '@/lib/tokens';
import { sendMemberInvite } from '@/lib/email';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const { name, email } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const engDoc = await adminDb.collection('engagements').doc(params.id).get();
    if (!engDoc.exists || engDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Engagement is not active' }, { status: 400 });
    }

    const inviteToken = generateToken(20);
    const respondentRef = await adminDb
      .collection('engagements')
      .doc(params.id)
      .collection('respondents')
      .add({
        engagementId: params.id,
        role: 'member',
        name: name.trim(),
        email: email.trim(),
        inviteToken,
        accessMethod: 'email_invite',
        status: 'invited',
        invitedAt: FieldValue.serverTimestamp(),
        startedAt: null,
        completedAt: null,
      });

    const surveyUrl = `${BASE_URL}/survey/member?token=${inviteToken}&respondentId=${respondentRef.id}&engagementId=${params.id}`;

    try {
      await sendMemberInvite(email.trim(), name.trim(), surveyUrl);
    } catch (emailErr) {
      console.warn('[invite] Email failed:', emailErr);
    }

    return NextResponse.json({ id: respondentRef.id });
  } catch (err) {
    console.error('[invite POST]', err);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
