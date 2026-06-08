/**
 * Manager detailed analysis — linked from "View for detailed analysis" on /dashboard.
 */
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { getManagerDetailedAnalysisData } from '@/lib/engagement-dashboard';
import DetailedAnalysisView from '@/components/dashboard/DetailedAnalysisView';

export default async function ManagerAnalysisPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const data = await getManagerDetailedAnalysisData(session.uid);

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

  return <DetailedAnalysisView data={data} backHref="/dashboard" />;
}
