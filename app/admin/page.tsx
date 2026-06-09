import { adminDb } from '@/lib/firebase-admin';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import type { Engagement, Team, Organisation } from '@/types';

async function getDashboardData() {
  // Fetch all collections without orderBy to avoid index requirements
  const [orgsSnap, teamsSnap, engSnap, insightsSnap] = await Promise.all([
    adminDb.collection('organisations').get(),
    adminDb.collection('teams').get(),
    adminDb.collection('engagements').get(),
    adminDb.collection('insights').get(),
  ]);

  const orgsMap: Record<string, Organisation> = {};
  orgsSnap.docs.forEach((d) => {
    orgsMap[d.id] = { id: d.id, ...d.data() } as Organisation;
  });

  const teamsMap: Record<string, Team> = {};
  teamsSnap.docs.forEach((d) => {
    teamsMap[d.id] = { id: d.id, ...d.data() } as Team;
  });

  const insightsMap: Record<string, Record<string, number>> = {};
  insightsSnap.docs.forEach((d) => {
    const data = d.data();
    if (data?.competencyScores) {
      insightsMap[d.id] = data.competencyScores as Record<string, number>;
    }
  });

  // Sort engagements by createdAt descending (client-side to avoid index requirement)
  const rawEngagements = engSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Engagement)
    .sort((a, b) => {
      const aTime = (a.createdAt as { seconds?: number })?.seconds ?? 0;
      const bTime = (b.createdAt as { seconds?: number })?.seconds ?? 0;
      return bTime - aTime;
    });

  const engagements = rawEngagements.map((eng) => {
    const scores = insightsMap[eng.id] ?? null;
    return {
      id: eng.id,
      teamId: eng.teamId,
      organisationId: eng.organisationId,
      status: eng.status,
      teamName: teamsMap[eng.teamId]?.name ?? '—',
      orgName: orgsMap[eng.organisationId]?.name ?? '—',
      industry: orgsMap[eng.organisationId]?.industry ?? '—',
      scores,
    };
  });

  // Sort orgs and teams alphabetically
  const orgs = orgsSnap.docs
    .map((d) => ({ id: d.id, name: (d.data() as Organisation).name ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const teams = teamsSnap.docs
    .map((d) => {
      const t = d.data() as Team;
      return { id: d.id, name: t.name ?? '', orgId: t.organisationId ?? '' };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const stats = {
    organisations: orgsSnap.size,
    teams: teamsSnap.size,
    total: engSnap.size,
    draft: rawEngagements.filter((e) => e.status === 'draft').length,
    active: rawEngagements.filter((e) => e.status === 'active').length,
    closed: rawEngagements.filter((e) => e.status === 'closed' || e.status === 'analysed').length,
    analysed: rawEngagements.filter((e) => e.status === 'analysed').length,
  };

  return { orgs, teams, engagements, stats };
}

export default async function AdminDashboard() {
  const { engagements, stats } = await getDashboardData();

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

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Organisations', value: stats.organisations, color: 'text-orbit-forest' },
          { label: 'Teams', value: stats.teams, color: 'text-orbit-forest' },
          { label: 'Draft Surveys', value: stats.draft, color: 'text-gray-400' },
          { label: 'Active Surveys', value: stats.active, color: 'text-orbit-amber' },
          { label: 'Closed Surveys', value: stats.closed, color: 'text-orbit-green' },
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
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">#</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Organisation</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Team</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Industry</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Survey Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Manage</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Export to CSV</th>
              </tr>
            </thead>
            <tbody>
              {engagements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No engagements yet.{' '}
                    <Link href="/admin/engagements/new" className="text-orbit-green hover:underline font-semibold">
                      Create one
                    </Link>
                  </td>
                </tr>
              ) : (
                engagements.map((eng, i) => (
                  <tr key={eng.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-orbit-dark">{eng.orgName}</td>
                    <td className="px-6 py-3 text-gray-600">{eng.teamName}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{eng.industry}</td>
                    <td className="px-6 py-3">
                      <Badge variant={eng.status} />
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/engagements/${eng.id}`}
                        className="text-orbit-green hover:underline text-xs font-semibold"
                      >
                        Manage →
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      {eng.status === 'analysed' ? (
                        <a
                          href={`/api/admin/export/${eng.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-orbit-forest text-white hover:bg-orbit-green transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export CSV
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
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
