import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { industry, function: func, sizeRange, competencyScores } = body;

    if (!industry || !func || !sizeRange) {
      return NextResponse.json({ error: 'industry, function, and sizeRange are required' }, { status: 400 });
    }

    const id = `${slugify(industry)}__${func}__${slugify(sizeRange)}`;
    const data = {
      industry,
      function: func,
      sizeRange,
      competencyScores: competencyScores ?? {
        people_relationships: { industryAverage: 0, bestInClass: 0 },
        growth_impact: { industryAverage: 0, bestInClass: 0 },
        purpose_alignment: { industryAverage: 0, bestInClass: 0 },
      },
      source: 'oaklin_authored' as const,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'admin',
    };

    await adminDb.collection('benchmarks').doc(id).set(data);
    return NextResponse.json({ id, ...data });
  } catch (err) {
    console.error('[benchmarks POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
