import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import type { Organisation, Team, Engagement, Insights } from '@/types';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') ?? '';
    const teamId = searchParams.get('teamId') ?? '';

    const [orgsSnap, teamsSnap, engSnap, insightsSnap] = await Promise.all([
      adminDb.collection('organisations').get(),
      adminDb.collection('teams').get(),
      adminDb.collection('engagements').orderBy('createdAt', 'desc').get(),
      adminDb.collection('insights').get(),
    ]);

    const orgs: Record<string, Organisation> = {};
    orgsSnap.docs.forEach((d) => { orgs[d.id] = { id: d.id, ...d.data() } as Organisation; });
    const teams: Record<string, Team> = {};
    teamsSnap.docs.forEach((d) => { teams[d.id] = { id: d.id, ...d.data() } as Team; });
    const insightsMap: Record<string, Insights> = {};
    insightsSnap.docs.forEach((d) => { insightsMap[d.id] = d.data() as Insights; });

    let engagements = engSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Engagement);

    if (orgId) engagements = engagements.filter((e) => e.organisationId === orgId);
    if (teamId) engagements = engagements.filter((e) => e.teamId === teamId);

    const headers = [
      'Engagement ID',
      'Organisation',
      'Team',
      'Industry',
      'Function',
      'Status',
      'Created',
      'People & Relationships',
      'Growth & Impact',
      'Purpose & Alignment',
      'Overall Score',
    ];

    const rows = engagements.map((eng) => {
      const org = orgs[eng.organisationId];
      const team = teams[eng.teamId];
      const insights = insightsMap[eng.id];
      const scores = insights?.competencyScores ?? null;
      const overall = scores
        ? Object.values(scores).reduce((a: number, b) => a + (b as number), 0) / Object.values(scores).length
        : null;
      const createdAt = eng.createdAt
        ? new Date((eng.createdAt as { seconds: number }).seconds * 1000).toISOString().split('T')[0]
        : '';

      return [
        eng.id,
        org?.name ?? '—',
        team?.name ?? '—',
        org?.industry ?? '—',
        team?.function ?? '—',
        eng.status,
        createdAt,
        scores ? scores.people_relationships.toFixed(2) : '—',
        scores ? scores.growth_impact.toFixed(2) : '—',
        scores ? scores.purpose_alignment.toFixed(2) : '—',
        overall !== null ? overall.toFixed(2) : '—',
      ];
    });

    const csvLines = [headers, ...rows].map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    );
    const csv = csvLines.join('\r\n');

    const label = orgId
      ? (orgs[orgId]?.name ?? orgId)
      : teamId
      ? (teams[teamId]?.name ?? teamId)
      : 'all';
    const filename = `orbit-export-${label.toLowerCase().replace(/\s+/g, '-')}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[bulk-export]', err);
    return new Response('Error generating export', { status: 500 });
  }
}
