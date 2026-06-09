import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function deleteQueryDocs(query: FirebaseFirestore.Query) {
  const snap = await query.get();
  if (snap.empty) return;

  const batch = adminDb.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  if (snap.size >= 500) {
    await deleteQueryDocs(query);
  }
}

async function deleteSubcollection(
  parentRef: FirebaseFirestore.DocumentReference,
  subcollectionName: string,
) {
  let snap = await parentRef.collection(subcollectionName).limit(500).get();
  while (!snap.empty) {
    const batch = adminDb.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    snap = await parentRef.collection(subcollectionName).limit(500).get();
  }
}

async function deleteEngagement(engagementId: string) {
  const engagementRef = adminDb.collection('engagements').doc(engagementId);
  const respondentsSnap = await engagementRef.collection('respondents').get();

  for (const respondent of respondentsSnap.docs) {
    await deleteSubcollection(respondent.ref, 'responses');
    await respondent.ref.delete();
  }

  await adminDb.collection('insights').doc(engagementId).delete().catch(() => undefined);
  await deleteQueryDocs(adminDb.collection('actionItems').where('engagementId', '==', engagementId));
  await engagementRef.delete();
}

async function deleteTeamEngagements(teamId: string) {
  const engagementIds = new Set<string>();
  const teamEngagements = await adminDb.collection('engagements').where('teamId', '==', teamId).get();
  teamEngagements.docs.forEach((d) => engagementIds.add(d.id));

  for (const engagementId of engagementIds) {
    await deleteEngagement(engagementId);
  }
}

export async function deleteTeam(teamId: string) {
  const teamRef = adminDb.collection('teams').doc(teamId);
  const teamDoc = await teamRef.get();
  if (!teamDoc.exists) {
    throw new Error('Team not found');
  }

  const team = teamDoc.data()!;
  const organisationId = team.organisationId as string;
  const managerId = team.managerId as string | undefined;

  await deleteTeamEngagements(teamId);
  await deleteQueryDocs(adminDb.collection('actionItems').where('teamId', '==', teamId));
  await teamRef.delete();

  if (managerId) {
    const userDoc = await adminDb.collection('users').doc(managerId).get();
    if (userDoc.exists && userDoc.data()?.organisationId === organisationId) {
      await userDoc.ref.delete();
      try {
        await adminAuth.deleteUser(managerId);
      } catch {
        // Manager auth account may already be removed
      }
    }
  }

  if (organisationId) {
    await deleteOrganisationIfEmpty(organisationId);
  }
}

/** Remove an organisation that no longer has any teams (and its leftover data). */
async function deleteOrganisationIfEmpty(orgId: string) {
  const remainingTeams = await adminDb
    .collection('teams')
    .where('organisationId', '==', orgId)
    .limit(1)
    .get();
  if (!remainingTeams.empty) return;

  const orgRef = adminDb.collection('organisations').doc(orgId);
  const orgDoc = await orgRef.get();
  if (!orgDoc.exists) return;

  await deleteQueryDocs(adminDb.collection('actionItems').where('organisationId', '==', orgId));

  const orgEngagements = await adminDb.collection('engagements').where('organisationId', '==', orgId).get();
  for (const engDoc of orgEngagements.docs) {
    await deleteEngagement(engDoc.id);
  }

  const usersSnap = await adminDb.collection('users').where('organisationId', '==', orgId).get();
  for (const userDoc of usersSnap.docs) {
    await userDoc.ref.delete();
    try {
      await adminAuth.deleteUser(userDoc.id);
    } catch {
      // User auth account may already be removed
    }
  }

  await orgRef.delete();
}

export async function deleteOrganisation(orgId: string) {
  const orgRef = adminDb.collection('organisations').doc(orgId);
  const orgDoc = await orgRef.get();
  if (!orgDoc.exists) {
    throw new Error('Organisation not found');
  }

  const teamsSnap = await adminDb.collection('teams').where('organisationId', '==', orgId).get();

  for (const teamDoc of teamsSnap.docs) {
    await deleteTeam(teamDoc.id);
  }

  await deleteQueryDocs(adminDb.collection('actionItems').where('organisationId', '==', orgId));

  const orgEngagements = await adminDb.collection('engagements').where('organisationId', '==', orgId).get();
  for (const engDoc of orgEngagements.docs) {
    await deleteEngagement(engDoc.id);
  }

  const usersSnap = await adminDb.collection('users').where('organisationId', '==', orgId).get();
  for (const userDoc of usersSnap.docs) {
    await userDoc.ref.delete();
    try {
      await adminAuth.deleteUser(userDoc.id);
    } catch {
      // User auth account may already be removed
    }
  }

  await orgRef.delete();
}
