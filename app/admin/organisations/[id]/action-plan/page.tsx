import { adminDb } from '@/lib/firebase-admin';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import type { Organisation } from '@/types';
import ActionPlanView from '@/components/admin/ActionPlanView';
import type { SerializedActionItem, SerializedTeam } from '@/components/admin/ActionPlanView';

async function getData(orgId: string) {
  const [orgDoc, teamsSnap] = await Promise.all([
    adminDb.collection('organisations').doc(orgId).get(),
    adminDb.collection('teams').where('organisationId', '==', orgId).get(),
  ]);

  if (!orgDoc.exists) return null;

  const org = { id: orgDoc.id, ...orgDoc.data() } as Organisation;

  // Serialize teams — strip Timestamp fields so they can be passed to a Client Component
  const teams: SerializedTeam[] = teamsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? '',
      organisationId: data.organisationId ?? orgId,
      function: data.function ?? 'front',
      size: data.size ?? 0,
      managerId: data.managerId ?? '',
    };
  });

  const teamIds = teams.map((t) => t.id);
  let actions: SerializedActionItem[] = [];

  if (teamIds.length > 0) {
    const actionSnaps = await Promise.all(
      teamIds.map((tid) =>
        adminDb.collection('actionItems').where('teamId', '==', tid).get(),
      ),
    );
    actions = actionSnaps
      .flatMap((snap) =>
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title ?? '',
            description: data.description ?? '',
            competency: data.competency ?? 'people_relationships',
            timeframe: data.timeframe ?? 'short_term',
            teamId: data.teamId ?? '',
            organisationId: data.organisationId ?? orgId,
            assignedTo: data.assignedTo ?? '',
            completionPct: data.completionPct ?? 0,
            comments: data.comments ?? '',
            status: data.status ?? 'not_started',
            source: data.source ?? 'manual',
            priority: data.priority ?? 0,
          } as SerializedActionItem;
        }),
      )
      .sort((a, b) => a.priority - b.priority);
  }

  return { org, teams, actions };
}

export default async function OrgActionPlanPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireAdmin();
  } catch {
    redirect('/login');
  }

  const data = await getData(params.id);
  if (!data) notFound();
  const { org, teams, actions } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/organisations" className="text-sm text-orbit-green hover:underline">
          ← Organisations
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-1">Action Plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {org.name} · Define specific, measurable actions tied to maturity assessment results
        </p>
      </div>

      <ActionPlanView
        orgId={org.id}
        orgName={org.name}
        teams={teams}
        initialActions={actions}
      />
    </div>
  );
}
