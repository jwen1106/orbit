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
  searchParams,
}: {
  params: { id: string };
  searchParams: { teamId?: string };
}) {
  const teamId = searchParams.teamId;
  const data = await getOrgDashboardData(params.id, teamId);
  if (!data) notFound();

  const { org, teams, dashboard } = data;
  const teamName = teams[0]?.name;

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
        {teamName && (
          <>
            <span className="text-gray-400">›</span>
            <span className="text-gray-500">{teamName}</span>
          </>
        )}
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
          analysisHref={`/admin/organisations/${org.id}/dashboard/analysis${teamId ? `?teamId=${teamId}` : ''}`}
          deltaHref={`/admin/organisations/${org.id}/dashboard/delta${teamId ? `?teamId=${teamId}` : ''}`}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <h3 className="text-base font-bold text-orbit-dark mb-1">No survey data yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            This team&apos;s survey needs to be closed before the dashboard is available.
          </p>
          <Link href="/admin/organisations" className="inline-block mt-4 text-sm text-orbit-green hover:underline font-semibold">
            ← Back to organisations
          </Link>
        </div>
      )}
    </div>
  );
}
