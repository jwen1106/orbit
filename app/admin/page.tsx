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
    {
      href: '/admin/organisations/new',
      label: 'New Organisation',
      svg: (
        <svg className="w-6 h-6 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V11h6v10" />
        </svg>
      ),
    },
    {
      href: '/admin/engagements/new',
      label: 'New Engagement',
      svg: (
        <svg className="w-6 h-6 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      href: '/admin/questions',
      label: 'Question Bank',
      svg: (
        <svg className="w-6 h-6 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: '/admin/benchmarks',
      label: 'Benchmarks',
      svg: (
        <svg className="w-6 h-6 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
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
        {/* Organisations */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orbit-forest/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V11h6v10" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-orbit-forest">{stats.organisations}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organisations</p>
        </div>

        {/* Teams */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orbit-forest/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-5.916-3.519M17 20H7m10 0v-2a5.978 5.978 0 00-.94-3.254M7 20H2v-2a4 4 0 015.916-3.519M7 20v-2a5.978 5.978 0 01.94-3.254m5.12 0A5.978 5.978 0 0112 14a5.978 5.978 0 01-1.06.746M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM3 10a2 2 0 114 0 2 2 0 01-4 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-orbit-forest">{stats.teams}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teams</p>
        </div>

        {/* Draft Surveys */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-3-3v6M5 8h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2zm3-4h6a1 1 0 011 1v1H7V5a1 1 0 011-1z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-gray-400">{stats.draft}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Draft Surveys</p>
        </div>

        {/* Active Surveys */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orbit-amber/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-orbit-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-orbit-amber">{stats.active}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Surveys</p>
        </div>

        {/* Closed Surveys */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orbit-green/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-orbit-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-orbit-green">{stats.closed}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Closed Surveys</p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-bold text-orbit-dark mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="orbit-card p-5 flex flex-col items-center gap-3 hover:border-orbit-green hover:shadow transition-all text-center group"
            >
              <div className="w-11 h-11 rounded-full bg-orbit-forest/10 flex items-center justify-center group-hover:bg-orbit-forest/20 transition-colors">
                {link.svg}
              </div>
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
                      {eng.status !== 'draft' ? (
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
