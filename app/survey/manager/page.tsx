import { adminDb } from '@/lib/firebase-admin';
import { notFound, redirect } from 'next/navigation';
import SurveyFlow from '@/components/survey/SurveyFlow';
import type { Question, Engagement } from '@/types';

interface Props {
  searchParams: { token?: string };
}

async function getManagerSurveyData(token: string) {
  const snap = await adminDb
    .collection('engagements')
    .where('managerSurveyToken', '==', token)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  if (snap.empty) return null;

  const engDoc = snap.docs[0];
  const engagement = { id: engDoc.id, ...engDoc.data() } as Engagement;

  // Check if manager respondent already exists and completed
  const existing = await adminDb
    .collection('engagements').doc(engagement.id)
    .collection('respondents')
    .where('role', '==', 'manager')
    .limit(1)
    .get();

  if (!existing.empty && existing.docs[0].data().status === 'completed') {
    return { completed: true };
  }

  const existingRespondentId = existing.empty ? null : existing.docs[0].id;

  const questionsSnap = await adminDb
    .collection('questions')
    .where('version', '==', engagement.questionSetVersion)
    .where('isActive', '==', true)
    .get();

  const questions = questionsSnap.docs
    .map((d): Question => {
      const r = d.data();
      return {
        id: d.id,
        version: r.version ?? '',
        competency: r.competency,
        role: r.role,
        order: r.order ?? 0,
        text: r.text ?? '',
        subtext: r.subtext ?? undefined,
        criteria: r.criteria ?? {},
        isActive: r.isActive ?? true,
        assignedOrganisationIds: r.assignedOrganisationIds ?? [],
      };
    })
    .filter((q) => {
      if (q.role !== 'manager' && q.role !== 'both') return false;
      const assigned = q.assignedOrganisationIds ?? [];
      return assigned.length === 0 || assigned.includes(engagement.organisationId);
    })
    .sort((a, b) => {
      const order = ['people_relationships', 'growth_impact', 'purpose_alignment'];
      const ci = order.indexOf(a.competency) - order.indexOf(b.competency);
      if (ci !== 0) return ci;
      return a.order - b.order;
    });

  return { engagement, questions, existingRespondentId };
}

export default async function ManagerSurveyPage({ searchParams }: Props) {
  const { token } = searchParams;
  if (!token) notFound();

  const data = await getManagerSurveyData(token);
  if (!data) redirect('/survey/invalid');
  if ('completed' in data && data.completed) redirect('/survey/complete');

  const { engagement, questions, existingRespondentId } = data as {
    engagement: Engagement;
    questions: Question[];
    existingRespondentId: string | null;
  };

  return (
    <SurveyFlow
      engagementId={engagement.id}
      respondentId={existingRespondentId}
      token={token}
      accessMethod="email_invite"
      role="manager"
      questions={questions}
    />
  );
}
