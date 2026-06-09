import { adminDb } from '@/lib/firebase-admin';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import type { Engagement, Team, Organisation, Insights } from '@/types';
import { COMPETENCY_LABELS } from '@/types';
import AdminCsvExport from '@/components/admin/AdminCsvExport';

async function getDashboardData() {
  const [orgsSnap, teamsSnap, engSnap, insightsSnap] = await Promise.all([
    adminDb.collection('organisations').orderBy('name').get(),
    adminDb.collection('teams').orderBy('name').get(),
    adminDb.collection('engagements').orderBy('createdAt', 'desc').get(),
    adminDb.collection('insights').get(),
  ]);

  const orgs: Record<string, Organisation> = {};
  orgsSnap.docs.forEach((d) => { orgs[d.id] = { id: d.id, ...d.data() } as Organisation; });
  const teams: Record<string, Team> = {};
  teamsSnap.docs.forEach((d) => { teams[d.id] = { id: d.id, ...d.data() } as Team; });
  const insightsMap: Record<string, Insights> = {};
  insightsSnap.docs.forEach((d) => { insightsMap[d.id] = d.data() as Insights; });

  const engagements = engSnap.docs.map((d) => {
    const eng = { id: d.id, ...d.data() } as Engagement;
    const insights = insightsMap[eng.id];
    return {
      ...eng,
      teamName: teams[eng.teamId]?.name ?? '—',
      orgName: orgs[eng.organisationId]?.name ?? '—',
      industry: orgs[eng.organisationId]?.industry ?? '—',
      scores: insights?.competencyScores ?? null,
    };
  });

  return {
    orgs: orgsSnap.docs.map((d) => ({ id: d.id, name: (d.data() as Organisation).name })),
    teams: teamsSnap.docs.map((d) => {
      const t = d.data() as Team;
      return { id: d.id, name: t.name, orgId: t.organisationId ?? '' };
    }),
    engagements,
    stats: {
      organisations: orgsSnap.size,
      teams: teamsSnap.size,
      active: engagements.filter((e) => e.status === 'active').length,
      analysed: engagements.filter((e) => e.status === 'analysed').length,
      draft: engagements.filter((e) => e.status === 'draft').length,
      total: engagements.length,
    },
  };
}

export default async function AdminDashboard() {
  const { orgs, teams, engagements, stats } = await getDashboardData();

  const quickLinks = [
    { href: '/admin/organisations/new', label: 'New Organisation', icon: '🏢' },
    { href: '/admin/engagements/new', label: 'New Engagement', icon: '📋' },
    { href: '/admin/questions', label: 'Question Bank', icon: '❓' },
    { href: '/admin/benchmarks', label: 'Benchmarks', icon: '📈' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Orbit platform management</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Organisations', value: stats.organisations, color: 'text-orbit-forest' },
          { label: 'Teams', value: stats.teams, color: 'text-orbit-forest' },
          { label: 'Total engagements', value: stats.total, color: 'text-orbit-dark' },
          { label: 'Active surveys', value: stats.active, color: 'text-orbit-amber' },
          { label: 'Analysed', value: stats.analysed, color: 'text-orbit-green' },
          { label: 'Draft', value: stats.draft, color: 'text-gray-400' },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-bold text-orbit-dark mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="orbit-card p-4 flex flex-col items-center gap-2 hover:border-orbit-green hover:shadow transition-all text-center group"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-sm font-semibold text-orbit-dark group-hover:text-orbit-forest">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* CSV Export */}
      <AdminCsvExport orgs={orgs} teams={teams} />

      {/* Engagements table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-orbit-dark">
            All Engagements
            <span className="ml-2 text-sm font-normal text-gray-400">
              {stats.total} total · {stats.analysed} analysed
            </span>
          </h2>
          <Link
            href="/admin/engagements/new"
            className="text-sm font-semibold text-orbit-green hover:underline"
          >
            + New engagement
          </Link>
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
              {engagements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No engagements yet.{' '}
                    <Link href="/admin/engagements/new" className="text-orbit-green hover:underline font-semibold">
                      Create one
                    </Link>
                  </td>
                </tr>
              ) : (
                engagements.map((eng) => (
                  <tr key={eng.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
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
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/engagements/${eng.id}`}
                        className="text-orbit-green hover:underline text-xs font-semibold mr-3"
                      >
                        Manage
                      </Link>
                      {eng.status === 'analysed' && (
                        <a
                          href={`/api/admin/export/${eng.id}`}
                          className="text-gray-400 hover:text-orbit-forest text-xs"
                        >
                          CSV
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
