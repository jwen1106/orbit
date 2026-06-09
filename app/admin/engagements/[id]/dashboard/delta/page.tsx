import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import { getDetailedAnalysisData } from '@/lib/engagement-dashboard';
import DeltaAnalysisView from '@/components/dashboard/DeltaAnalysisView';

export default async function EngagementDeltaPage({
  params,
}: {
  params: { id: string };
}) {
  const engDoc = await adminDb.collection('engagements').doc(params.id).get();
  if (!engDoc.exists) notFound();

  const status = engDoc.data()?.status;
  if (status === 'draft' || status === 'active') {
    return (
      <div className="space-y-4">
        <Link
          href={`/admin/engagements/${params.id}/dashboard`}
          className="text-sm text-orbit-green hover:underline inline-block"
        >
          ← Back to dashboard
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <h3 className="text-base font-bold text-orbit-dark mb-1">Analysis not ready</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Close the survey first, then return here to view the manager and member comparison.
          </p>
        </div>
      </div>
    );
  }

  const data = await getDetailedAnalysisData(params.id);
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/admin/engagements/${params.id}/dashboard`}
        className="text-sm text-orbit-green hover:underline inline-block"
      >
        ← Back to dashboard
      </Link>
      <DeltaAnalysisView data={data} />
    </div>
  );
}
