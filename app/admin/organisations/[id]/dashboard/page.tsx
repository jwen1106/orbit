/**
 * Admin preview of the manager dashboard for an organisation. Uses TeamDashboardView —
 * identical to /dashboard for the team manager once their survey is closed.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrgDashboardData } from '@/lib/engagement-dashboard';
import TeamDashboardView from '@/components/dashboard/TeamDashboardView';

export default async function OrgDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getOrgDashboardData(params.id);
  if (!data) notFound();

  const { org, teams, dashboard } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/organisations" className="text-orbit-green hover:underline">
          Organisations
        </Link>
        <span className="text-gray-400">›</span>
        <Link href={`/admin/organisations/${org.id}`} className="text-orbit-green hover:underline">
          {org.name}
        </Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-500">Dashboard</span>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <h3 className="text-base font-bold text-orbit-dark mb-1">No teams yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Add a team to this organisation before viewing the dashboard.
          </p>
          <Link
            href={`/admin/organisations/${org.id}`}
            className="inline-block mt-4 text-sm text-orbit-green hover:underline font-semibold"
          >
            ← Back to organisation
          </Link>
        </div>
      ) : dashboard ? (
        <TeamDashboardView
          data={dashboard}
          showAnalysisBanner
          analysisHref={`/admin/organisations/${org.id}/dashboard/analysis`}
          deltaHref={`/admin/organisations/${org.id}/dashboard/delta`}
        />
      ) : null}
    </div>
  );
}
