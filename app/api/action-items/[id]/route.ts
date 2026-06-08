import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireManager, verifySession } from '@/lib/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { status, assignedTo, dueDate } = await req.json();
    const itemRef = adminDb.collection('actionItems').doc(params.id);
    const doc = await itemRef.get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Managers can only update their own team's actions
    if (session.role === 'team_manager') {
      const teamsSnap = await adminDb
        .collection('teams')
        .where('managerId', '==', session.uid)
        .limit(1)
        .get();
      if (teamsSnap.empty || doc.data()?.teamId !== teamsSnap.docs[0].id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const update: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status !== undefined) update.status = status;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (dueDate !== undefined) {
      update.dueDate = dueDate ? Timestamp.fromDate(new Date(dueDate)) : null;
    }

    await itemRef.update(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[action-items PATCH]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
