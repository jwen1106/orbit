import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import type { Engagement, Team, Organisation, Respondent } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin(req);
    const { id } = params;

    const [engDoc, respondentsSnap] = await Promise.all([
      adminDb.collection('engagements').doc(id).get(),
      adminDb.collection('engagements').doc(id).collection('respondents').get(),
    ]);

    if (!engDoc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const engagement = { id: engDoc.id, ...engDoc.data() } as Engagement;

    const [teamDoc, orgDoc] = await Promise.all([
      adminDb.collection('teams').doc(engagement.teamId).get(),
      adminDb.collection('organisations').doc(engagement.organisationId).get(),
    ]);

    const respondents = respondentsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Respondent))
      .sort((a, b) => {
        const roleOrder = a.role.localeCompare(b.role);
        if (roleOrder !== 0) return roleOrder;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      ...engagement,
      teamName: (teamDoc.data() as Team)?.name ?? '—',
      orgName: (orgDoc.data() as Organisation)?.name ?? '—',
      respondents,
    });
  } catch (err) {
    console.error('[engagements/[id] GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
