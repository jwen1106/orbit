import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { title, description, competency, timeframe, assignedTo, completionPct, comments, status } = body;

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (competency !== undefined) updates.competency = competency;
    if (timeframe !== undefined) updates.timeframe = timeframe;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (completionPct !== undefined) {
      updates.completionPct = completionPct;
      updates.status =
        completionPct === 100 ? 'complete' : completionPct > 0 ? 'in_progress' : 'not_started';
    }
    if (status !== undefined) updates.status = status;
    if (comments !== undefined) updates.comments = comments;

    const ref = adminDb.collection('actionItems').doc(params.id);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await ref.update(updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin action-items PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    await adminDb.collection('actionItems').doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin action-items DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
