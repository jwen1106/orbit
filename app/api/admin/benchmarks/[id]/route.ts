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
    const { industry, function: func, sizeRange, competencyScores, source } = body;

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'admin',
    };
    if (industry !== undefined) updates.industry = industry;
    if (func !== undefined) updates.function = func;
    if (sizeRange !== undefined) updates.sizeRange = sizeRange;
    if (competencyScores !== undefined) updates.competencyScores = competencyScores;
    if (source !== undefined) updates.source = source;

    await adminDb.collection('benchmarks').doc(params.id).update(updates);
    return NextResponse.json({ id: params.id });
  } catch (err) {
    console.error('[benchmarks PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    await adminDb.collection('benchmarks').doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[benchmarks DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
