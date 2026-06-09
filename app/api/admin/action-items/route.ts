import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const {
      title,
      description,
      competency,
      timeframe,
      teamId,
      organisationId,
      engagementId,
      assignedTo,
      completionPct,
      comments,
    } = body;

    if (!title || !teamId || !organisationId) {
      return NextResponse.json({ error: 'title, teamId and organisationId are required' }, { status: 400 });
    }

    const allActions = await adminDb
      .collection('actionItems')
      .where('teamId', '==', teamId)
      .get();

    const doc = await adminDb.collection('actionItems').add({
      title,
      description: description ?? '',
      competency: competency ?? 'people_relationships',
      timeframe: timeframe ?? 'short_term',
      teamId,
      organisationId,
      engagementId: engagementId ?? '',
      assignedTo: assignedTo ?? '',
      completionPct: completionPct ?? 0,
      comments: comments ?? '',
      status: 'not_started',
      priority: allActions.size + 1,
      source: 'manual',
      dueDate: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: doc.id });
  } catch (err) {
    console.error('[admin action-items POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
