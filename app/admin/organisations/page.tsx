import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Organisation } from '@/types';

async function getOrganisations(): Promise<(Organisation & { teamCount: number })[]> {
  const snap = await adminDb
    .collection('organisations')
    .orderBy('createdAt', 'desc')
    .get();

  const orgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Organisation));

  const teamCounts = await Promise.all(
    orgs.map((org) =>
      adminDb.collection('teams').where('organisationId', '==', org.id).count().get(),
    ),
  );

  return orgs.map((org, i) => ({
    ...org,
    teamCount: teamCounts[i].data().count,
  }));
}

export default async function OrganisationsPage() {
  const organisations = await getOrganisations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">Organisations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {organisations.length} client organisation{organisations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/organisations/new">
          <Button>+ New Organisation</Button>
        </Link>
      </div>

      {organisations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No organisations yet.</p>
            <Link href="/admin/organisations/new">
              <Button>Create your first organisation</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-1/6 px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="w-1/6 px-4 py-3 text-left font-semibold text-gray-600">Industry</th>
                <th className="w-1/6 px-4 py-3 text-left font-semibold text-gray-600">Teams</th>
                <th className="w-1/6 px-4 py-3 text-left font-semibold text-gray-600">Created</th>
                <th className="w-1/6 px-4 py-3 text-center font-semibold text-gray-600">Dashboard</th>
                <th className="w-1/6 px-4 py-3 text-center font-semibold text-gray-600">Action Plan</th>
              </tr>
            </thead>
            <tbody>
              {organisations.map((org) => (
                <tr key={org.id} className="border-b border-gray-100 table-row-hover">
                  <td className="px-4 py-4 font-semibold text-orbit-dark truncate">{org.name}</td>
                  <td className="px-4 py-4 text-gray-600 truncate">{org.industry}</td>
                  <td className="px-4 py-4 text-gray-600">{org.teamCount}</td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    {org.createdAt?.toDate?.().toLocaleDateString('en-GB') ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Link
                      href={`/admin/organisations/${org.id}/dashboard`}
                      className="inline-flex items-center justify-center gap-1.5 bg-orbit-forest text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-orbit-green transition-colors w-full max-w-[130px]"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                      </svg>
                      Dashboard
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Link
                      href={`/admin/organisations/${org.id}/action-plan`}
                      className="inline-flex items-center justify-center gap-1.5 border border-orbit-forest text-orbit-forest text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-green-50 transition-colors w-full max-w-[130px]"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                      </svg>
                      Action Plan
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
