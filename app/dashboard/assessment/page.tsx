import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import Card from '@/components/ui/Card';
import RadarChartWrapper, { type WrapperDataPoint } from '@/components/charts/RadarChartWrapper';
import type { Insights, Team } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

async function getAssessmentData(uid: string) {
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

  const insightsDoc = await adminDb
    .collection('insights')
    .doc(engSnap.docs[0].id)
    .get();
  if (!insightsDoc.exists) return null;

  return { team, insights: insightsDoc.data() as Insights };
}

export default async function AssessmentPage() {
  const session = await verifySession();
  if (!session) redirect('/');

  const data = await getAssessmentData(session.uid);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">Operational Maturity Assessment</h1>
        <Card>
          <div className="text-center py-12 text-gray-500">
            Results will be available once your engagement has been analysed.
          </div>
        </Card>
      </div>
    );
  }

  const { team, insights } = data;

  const competencies = [
    'people_relationships',
    'growth_impact',
    'purpose_alignment',
  ] as const;

  const radarData: WrapperDataPoint[] = competencies.map((c) => ({
    subject: COMPETENCY_LABELS[c],
    overall: insights.competencyScores[c],
    manager: insights.managerScores[c],
    member: insights.memberScores[c],
    fullMark: 5,
  }));

  const overallScore =
    Object.values(insights.competencyScores).reduce((a, b) => a + b, 0) / 3;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">Operational Maturity Assessment</h1>
        <p className="text-sm text-gray-500 mt-1">
          {team.name} · {insights.respondentCount.manager + insights.respondentCount.member} respondents
        </p>
      </div>

      {/* Overall score callout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md" className="md:col-span-1 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Overall maturity score</p>
          <p className="text-5xl font-bold text-orbit-forest">{overallScore.toFixed(1)}</p>
          <p className="text-sm text-gray-400 mt-1">out of 5</p>
        </Card>
        <Card padding="none" className="md:col-span-3">
          <div className="p-6 pb-2">
            <h2 className="text-base font-bold text-orbit-dark mb-1">Spider diagram</h2>
            <p className="text-xs text-gray-500">
              Scores across three competencies — manager view versus member view
            </p>
          </div>
          <RadarChartWrapper data={radarData} />
        </Card>
      </div>

      {/* Per-competency breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {competencies.map((c) => {
          const score = insights.competencyScores[c];
          const managerScore = insights.managerScores[c];
          const memberScore = insights.memberScores[c];
          const bm = insights.benchmarkComparison?.[c];

          return (
            <Card key={c} padding="md">
              <h3 className="text-sm font-bold text-orbit-dark uppercase tracking-wide mb-4">
                {COMPETENCY_LABELS[c]}
              </h3>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-orbit-forest">{score.toFixed(1)}</span>
                <span className="text-sm text-gray-400">/ 5</span>
                {bm && (
                  <span
                    className={[
                      'text-xs font-semibold ml-auto',
                      bm.delta >= 0 ? 'text-orbit-green' : 'text-red-500',
                    ].join(' ')}
                  >
                    {bm.delta >= 0 ? '+' : ''}{bm.delta.toFixed(1)} vs avg
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Manager</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 bg-orbit-forest rounded-full"
                        style={{ width: `${(managerScore / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold text-orbit-forest w-6 text-right">
                      {managerScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Members</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 bg-orbit-amber rounded-full"
                        style={{ width: `${(memberScore / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold text-orbit-amber w-6 text-right">
                      {memberScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                {bm && (
                  <>
                    <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-xs text-gray-400">
                      <span>Industry avg</span>
                      <span className="font-semibold">{bm.industryAverage.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Best in class</span>
                      <span className="font-semibold text-orbit-green">{bm.bestInClass.toFixed(1)}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
