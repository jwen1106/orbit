import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { sendManagerDashboardInvite, sendPasswordEmail } from '@/lib/email';

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('organisationId');

    // Sort in memory to avoid requiring a composite Firestore index
    let query = adminDb.collection('teams') as FirebaseFirestore.Query;
    if (orgId) query = query.where('organisationId', '==', orgId);
    const snap = await query.get();

    const teams = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(a.name ?? '').localeCompare(String(b.name ?? '')),
      );

    // Enrich with manager info
    const enriched = await Promise.all(
      teams.map(async (team: Record<string, unknown>) => {
        let manager = null;
        if (team.managerId) {
          const userDoc = await adminDb.collection('users').doc(team.managerId as string).get();
          if (userDoc.exists) {
            const u = userDoc.data()!;
            manager = { displayName: u.displayName ?? '', email: u.email ?? '' };
          }
        }
        return { ...team, manager };
      }),
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('[teams GET]', err);
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { organisationId, name, function: func, size, managerName, managerEmail } =
      await req.json();

    if (!organisationId || !name || !func || !size || !managerName || !managerEmail) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const tempPassword = generatePassword();
    let managerUser;
    try {
      managerUser = await adminAuth.createUser({
        email: managerEmail,
        password: tempPassword,
        displayName: managerName,
      });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/email-already-exists') {
        managerUser = await adminAuth.getUserByEmail(managerEmail);
      } else {
        throw err;
      }
    }

    const teamRef = await adminDb.collection('teams').add({
      organisationId,
      name: name.trim(),
      function: func,
      size: Number(size),
      managerId: managerUser.uid,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session.uid,
    });

    await adminDb.collection('users').doc(managerUser.uid).set({
      uid: managerUser.uid,
      email: managerEmail,
      displayName: managerName,
      role: 'team_manager',
      organisationId,
      createdAt: FieldValue.serverTimestamp(),
      invitedBy: session.uid,
    });

    await adminAuth.setCustomUserClaims(managerUser.uid, {
      role: 'team_manager',
      organisationId,
    });

    try {
      await sendPasswordEmail(managerEmail, managerName, tempPassword);
      await sendManagerDashboardInvite(managerEmail, managerName);
    } catch (emailErr) {
      console.warn('[admin/teams] Email failed:', emailErr);
    }

    return NextResponse.json({ id: teamRef.id, managerId: managerUser.uid });
  } catch (err) {
    console.error('[admin/teams POST]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create team' },
      { status: 500 },
    );
  }
}
