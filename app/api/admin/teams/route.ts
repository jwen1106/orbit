import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { validateManagerPassword } from '@/lib/manager-auth';
import { FieldValue } from 'firebase-admin/firestore';
import { sendManagerDashboardInvite } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('organisationId');

    let query = adminDb.collection('teams') as FirebaseFirestore.Query;
    if (orgId) query = query.where('organisationId', '==', orgId);
    const snap = await query.get();

    const teams = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(a.name ?? '').localeCompare(String(b.name ?? '')),
      );

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
    const {
      organisationId,
      name,
      function: func,
      size,
      managerName,
      managerEmail,
      managerPassword,
      sendInviteEmail = true,
    } = await req.json();

    if (!organisationId || !name || !func || !size || !managerName || !managerEmail) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const passwordError = validateManagerPassword(managerPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    let managerUser;
    try {
      managerUser = await adminAuth.createUser({
        email: managerEmail.trim(),
        password: managerPassword,
        displayName: managerName.trim(),
      });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/email-already-exists') {
        managerUser = await adminAuth.getUserByEmail(managerEmail.trim());
        await adminAuth.updateUser(managerUser.uid, {
          password: managerPassword,
          displayName: managerName.trim(),
        });
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

    await adminDb.collection('users').doc(managerUser.uid).set(
      {
        uid: managerUser.uid,
        email: managerEmail.trim(),
        displayName: managerName.trim(),
        role: 'team_manager',
        organisationId,
        createdAt: FieldValue.serverTimestamp(),
        invitedBy: session.uid,
      },
      { merge: true },
    );

    await adminAuth.setCustomUserClaims(managerUser.uid, {
      role: 'team_manager',
      organisationId,
    });

    if (sendInviteEmail) {
      try {
        await sendManagerDashboardInvite(managerEmail.trim(), managerName.trim());
      } catch (emailErr) {
        console.warn('[admin/teams] Invite email failed:', emailErr);
      }
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
