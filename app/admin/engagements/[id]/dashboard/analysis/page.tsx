/**
 * Admin preview of the manager detailed analysis page.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import { getDetailedAnalysisData } from '@/lib/engagement-dashboard';
import DetailedAnalysisView from '@/components/dashboard/DetailedAnalysisView';

export default async function EngagementAnalysisPage({
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
          href={`/admin/engagements/${params.id}`}
          className="text-sm text-orbit-green hover:underline inline-block"
        >
          ← Back to engagement
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <h3 className="text-base font-bold text-orbit-dark mb-1">Detailed analysis not ready</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Close the survey first, then return here to view the operational maturity assessment.
          </p>
        </div>
      </div>
    );
  }

  const data = await getDetailedAnalysisData(params.id);
  if (!data) notFound();

  return (
    <DetailedAnalysisView
      data={data}
      backHref={`/admin/engagements/${params.id}/dashboard`}
      showAnalysisBanner
    />
  );
}
