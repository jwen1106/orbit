import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { name, industry } = await req.json();
    if (!name?.trim() || !industry?.trim()) {
      return NextResponse.json({ error: 'Name and industry are required' }, { status: 400 });
    }
    const ref = await adminDb.collection('organisations').add({
      name: name.trim(),
      industry: industry.trim(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session.uid,
    });
    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error('[admin/organisations POST]', err);
    return NextResponse.json({ error: 'Failed to create organisation' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb.collection('organisations').orderBy('name').get();
    const orgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(orgs);
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}
