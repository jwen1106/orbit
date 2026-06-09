/**
 * Manager detailed analysis — linked from "View for detailed analysis" on /dashboard.
 */
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { getManagerDashboardData, getDetailedAnalysisData } from '@/lib/engagement-dashboard';
import DetailedAnalysisView from '@/components/dashboard/DetailedAnalysisView';

export default async function ManagerAnalysisPage({
  searchParams,
}: {
  searchParams: { engagementId?: string };
}) {
  const session = await verifySession();
  if (!session) redirect('/');

  const managerData = await getManagerDashboardData(session.uid, searchParams.engagementId);
  if (!managerData?.dashboard) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
        <h3 className="text-base font-bold text-orbit-dark mb-1">Detailed analysis unavailable</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Your detailed analysis will be available once your Oaklin consultant has closed the survey.
        </p>
      </div>
    );
  }

  const data = await getDetailedAnalysisData(managerData.dashboard.engagementId);
  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
        <h3 className="text-base font-bold text-orbit-dark mb-1">Detailed analysis unavailable</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Your detailed analysis will be available once your Oaklin consultant has closed the survey.
        </p>
      </div>
    );
  }

  const backQuery = searchParams.engagementId
    ? `?engagementId=${searchParams.engagementId}`
    : managerData.selectedSurveyId
      ? `?engagementId=${managerData.selectedSurveyId}`
      : '';

  return (
    <DetailedAnalysisView
      data={data}
      backHref={`/dashboard${backQuery}`}
      surveys={managerData.surveys}
      selectedSurveyId={managerData.selectedSurveyId ?? undefined}
      surveyPickerBaseUrl="/dashboard/analysis"
    />
  );
}
