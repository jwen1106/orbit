import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import {
  getManagerDashboardData,
  getDetailedAnalysisData,
} from '@/lib/engagement-dashboard';
import type { Organisation, Team } from '@/types';
import ExportReportView from '@/components/dashboard/ExportReportView';

async function getExportData(uid: string) {
  const result = await getManagerDashboardData(uid);
  if (!result?.dashboard) return null;

  const { team, dashboard } = result;

  const orgDoc = await adminDb.collection('organisations').doc(team.organisationId).get();
  const org = orgDoc.exists ? ({ id: orgDoc.id, ...orgDoc.data() } as Organisation) : null;

  const analysis = await getDetailedAnalysisData(dashboard.engagementId);

  const respondentsSnap = await adminDb
    .collection('engagements')
    .doc(dashboard.engagementId)
    .collection('respondents')
    .where('status', '==', 'completed')
    .get();

  return {
    dashboard,
    analysis,
    orgName: org?.name ?? dashboard.orgName,
    respondentCount: respondentsSnap.size,
  };
}

export default async function ExportReportPage() {
  const session = await verifySession();
  if (!session) redirect('/');

  const data = await getExportData(session.uid);

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
        <h1 className="text-xl font-bold text-orbit-dark mb-2">Export Report</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Your report will be available once your engagement has been closed and analysed.
        </p>
      </div>
    );
  }

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ExportReportView
      dashboard={data.dashboard}
      analysis={data.analysis}
      orgName={data.orgName}
      reportDate={reportDate}
      respondentCount={data.respondentCount}
    />
  );
}
