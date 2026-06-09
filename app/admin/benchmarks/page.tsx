import { adminDb } from '@/lib/firebase-admin';
import type { Benchmark } from '@/types';
import BenchmarksManager from '@/components/admin/BenchmarksManager';

async function getBenchmarks() {
  const snap = await adminDb.collection('benchmarks').orderBy('industry').get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : null,
    } as unknown as Benchmark;
  });
}

export default async function BenchmarksPage() {
  const benchmarks = await getBenchmarks();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">Benchmarks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {benchmarks.length} benchmark record{benchmarks.length !== 1 ? 's' : ''} — seeded by Oaklin, supplemented by AI where gaps exist.
            Edit rows inline or let AI generate competency scores.
          </p>
        </div>
      </div>

      <BenchmarksManager initialBenchmarks={benchmarks} />
    </div>
  );
}
