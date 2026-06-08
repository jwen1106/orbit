import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { ActionItem, Engagement } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

async function getActionItems(engagementId: string) {
  const [engDoc, actionsSnap] = await Promise.all([
    adminDb.collection('engagements').doc(engagementId).get(),
    adminDb
      .collection('actionItems')
      .where('engagementId', '==', engagementId)
      .orderBy('timeframe')
      .orderBy('priority')
      .get(),
  ]);
  if (!engDoc.exists) return null;
  const engagement = { id: engDoc.id, ...engDoc.data() } as Engagement;
  const actions = actionsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ActionItem));
  return { engagement, actions };
}

export default async function AdminActionsPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getActionItems(params.id);
  if (!data) notFound();
  const { engagement, actions } = data;

  const shortTerm = actions.filter((a) => a.timeframe === 'short_term');
  const longTerm = actions.filter((a) => a.timeframe === 'long_term');

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link
          href={`/admin/engagements/${engagement.id}`}
          className="text-sm text-orbit-green hover:underline"
        >
          ← Engagement
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-1">Action Plan</h1>
        <p className="text-sm text-gray-500">
          {actions.length} actions · {actions.filter((a) => a.status === 'complete').length} complete
        </p>
      </div>

      {actions.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">No actions generated yet.</div>
        </Card>
      ) : (
        <>
          {shortTerm.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-orbit-dark uppercase tracking-wide mb-3">
                Short-term wins ({shortTerm.length})
              </h2>
              <div className="space-y-3">
                {shortTerm.map((a) => <AdminActionRow key={a.id} action={a} />)}
              </div>
            </div>
          )}
          {longTerm.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-orbit-dark uppercase tracking-wide mb-3">
                Strategic initiatives ({longTerm.length})
              </h2>
              <div className="space-y-3">
                {longTerm.map((a) => <AdminActionRow key={a.id} action={a} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdminActionRow({ action }: { action: ActionItem }) {
  const competencyBadgeMap: Record<string, 'people' | 'growth' | 'purpose'> = {
    people_relationships: 'people',
    growth_impact: 'growth',
    purpose_alignment: 'purpose',
  };

  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant={action.timeframe} />
            <Badge
              variant={competencyBadgeMap[action.competency] ?? 'people'}
              label={COMPETENCY_LABELS[action.competency as keyof typeof COMPETENCY_LABELS]}
            />
            <Badge variant={action.status} />
          </div>
          <p className="font-bold text-orbit-dark text-sm">{action.title}</p>
          <p className="text-xs text-gray-500 mt-1">{action.description}</p>
          {action.assignedTo && (
            <p className="text-xs text-gray-400 mt-1">
              Owner: <span className="font-medium">{action.assignedTo}</span>
            </p>
          )}
        </div>
        <span className="text-xs text-gray-300">#{action.priority}</span>
      </div>
    </Card>
  );
}
