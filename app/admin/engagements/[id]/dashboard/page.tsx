/**
 * Admin preview of the manager dashboard. Uses TeamDashboardView — identical to /dashboard
 * for the team manager once the engagement survey is closed.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEngagementDashboardData } from '@/lib/engagement-dashboard';
import TeamDashboardView from '@/components/dashboard/TeamDashboardView';

export default async function EngagementDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getEngagementDashboardData(params.id);
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/admin/engagements/${params.id}`}
        className="text-sm text-orbit-green hover:underline inline-block"
      >
        ← Back to engagement
      </Link>
      <TeamDashboardView
        data={data}
        showAnalysisBanner
        analysisHref={`/admin/engagements/${params.id}/dashboard/analysis`}
      />
    </div>
  );
}
