import { adminDb } from '@/lib/firebase-admin';
import { notFound, redirect } from 'next/navigation';
import SurveyFlow from '@/components/survey/SurveyFlow';
import type { Question, Respondent, Engagement } from '@/types';

interface Props {
  searchParams: {
    token?: string;
    respondentId?: string;
    engagementId?: string;
    preName?: string;
    preEmail?: string;
  };
}

async function resolveToken(
  token: string,
  respondentId?: string,
  engagementId?: string,
): Promise<{
  engagement: Engagement;
  respondent: Respondent | null;
  questions: Question[];
} | null> {
  // If we have explicit engagementId and respondentId (individual invite)
  if (engagementId && respondentId) {
    const [engDoc, respondentDoc] = await Promise.all([
      adminDb.collection('engagements').doc(engagementId).get(),
      adminDb
        .collection('engagements').doc(engagementId)
        .collection('respondents').doc(respondentId).get(),
    ]);
    if (!engDoc.exists || !respondentDoc.exists) return null;
    const eng = { id: engDoc.id, ...engDoc.data() } as Engagement;
    const respondent = { id: respondentDoc.id, ...respondentDoc.data() } as Respondent;
    if (respondent.inviteToken !== token) return null;
    if (eng.status !== 'active') return null;
    const questions = await getQuestions(eng.questionSetVersion, 'member', eng.organisationId);
    return { engagement: eng, respondent, questions };
  }

  // Shared link — find engagement by memberShareToken
  const snap = await adminDb
    .collection('engagements')
    .where('memberShareToken', '==', token)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  if (snap.empty) return null;
  const engDoc = snap.docs[0];
  const eng = { id: engDoc.id, ...engDoc.data() } as Engagement;
  const questions = await getQuestions(eng.questionSetVersion, 'member', eng.organisationId);
  return { engagement: eng, respondent: null, questions };
}

async function getQuestions(version: string, role: 'member' | 'manager', organisationId: string) {
  const snap = await adminDb
    .collection('questions')
    .where('version', '==', version)
    .where('isActive', '==', true)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Question))
    .filter((q) => {
      if (q.role !== role && q.role !== 'both') return false;
      // Global questions (empty array) show to everyone; otherwise check if org is assigned
      const assigned: string[] = q.assignedOrganisationIds ?? [];
      return assigned.length === 0 || assigned.includes(organisationId);
    })
    .sort((a, b) => {
      const cmpOrder = ['people_relationships', 'growth_impact', 'purpose_alignment'];
      const ci = cmpOrder.indexOf(a.competency) - cmpOrder.indexOf(b.competency);
      if (ci !== 0) return ci;
      return a.order - b.order;
    });
}

export default async function MemberSurveyPage({ searchParams }: Props) {
  const { token, respondentId, engagementId, preName, preEmail } = searchParams;
  if (!token) notFound();

  const data = await resolveToken(token, respondentId, engagementId);
  if (!data) {
    redirect('/survey/invalid');
  }

  const { engagement, respondent, questions } = data;

  if (respondent?.status === 'completed') {
    redirect('/survey/complete');
  }

  if (questions.length === 0) {
    redirect('/survey/invalid');
  }

  return (
    <SurveyFlow
      engagementId={engagement.id}
      respondentId={respondent?.id ?? null}
      token={token}
      accessMethod={respondent ? 'email_invite' : 'shared_link'}
      role="member"
      questions={questions}
      preName={preName}
      preEmail={preEmail}
    />
  );
}
