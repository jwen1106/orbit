import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { validateManagerPassword } from '@/lib/manager-auth';

export const dynamic = 'force-dynamic';

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const cookieValue = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return false;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookieValue, true);
    return decoded.role === 'oaklin_admin';
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const teamDoc = await adminDb.collection('teams').doc(params.id).get();
    if (!teamDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const team = teamDoc.data()!;
    let manager = null;
    if (team.managerId) {
      const userDoc = await adminDb.collection('users').doc(team.managerId).get();
      if (userDoc.exists) {
        manager = { uid: userDoc.id, ...userDoc.data() };
      }
    }

    return NextResponse.json({
      id: teamDoc.id,
      name: team.name ?? '',
      function: team.function ?? '',
      size: team.size ?? '',
      managerId: team.managerId ?? '',
      organisationId: team.organisationId ?? '',
      manager,
    });
  } catch (err) {
    console.error('[teams/[id] GET]', err);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const teamUpdates: Record<string, unknown> = {};

    if (body.name?.trim()) teamUpdates.name = body.name.trim();
    if (body.function) teamUpdates.function = body.function;
    if (body.size) teamUpdates.size = Number(body.size);

    if (Object.keys(teamUpdates).length > 0) {
      await adminDb.collection('teams').doc(params.id).update(teamUpdates);
    }

    if (body.managerName?.trim() || body.managerEmail?.trim() || body.managerPassword) {
      const teamDoc = await adminDb.collection('teams').doc(params.id).get();
      const managerId = teamDoc.data()?.managerId;

      if (managerId) {
        const authUpdates: Record<string, string> = {};
        const userUpdates: Record<string, string> = {};

        if (body.managerName?.trim()) {
          authUpdates.displayName = body.managerName.trim();
          userUpdates.displayName = body.managerName.trim();
        }
        if (body.managerEmail?.trim()) {
          authUpdates.email = body.managerEmail.trim();
          userUpdates.email = body.managerEmail.trim();
        }
        if (body.managerPassword) {
          const passwordError = validateManagerPassword(body.managerPassword);
          if (passwordError) {
            return NextResponse.json({ error: passwordError }, { status: 400 });
          }
          authUpdates.password = body.managerPassword;
        }

        if (Object.keys(authUpdates).length > 0) {
          await adminAuth.updateUser(managerId, authUpdates);
        }
        if (Object.keys(userUpdates).length > 0) {
          await adminDb.collection('users').doc(managerId).update(userUpdates);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[teams/[id] PUT]', err);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const { deleteTeam } = await import('@/lib/delete-organisation');
    await deleteTeam(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[teams/[id] DELETE]', err);
    const message = err instanceof Error ? err.message : 'Failed to delete team';
    const status = message === 'Team not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
