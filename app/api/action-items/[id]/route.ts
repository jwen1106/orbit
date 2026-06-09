import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth';
import { canAccessActionItem } from '@/lib/action-items-auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    if (!(await canAccessActionItem(session, params.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      competency,
      timeframe,
      status,
      assignedTo,
      dueDate,
      completionPct,
      comments,
    } = body;

    const update: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (competency !== undefined) update.competency = competency;
    if (timeframe !== undefined) update.timeframe = timeframe;
    if (status !== undefined) update.status = status;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (dueDate !== undefined) {
      update.dueDate = dueDate ? Timestamp.fromDate(new Date(dueDate)) : null;
    }
    if (completionPct !== undefined) {
      update.completionPct = completionPct;
      update.status =
        completionPct >= 100 ? 'complete' : completionPct > 0 ? 'in_progress' : 'not_started';
    }
    if (comments !== undefined) update.comments = comments;

    await adminDb.collection('actionItems').doc(params.id).update(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[action-items PATCH]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    if (!(await canAccessActionItem(session, params.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('actionItems').doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[action-items DELETE]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
