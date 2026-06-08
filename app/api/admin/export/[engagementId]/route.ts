import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { engagementId: string } },
) {
  try {
    await requireAdmin(req);
    const { engagementId } = params;

    const [engDoc, questionsSnap, respondentsSnap] = await Promise.all([
      adminDb.collection('engagements').doc(engagementId).get(),
      adminDb.collection('questions').where('isActive', '==', true).orderBy('competency').orderBy('order').get(),
      adminDb.collection('engagements').doc(engagementId).collection('respondents').get(),
    ]);

    if (!engDoc.exists) return new Response('Not found', { status: 404 });

    const questions = questionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string; text: string; competency: string; role: string;
    }[];
    const respondents = respondentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string; name: string; role: string; status: string;
    }[];

    const allResponses = await Promise.all(
      respondents.map((r) =>
        adminDb
          .collection('engagements').doc(engagementId)
          .collection('respondents').doc(r.id)
          .collection('responses').get()
          .then((snap) => snap.docs.map((d) => d.data() as { questionId: string; score: number })),
      ),
    );

    const headers = [
      'respondent_id',
      'name',
      'role',
      'status',
      ...questions.map((q) => `[${q.competency}] ${q.text.substring(0, 60)}`),
    ];

    const rows = respondents.map((r, i) => {
      const responses = allResponses[i] ?? [];
      const responseMap: Record<string, number> = {};
      responses.forEach((res) => { responseMap[res.questionId] = res.score; });

      return [
        r.id,
        r.name ?? 'Anonymous',
        r.role,
        r.status,
        ...questions.map((q) => responseMap[q.id]?.toString() ?? ''),
      ];
    });

    const csvLines = [headers, ...rows].map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    );
    const csv = csvLines.join('\r\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orbit-${engagementId}.csv"`,
      },
    });
  } catch (err) {
    console.error('[export]', err);
    return new Response('Error generating export', { status: 500 });
  }
}
