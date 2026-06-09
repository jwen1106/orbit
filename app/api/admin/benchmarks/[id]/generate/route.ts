import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { claude, CLAUDE_MODEL } from '@/lib/claude';
import type { Competency } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const docRef = adminDb.collection('benchmarks').doc(params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Benchmark not found' }, { status: 404 });
    }

    const bm = doc.data() as {
      industry: string;
      function: string;
      sizeRange: string;
    };

    const prompt = `You are an organisational performance benchmarking expert.

Based on your knowledge of typical operational maturity assessments across industries, generate realistic benchmark scores for the following segment:

Industry: ${bm.industry}
Function: ${bm.function} office
Team Size Range: ${bm.sizeRange} employees

Provide scores on a scale of 1.0 to 5.0 (one decimal place) for each of three competency dimensions:
1. People & Relationships (people_relationships) - teamwork, communication, leadership
2. Growth & Impact (growth_impact) - performance, innovation, business outcomes
3. Purpose & Alignment (purpose_alignment) - values, culture, strategic alignment

For each competency, provide:
- industryAverage: the typical score for this industry/function/size
- bestInClass: the top-quartile score for high-performing organisations in this segment

Return ONLY valid JSON in this exact structure (no explanation, no markdown):
{
  "people_relationships": { "industryAverage": X.X, "bestInClass": X.X },
  "growth_impact": { "industryAverage": X.X, "bestInClass": X.X },
  "purpose_alignment": { "industryAverage": X.X, "bestInClass": X.X }
}`;

    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI returned unexpected format' }, { status: 500 });
    }

    const competencyScores = JSON.parse(jsonMatch[0]) as Record<
      Competency,
      { industryAverage: number; bestInClass: number }
    >;

    await docRef.update({
      competencyScores,
      source: 'ai_supplemented',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'admin_ai_generate',
    });

    return NextResponse.json({ competencyScores });
  } catch (err) {
    console.error('[benchmarks generate]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
