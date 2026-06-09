import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth';
import { canAccessTeamActionItems } from '@/lib/action-items-auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

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
      return NextResponse.json(
        { error: 'title, teamId and organisationId are required' },
        { status: 400 },
      );
    }

    if (!(await canAccessTeamActionItems(session, teamId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allActions = await adminDb
      .collection('actionItems')
      .where('teamId', '==', teamId)
      .get();

    const pct = completionPct ?? 0;
    const doc = await adminDb.collection('actionItems').add({
      title,
      description: description ?? '',
      competency: competency ?? 'people_relationships',
      timeframe: timeframe ?? 'short_term',
      teamId,
      organisationId,
      engagementId: engagementId ?? '',
      assignedTo: assignedTo ?? '',
      completionPct: pct,
      comments: comments ?? '',
      status: pct >= 100 ? 'complete' : pct > 0 ? 'in_progress' : 'not_started',
      priority: allActions.size + 1,
      source: 'manual',
      dueDate: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: doc.id });
  } catch (err) {
    console.error('[action-items POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
