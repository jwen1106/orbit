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
  searchParams: { teamId?: string; engagementId?: string };
}) {
  const { teamId, engagementId } = searchParams;
  const data = await getOrgDashboardData(params.id, teamId, engagementId);
  if (!data) notFound();

  const { org, teams, dashboard, engagements } = data;
  const teamName = teams[0]?.name;
  const selectedId = engagementId ?? engagements[0]?.id;

  const baseUrl = `/admin/organisations/${params.id}/dashboard${teamId ? `?teamId=${teamId}` : ''}`;
  const engagementQuery = selectedId
    ? `${teamId ? '&' : '?'}engagementId=${selectedId}`
    : '';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
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
          <Link href={`/admin/organisations/${org.id}`} className="inline-block mt-4 text-sm text-orbit-green hover:underline font-semibold">
            ← Back to organisation
          </Link>
        </div>
      ) : engagements.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <h3 className="text-base font-bold text-orbit-dark mb-1">No survey results yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Results appear here once at least one team member has completed the survey.
          </p>
          <Link href="/admin/organisations" className="inline-block mt-4 text-sm text-orbit-green hover:underline font-semibold">
            ← Back to organisations
          </Link>
        </div>
      ) : (
        <>
          {dashboard ? (
            <TeamDashboardView
              data={dashboard}
              showAnalysisBanner
              surveys={engagements.map((e) => ({ id: e.id, title: e.title }))}
              selectedSurveyId={selectedId}
              surveyPickerBaseUrl={baseUrl}
              analysisHref={`/admin/organisations/${params.id}/dashboard/analysis${teamId ? `?teamId=${teamId}` : ''}${engagementQuery}`}
              deltaHref={`/admin/organisations/${params.id}/dashboard/delta${teamId ? `?teamId=${teamId}` : ''}${engagementQuery}`}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
              <h3 className="text-base font-bold text-orbit-dark mb-1">No data for this survey</h3>
              <p className="text-sm text-gray-500">Select a different survey from the dropdown in the header.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
