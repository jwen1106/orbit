/**
 * Manager home after login (/dashboard). Renders TeamDashboardView — the same first
 * dashboard page client team managers see once their engagement survey is closed.
 */
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { getManagerDashboardData } from '@/lib/engagement-dashboard';
import TeamDashboardView from '@/components/dashboard/TeamDashboardView';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { engagementId?: string };
}) {
  const session = await verifySession();
  if (!session) redirect('/');

  const result = await getManagerDashboardData(session.uid, searchParams.engagementId);

  if (!result) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-orbit-dark mb-1">No team assigned yet</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Your Oaklin consultant will set up your team engagement. Check back soon.
        </p>
      </div>
    );
  }

  const { team, dashboard, latestEngagement, surveys, selectedSurveyId } = result;

  const engagementQuery = selectedSurveyId ? `?engagementId=${selectedSurveyId}` : '';

  if (!dashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">HPT Diagnostic Tool</h1>
          <p className="text-sm text-gray-500 mt-1">
            Current assessment across operational pillars and competencies
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 px-8 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orbit-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-orbit-dark mb-1">Results pending</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Your dashboard will unlock once your Oaklin consultant has closed the survey for{' '}
            <span className="font-semibold text-orbit-dark">{team.name}</span>.
          </p>
          {latestEngagement?.status === 'active' && (
            <p className="text-xs text-orbit-green font-semibold mt-3">
              Survey is still live — results will appear when it is closed
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <TeamDashboardView
      data={dashboard}
      deltaHref={`/dashboard/delta${engagementQuery}`}
      analysisHref={`/dashboard/analysis${engagementQuery}`}
      surveys={surveys}
      selectedSurveyId={selectedSurveyId ?? undefined}
      surveyPickerBaseUrl="/dashboard"
    />
  );
}
