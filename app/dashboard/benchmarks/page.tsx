import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import Card from '@/components/ui/Card';
import type { Insights, Team, Organisation } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

async function getBenchmarkData(uid: string) {
  const teamsSnap = await adminDb.collection('teams').where('managerId', '==', uid).limit(1).get();
  if (teamsSnap.empty) return null;
  const team = { id: teamsSnap.docs[0].id, ...teamsSnap.docs[0].data() } as Team;

  const orgDoc = await adminDb.collection('organisations').doc(team.organisationId).get();
  const org = orgDoc.exists ? ({ id: orgDoc.id, ...orgDoc.data() } as Organisation) : null;

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

  return { team, org, insights: insightsDoc.data() as Insights };
}

export default async function BenchmarksPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const data = await getBenchmarkData(session.uid);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">Industry Benchmarking</h1>
        <Card>
          <div className="text-center py-12 text-gray-500">
            Benchmark comparisons are available once your engagement has been analysed.
          </div>
        </Card>
      </div>
    );
  }

  const { team, org, insights } = data;
  const competencies = ['people_relationships', 'growth_impact', 'purpose_alignment'] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">Industry Benchmarking</h1>
        <p className="text-sm text-gray-500 mt-1">
          {org?.industry ?? 'Your industry'} · {team.function} office · {team.size} people
        </p>
      </div>

      {/* Benchmark comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {competencies.map((c) => {
          const bm = insights.benchmarkComparison?.[c];
          const score = insights.competencyScores[c];
          if (!bm) return null;
          const delta = bm.delta;
          const vsIndustry = delta;
          const vsBest = Math.round((score - bm.bestInClass) * 100) / 100;

          return (
            <Card key={c} padding="md">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
                {COMPETENCY_LABELS[c]}
              </p>

              {/* Score bar */}
              <div className="mb-6">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-bold text-orbit-forest">{score.toFixed(1)}</span>
                  <span className="text-sm text-gray-400 pb-1">/ 5</span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  {/* Best-in-class marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-orbit-amber"
                    style={{ left: `${(bm.bestInClass / 5) * 100}%` }}
                  />
                  {/* Industry average marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
                    style={{ left: `${(bm.industryAverage / 5) * 100}%` }}
                  />
                  {/* Your score */}
                  <div
                    className="h-3 bg-orbit-forest rounded-full"
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-2xs text-gray-400">
                  <span>0</span>
                  <span>5</span>
                </div>
              </div>

              {/* Benchmark figures */}
              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Your score</span>
                  <span className="font-bold text-orbit-forest">{score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Industry average</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-700">{bm.industryAverage.toFixed(1)}</span>
                    <span
                      className={[
                        'text-xs font-bold',
                        vsIndustry >= 0 ? 'text-orbit-green' : 'text-red-600',
                      ].join(' ')}
                    >
                      ({vsIndustry >= 0 ? '+' : ''}{vsIndustry.toFixed(1)})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    Best in class
                    <span className="w-2 h-2 rounded-full bg-orbit-amber inline-block" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-orbit-amber">{bm.bestInClass.toFixed(1)}</span>
                    <span
                      className={[
                        'text-xs font-bold',
                        vsBest >= 0 ? 'text-orbit-green' : 'text-amber-600',
                      ].join(' ')}
                    >
                      ({vsBest >= 0 ? '+' : ''}{vsBest.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Context note */}
      <Card padding="md" className="bg-green-50 border-orbit-green/20">
        <p className="text-sm text-orbit-dark">
          <strong className="text-orbit-forest">Benchmark context:</strong> Scores are compared against{' '}
          {org?.industry ?? 'industry'} peers at similar team size and function.
          Best-in-class figures represent the top quartile. Where specific peer data is unavailable,
          Oaklin uses AI-generated benchmarks based on comparable organisations.
        </p>
      </Card>
    </div>
  );
}
