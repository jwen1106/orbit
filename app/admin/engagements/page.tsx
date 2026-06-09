import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Engagement, Team, Organisation } from '@/types';

async function getEngagements() {
  const snap = await adminDb.collection('engagements').orderBy('createdAt', 'desc').get();
  const engagements = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Engagement));

  if (engagements.length === 0) return [];

  const teamIds = Array.from(new Set(engagements.map((e) => e.teamId)));
  const orgIds = Array.from(new Set(engagements.map((e) => e.organisationId)));

  const [teamDocs, orgDocs] = await Promise.all([
    Promise.all(teamIds.map((id) => adminDb.collection('teams').doc(id).get())),
    Promise.all(orgIds.map((id) => adminDb.collection('organisations').doc(id).get())),
  ]);

  const teams: Record<string, Team> = {};
  teamDocs.forEach((d) => { if (d.exists) teams[d.id] = { id: d.id, ...d.data() } as Team; });
  const orgs: Record<string, Organisation> = {};
  orgDocs.forEach((d) => { if (d.exists) orgs[d.id] = { id: d.id, ...d.data() } as Organisation; });

  return engagements.map((e) => ({
    ...e,
    teamName: teams[e.teamId]?.name ?? '—',
    orgName: orgs[e.organisationId]?.name ?? '—',
  }));
}

export default async function EngagementsPage() {
  const engagements = await getEngagements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">Engagements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {engagements.length} engagement{engagements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/engagements/new">
          <Button>+ New Engagement</Button>
        </Link>
      </div>

      {engagements.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">No engagements yet.</p>
            <Link href="/admin/engagements/new">
              <Button>Create first engagement</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-600 w-10">#</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Organisation</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Team</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Survey Title</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Created</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {engagements.map((eng, i) => (
                <tr key={eng.id} className="border-b border-gray-100 table-row-hover">
                  <td className="px-6 py-4 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-6 py-4 font-medium text-orbit-dark">{eng.orgName}</td>
                  <td className="px-6 py-4 text-gray-600">{eng.teamName}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {eng.title
                      ? <span className="font-medium text-orbit-dark">{eng.title}</span>
                      : <span className="text-gray-300 italic text-xs">No title</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={eng.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {eng.createdAt?.toDate?.().toLocaleDateString('en-GB') ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/engagements/${eng.id}`}
                      className="text-orbit-green hover:underline text-xs font-semibold"
                    >
                      Open engagement →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
