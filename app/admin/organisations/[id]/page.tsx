import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { Organisation, Team, OUser } from '@/types';

async function getOrgData(id: string) {
  const [orgDoc, teamsSnap] = await Promise.all([
    adminDb.collection('organisations').doc(id).get(),
    adminDb.collection('teams').where('organisationId', '==', id).get(),
  ]);
  if (!orgDoc.exists) return null;
  const org = { id: orgDoc.id, ...orgDoc.data() } as Organisation;

  const teams = teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Team));

  const managerIds = teams.map((t) => t.managerId).filter(Boolean);
  const managers: Record<string, OUser> = {};
  if (managerIds.length > 0) {
    const userDocs = await Promise.all(
      managerIds.map((uid) => adminDb.collection('users').doc(uid).get()),
    );
    userDocs.forEach((doc) => {
      if (doc.exists) managers[doc.id] = { uid: doc.id, ...doc.data() } as OUser;
    });
  }

  return { org, teams, managers };
}

export default async function OrganisationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getOrgData(params.id);
  if (!data) notFound();
  const { org, teams, managers } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/organisations" className="text-sm text-orbit-green hover:underline">
            ← Organisations
          </Link>
          <h1 className="text-2xl font-bold text-orbit-dark mt-1">{org.name}</h1>
          <p className="text-sm text-gray-500">{org.industry}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/organisations/${org.id}/edit`}>
            <Button variant="secondary">Edit details</Button>
          </Link>
          <Link href={`/admin/organisations/${org.id}/teams/new`}>
            <Button>+ Add Team</Button>
          </Link>
        </div>
      </div>

      <Card>
        <h2 className="text-base font-bold text-orbit-dark mb-4">
          Teams ({teams.length})
        </h2>
        {teams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-3">No teams yet.</p>
            <Link href={`/admin/organisations/${org.id}/teams/new`}>
              <Button>Add the first team</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-left font-semibold text-gray-600">Team</th>
                <th className="py-2 text-left font-semibold text-gray-600">Function</th>
                <th className="py-2 text-left font-semibold text-gray-600">Size</th>
                <th className="py-2 text-left font-semibold text-gray-600">Manager</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const manager = managers[team.managerId];
                return (
                  <tr key={team.id} className="border-b border-gray-100 table-row-hover">
                    <td className="py-3 font-semibold text-orbit-dark">{team.name}</td>
                    <td className="py-3 text-gray-600 capitalize">{team.function}</td>
                    <td className="py-3 text-gray-600">{team.size}</td>
                    <td className="py-3 text-gray-600">
                      {manager ? (
                        <span>
                          {manager.displayName}
                          <span className="text-gray-400 text-xs ml-1">
                            ({manager.email})
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/organisations/${org.id}/teams/${team.id}/edit`}
                        className="text-orbit-green hover:underline text-xs font-semibold"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
