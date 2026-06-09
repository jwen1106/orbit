import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { getManagerBenchmarkPageData } from '@/lib/benchmarks';
import BenchmarkComparisonView from '@/components/dashboard/BenchmarkComparisonView';

export default async function BenchmarksPage({
  searchParams,
}: {
  searchParams: { engagementId?: string };
}) {
  const session = await verifySession();
  if (!session) redirect('/');

  const data = await getManagerBenchmarkPageData(session.uid, searchParams.engagementId);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">Industry Benchmark Comparison</h1>
        <p className="text-sm text-gray-500">
          How your maturity scores compare to industry peers and best-in-class organisations
        </p>
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <h3 className="text-base font-bold text-orbit-dark mb-1">Benchmarks unavailable</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Benchmark comparisons will be available once your Oaklin consultant has closed the survey and results are ready.
          </p>
        </div>
      </div>
    );
  }

  return <BenchmarkComparisonView data={data} />;
}
