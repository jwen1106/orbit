import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Engagement, Team, Organisation, Insights } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

async function getPortfolioData() {
  const [engSnap, teamsSnap, orgsSnap, insightsSnap] = await Promise.all([
    adminDb.collection('engagements').orderBy('createdAt', 'desc').get(),
    adminDb.collection('teams').get(),
    adminDb.collection('organisations').get(),
    adminDb.collection('insights').get(),
  ]);

  const teams: Record<string, Team> = {};
  teamsSnap.docs.forEach((d) => { teams[d.id] = { id: d.id, ...d.data() } as Team; });
  const orgs: Record<string, Organisation> = {};
  orgsSnap.docs.forEach((d) => { orgs[d.id] = { id: d.id, ...d.data() } as Organisation; });
  const insightsMap: Record<string, Insights> = {};
  insightsSnap.docs.forEach((d) => { insightsMap[d.id] = d.data() as Insights; });

  return engSnap.docs.map((d) => {
    const eng = { id: d.id, ...d.data() } as Engagement;
    const insights = insightsMap[eng.id];
    return {
      ...eng,
      teamName: teams[eng.teamId]?.name ?? '—',
      orgName: orgs[eng.organisationId]?.name ?? '—',
      industry: orgs[eng.organisationId]?.industry ?? '—',
      function: teams[eng.teamId]?.function ?? '—',
      scores: insights?.competencyScores ?? null,
    };
  });
}

export default async function PortfolioPage() {
  const engagements = await getPortfolioData();
  const analysed = engagements.filter((e) => e.status === 'analysed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">Portfolio View</h1>
          <p className="text-sm text-gray-500 mt-1">
            {engagements.length} total engagements · {analysed.length} analysed
          </p>
        </div>
        <Link href="/api/admin/export">
          <Button variant="secondary">Export all (CSV)</Button>
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total engagements', value: engagements.length },
          { label: 'Active', value: engagements.filter((e) => e.status === 'active').length },
          { label: 'Analysed', value: analysed.length },
          { label: 'Draft', value: engagements.filter((e) => e.status === 'draft').length },
        ].map((s) => (
          <Card key={s.label} padding="md">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-orbit-forest mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Organisation</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Team</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Industry</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
              {(['people_relationships', 'growth_impact', 'purpose_alignment'] as const).map((c) => (
                <th key={c} className="px-4 py-3 text-center font-semibold text-gray-600 text-xs">
                  {COMPETENCY_LABELS[c]}
                </th>
              ))}
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {engagements.map((eng) => (
              <tr key={eng.id} className="border-b border-gray-100 table-row-hover">
                <td className="px-6 py-3 font-medium text-orbit-dark">{eng.orgName}</td>
                <td className="px-6 py-3 text-gray-600">{eng.teamName}</td>
                <td className="px-6 py-3 text-gray-500 text-xs">{eng.industry}</td>
                <td className="px-6 py-3">
                  <Badge variant={eng.status} />
                </td>
                {(['people_relationships', 'growth_impact', 'purpose_alignment'] as const).map((c) => (
                  <td key={c} className="px-4 py-3 text-center font-bold text-orbit-forest">
                    {eng.scores ? eng.scores[c].toFixed(1) : '—'}
                  </td>
                ))}
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/admin/engagements/${eng.id}`}
                    className="text-orbit-green hover:underline text-xs font-semibold mr-2"
                  >
                    Manage
                  </Link>
                  {eng.status === 'analysed' && (
                    <Link
                      href={`/api/admin/export/${eng.id}`}
                      className="text-gray-400 hover:text-orbit-forest text-xs"
                    >
                      CSV
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
