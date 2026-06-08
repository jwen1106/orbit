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
    await adminDb.collection('questions').doc(params.id).update(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const body = await req.json();

    const { text, subtext, competency, role, order, isActive, criteria, version, assignedOrganisationIds } = body;

    if (!text?.trim() || !competency || !role) {
      return NextResponse.json({ error: 'text, competency and role are required' }, { status: 400 });
    }

    await adminDb.collection('questions').doc(params.id).update({
      version: version ?? 'v1',
      text: text.trim(),
      subtext: subtext?.trim() ?? '',
      competency,
      role,
      order: Number(order) || 1,
      isActive: isActive ?? true,
      criteria: criteria ?? {},
      assignedOrganisationIds: Array.isArray(assignedOrganisationIds) ? assignedOrganisationIds : [],
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[questions PUT]', err);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    await adminDb.collection('questions').doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[questions DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
