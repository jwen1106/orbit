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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Industry</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Teams</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {organisations.map((org) => (
                <tr key={org.id} className="border-b border-gray-100 table-row-hover">
                  <td className="px-6 py-4 font-semibold text-orbit-dark">{org.name}</td>
                  <td className="px-6 py-4 text-gray-600">{org.industry}</td>
                  <td className="px-6 py-4 text-gray-600">{org.teamCount}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {org.createdAt?.toDate?.().toLocaleDateString('en-GB') ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/organisations/${org.id}`}
                        className="text-orbit-green hover:underline text-xs font-semibold"
                      >
                        View →
                      </Link>
                      <Link
                        href={`/admin/organisations/${org.id}/dashboard`}
                        className="bg-orbit-forest text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-orbit-green transition-colors"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
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
