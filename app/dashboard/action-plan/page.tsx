import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { ActionItem, Team } from '@/types';
import ActionPlanClient from '@/components/dashboard/ActionPlanClient';

async function getActionPlanData(uid: string) {
  const teamsSnap = await adminDb.collection('teams').where('managerId', '==', uid).limit(1).get();
  if (teamsSnap.empty) return null;
  const team = { id: teamsSnap.docs[0].id, ...teamsSnap.docs[0].data() } as Team;

  const actionsSnap = await adminDb
    .collection('actionItems')
    .where('teamId', '==', team.id)
    .orderBy('timeframe')
    .orderBy('priority')
    .get();

  const actions = actionsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    dueDate: d.data().dueDate?.toDate?.()?.toISOString() ?? null,
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
    updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() ?? null,
  })) as (ActionItem & { dueDate: string | null; createdAt: string | null; updatedAt: string | null })[];

  return { team, actions };
}

export default async function ActionPlanPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const data = await getActionPlanData(session.uid);

  return <ActionPlanClient data={data} />;
}
