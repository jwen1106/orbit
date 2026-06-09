import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { Organisation } from '@/types';
import ActionPlanView from '@/components/admin/ActionPlanView';
import type { SerializedActionItem, SerializedTeam } from '@/components/admin/ActionPlanView';

async function getManagerActionPlanData(uid: string) {
  const teamsSnap = await adminDb.collection('teams').where('managerId', '==', uid).limit(1).get();
  if (teamsSnap.empty) return null;

  const teamDoc = teamsSnap.docs[0];
  const teamData = teamDoc.data();
  const orgId = teamData.organisationId as string;

  const orgDoc = await adminDb.collection('organisations').doc(orgId).get();
  if (!orgDoc.exists) return null;

  const org = { id: orgDoc.id, ...orgDoc.data() } as Organisation;

  const team: SerializedTeam = {
    id: teamDoc.id,
    name: teamData.name ?? '',
    organisationId: orgId,
    function: teamData.function ?? 'front',
    size: teamData.size ?? 0,
    managerId: teamData.managerId ?? uid,
  };

  const actionsSnap = await adminDb
    .collection('actionItems')
    .where('teamId', '==', teamDoc.id)
    .get();

  const actions: SerializedActionItem[] = actionsSnap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title ?? '',
        description: data.description ?? '',
        competency: data.competency ?? 'people_relationships',
        timeframe: data.timeframe ?? 'short_term',
        teamId: data.teamId ?? teamDoc.id,
        organisationId: data.organisationId ?? orgId,
        assignedTo: data.assignedTo ?? '',
        completionPct: data.completionPct ?? 0,
        comments: data.comments ?? '',
        status: data.status ?? 'not_started',
        source: data.source ?? 'manual',
        priority: data.priority ?? 0,
      } as SerializedActionItem;
    })
    .sort((a, b) => a.priority - b.priority);

  return { org, team, actions };
}

export default async function ActionPlanPage() {
  const session = await verifySession();
  if (!session) redirect('/');

  const data = await getManagerActionPlanData(session.uid);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">Action Plan</h1>
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center text-gray-500">
          No team assigned yet.
        </div>
      </div>
    );
  }

  const { org, team, actions } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-orbit-dark">Action Plan</h1>

      <ActionPlanView
        orgId={org.id}
        orgName={org.name}
        teams={[team]}
        initialActions={actions}
      />
    </div>
  );
}
