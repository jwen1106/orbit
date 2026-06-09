import { adminDb } from '@/lib/firebase-admin';

type Session = { uid: string; role: string };

export async function getManagerTeamId(uid: string): Promise<string | null> {
  const teamsSnap = await adminDb
    .collection('teams')
    .where('managerId', '==', uid)
    .limit(1)
    .get();
  return teamsSnap.empty ? null : teamsSnap.docs[0].id;
}

/** Returns true if the session may read/write action items for this team. */
export async function canAccessTeamActionItems(
  session: Session,
  teamId: string,
): Promise<boolean> {
  if (session.role === 'oaklin_admin') return true;
  if (session.role === 'team_manager') {
    const managerTeamId = await getManagerTeamId(session.uid);
    return managerTeamId === teamId;
  }
  return false;
}

/** Returns true if the session may read/write this action item. */
export async function canAccessActionItem(
  session: Session,
  actionItemId: string,
): Promise<boolean> {
  const doc = await adminDb.collection('actionItems').doc(actionItemId).get();
  if (!doc.exists) return false;
  const teamId = doc.data()?.teamId as string | undefined;
  if (!teamId) return false;
  return canAccessTeamActionItems(session, teamId);
}
