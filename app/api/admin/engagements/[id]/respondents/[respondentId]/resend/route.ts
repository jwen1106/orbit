import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { sendMemberInvite } from '@/lib/email';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; respondentId: string } },
) {
  try {
    await requireAdmin(req);
    const engDoc = await adminDb.collection('engagements').doc(params.id).get();
    if (!engDoc.exists || engDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Engagement is not active' }, { status: 400 });
    }

    const ref = adminDb
      .collection('engagements')
      .doc(params.id)
      .collection('respondents')
      .doc(params.respondentId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const data = doc.data()!;
    if (data.accessMethod !== 'email_invite' || data.role !== 'member') {
      return NextResponse.json({ error: 'Not an email invitation' }, { status: 400 });
    }

    const email = data.email as string;
    const name = data.name as string;
    if (!email) {
      return NextResponse.json({ error: 'No email address on record' }, { status: 400 });
    }

    const surveyUrl = `${BASE_URL}/survey/member?token=${data.inviteToken}&respondentId=${params.respondentId}&engagementId=${params.id}`;

    try {
      await sendMemberInvite(email, name, surveyUrl);
    } catch (emailErr) {
      console.warn('[respondents resend]', emailErr);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sentTo: email });
  } catch (err) {
    console.error('[respondents resend POST]', err);
    return NextResponse.json({ error: 'Failed to resend invite' }, { status: 500 });
  }
}
