import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { getManagerDetailedAnalysisData } from '@/lib/engagement-dashboard';
import DeltaAnalysisView from '@/components/dashboard/DeltaAnalysisView';
import Card from '@/components/ui/Card';

export default async function DeltaPage({
  searchParams,
}: {
  searchParams: { engagementId?: string };
}) {
  const session = await verifySession();
  if (!session) redirect('/');

  const data = await getManagerDetailedAnalysisData(session.uid, searchParams.engagementId);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">
          Team Manager and Team Member Analysis
        </h1>
        <Card>
          <div className="text-center py-12 text-gray-500">
            Results will be available once your engagement has been analysed.
          </div>
        </Card>
      </div>
    );
  }

  return <DeltaAnalysisView data={data} />;
}
