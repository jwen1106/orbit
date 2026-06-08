import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import Card from '@/components/ui/Card';
import type { Insights, Team } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

async function getDeltaData(uid: string) {
  const teamsSnap = await adminDb
    .collection('teams')
    .where('managerId', '==', uid)
    .limit(1)
    .get();
  if (teamsSnap.empty) return null;
  const team = { id: teamsSnap.docs[0].id, ...teamsSnap.docs[0].data() } as Team;

  const engSnap = await adminDb
    .collection('engagements')
    .where('teamId', '==', team.id)
    .where('status', '==', 'analysed')
    .orderBy('analysedAt', 'desc')
    .limit(1)
    .get();
  if (engSnap.empty) return null;

  const insightsDoc = await adminDb.collection('insights').doc(engSnap.docs[0].id).get();
  if (!insightsDoc.exists) return null;

  return { team, insights: insightsDoc.data() as Insights };
}

function DeltaBar({ manager, member, label }: { manager: number; member: number; label: string }) {
  const gap = Math.abs(manager - member);
  const isAligned = gap < 0.5;
  const maxScore = 5;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-orbit-dark">{label}</span>
        <span
          className={[
            'text-xs font-bold px-2 py-0.5 rounded',
            isAligned
              ? 'bg-green-100 text-orbit-forest'
              : gap >= 1
              ? 'bg-red-50 text-red-700'
              : 'bg-amber-50 text-amber-700',
          ].join(' ')}
        >
          {gap < 0.1 ? 'Aligned' : `${gap.toFixed(1)} gap`}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-16">Manager</span>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-5 bg-orbit-forest rounded flex items-center justify-end pr-1.5 transition-all"
              style={{ width: `${(manager / maxScore) * 100}%` }}
            >
              <span className="text-2xs font-bold text-white">{manager.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-16">Members</span>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-5 bg-orbit-amber rounded flex items-center justify-end pr-1.5 transition-all"
              style={{ width: `${(member / maxScore) * 100}%` }}
            >
              <span className="text-2xs font-bold text-white">{member.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DeltaPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const data = await getDeltaData(session.uid);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">Delta Analysis</h1>
        <Card>
          <div className="text-center py-12 text-gray-500">
            Results will be available once your engagement has been analysed.
          </div>
        </Card>
      </div>
    );
  }

  const { insights } = data;
  const competencies = ['people_relationships', 'growth_impact', 'purpose_alignment'] as const;

  const totalManagerGap = competencies.reduce(
    (sum, c) => sum + Math.abs(insights.managerScores[c] - insights.memberScores[c]),
    0,
  ) / 3;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">Delta Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manager perspective vs team member perspective — where the gaps are
        </p>
      </div>

      {/* Overall alignment callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-gray-500 mb-1">Average perception gap</p>
          <p
            className={[
              'text-3xl font-bold',
              totalManagerGap < 0.5 ? 'text-orbit-green' : totalManagerGap >= 1 ? 'text-red-600' : 'text-orbit-amber',
            ].join(' ')}
          >
            {totalManagerGap.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {totalManagerGap < 0.5
              ? 'Good alignment across competencies'
              : totalManagerGap >= 1
              ? 'Significant gaps — priority focus needed'
              : 'Some areas of misalignment to address'}
          </p>
        </Card>
        {competencies.map((c) => {
          const gap = Math.abs(insights.managerScores[c] - insights.memberScores[c]);
          return (
            <Card key={c} padding="md">
              <p className="text-xs text-gray-500 mb-1">{COMPETENCY_LABELS[c]}</p>
              <p
                className={[
                  'text-xl font-bold',
                  gap < 0.5 ? 'text-orbit-green' : gap >= 1 ? 'text-red-600' : 'text-orbit-amber',
                ].join(' ')}
              >
                {gap < 0.1 ? 'Aligned' : `${gap.toFixed(1)} gap`}
              </p>
              <p className="text-xs text-gray-400">
                M: {insights.managerScores[c].toFixed(1)} · T: {insights.memberScores[c].toFixed(1)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Detailed competency bars */}
      <Card>
        <h2 className="text-base font-bold text-orbit-dark mb-6">Score comparison by competency</h2>
        <div className="space-y-8">
          {competencies.map((c) => (
            <DeltaBar
              key={c}
              label={COMPETENCY_LABELS[c]}
              manager={insights.managerScores[c]}
              member={insights.memberScores[c]}
            />
          ))}
        </div>
        <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-sm bg-orbit-forest" />
            Manager view
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-sm bg-orbit-amber" />
            Team member view
          </div>
        </div>
      </Card>

      {/* AI interpretation */}
      {insights.aiSummary && (
        <Card>
          <h2 className="text-base font-bold text-orbit-dark mb-3">AI interpretation</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{insights.aiSummary}</p>
        </Card>
      )}
    </div>
  );
}
