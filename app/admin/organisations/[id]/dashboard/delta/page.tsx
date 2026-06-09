/**
 * Admin preview of the manager vs member delta analysis for an organisation.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrgDashboardData, getDetailedAnalysisData } from '@/lib/engagement-dashboard';
import DeltaAnalysisView from '@/components/dashboard/DeltaAnalysisView';

export default async function OrgDeltaPage({
  params,
}: {
  params: { id: string };
}) {
  const orgData = await getOrgDashboardData(params.id);
  if (!orgData?.dashboard) notFound();

  const data = await getDetailedAnalysisData(orgData.dashboard.engagementId);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/organisations" className="text-orbit-green hover:underline">
          Organisations
        </Link>
        <span className="text-gray-400">›</span>
        <Link href={`/admin/organisations/${params.id}`} className="text-orbit-green hover:underline">
          {orgData.org.name}
        </Link>
        <span className="text-gray-400">›</span>
        <Link
          href={`/admin/organisations/${params.id}/dashboard`}
          className="text-orbit-green hover:underline"
        >
          Dashboard
        </Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-500">Manager &amp; Member Analysis</span>
      </div>

      <DeltaAnalysisView data={data} />
    </div>
  );
}
