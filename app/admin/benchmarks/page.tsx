import { adminDb } from '@/lib/firebase-admin';
import Card from '@/components/ui/Card';
import type { Benchmark } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

async function getBenchmarks() {
  const snap = await adminDb.collection('benchmarks').orderBy('industry').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Benchmark));
}

export default async function BenchmarksPage() {
  const benchmarks = await getBenchmarks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">Benchmarks</h1>
        <p className="text-sm text-gray-500 mt-1">
          {benchmarks.length} benchmark record{benchmarks.length !== 1 ? 's' : ''} — seeded by Oaklin, supplemented by AI where gaps exist
        </p>
      </div>

      {benchmarks.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No benchmark data seeded yet.</p>
            <p className="text-sm">Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">npm run seed:benchmarks</code> to populate.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Industry</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Function</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Size</th>
                {(['people_relationships', 'growth_impact', 'purpose_alignment'] as const).map((c) => (
                  <th key={c} className="px-4 py-3 text-center font-semibold text-gray-600 text-xs">
                    {COMPETENCY_LABELS[c]}
                    <br />
                    <span className="text-2xs text-gray-400 font-normal">Avg / Best</span>
                  </th>
                ))}
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Source</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((bm) => (
                <tr key={bm.id} className="border-b border-gray-100 table-row-hover">
                  <td className="px-6 py-3 font-medium text-orbit-dark">{bm.industry}</td>
                  <td className="px-6 py-3 text-gray-600 capitalize">{bm.function}</td>
                  <td className="px-6 py-3 text-gray-600 text-xs">{bm.sizeRange}</td>
                  {(['people_relationships', 'growth_impact', 'purpose_alignment'] as const).map((c) => {
                    const scores = bm.competencyScores?.[c];
                    return (
                      <td key={c} className="px-4 py-3 text-center text-xs text-gray-700">
                        {scores
                          ? `${scores.industryAverage} / ${scores.bestInClass}`
                          : '—'}
                      </td>
                    );
                  })}
                  <td className="px-6 py-3">
                    <span
                      className={[
                        'text-xs font-semibold px-2 py-0.5 rounded',
                        bm.source === 'ai_supplemented'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-orbit-forest',
                      ].join(' ')}
                    >
                      {bm.source === 'ai_supplemented' ? 'AI' : 'Oaklin'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
