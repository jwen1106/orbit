import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { claude, CLAUDE_MODEL } from '@/lib/claude';
import type { Question, Competency, CompetencyScores, BenchmarkEntry } from '@/types';

function sizeRange(size: number): string {
  if (size <= 10) return '1-10';
  if (size <= 25) return '11-25';
  if (size <= 50) return '26-50';
  return '51+';
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function getBenchmarks(
  industry: string,
  func: string,
  size: number,
): Promise<Record<Competency, BenchmarkEntry> | null> {
  const range = sizeRange(size);
  const id = `${slugify(industry)}__${func}__${range}`;
  const doc = await adminDb.collection('benchmarks').doc(id).get();
  if (doc.exists) return (doc.data() as { competencyScores: Record<Competency, BenchmarkEntry> }).competencyScores;
  // Try without size
  const broadId = `${slugify(industry)}__${func}__all`;
  const broadDoc = await adminDb.collection('benchmarks').doc(broadId).get();
  if (broadDoc.exists) return (broadDoc.data() as { competencyScores: Record<Competency, BenchmarkEntry> }).competencyScores;
  return null;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const { id } = params;

    const engDoc = await adminDb.collection('engagements').doc(id).get();
    if (!engDoc.exists || engDoc.data()?.status !== 'closed') {
      return NextResponse.json({ error: 'Engagement must be closed before analysis' }, { status: 400 });
    }

    const engagement = engDoc.data()!;

    // Fetch team and org context
    const [teamDoc, orgDoc] = await Promise.all([
      adminDb.collection('teams').doc(engagement.teamId).get(),
      adminDb.collection('organisations').doc(engagement.organisationId).get(),
    ]);
    const team = teamDoc.data()!;
    const org = orgDoc.data()!;

    // Fetch all completed respondents and their responses
    const respondentsSnap = await adminDb
      .collection('engagements').doc(id).collection('respondents')
      .where('status', '==', 'completed').get();

    if (respondentsSnap.empty) {
      return NextResponse.json({ error: 'No completed respondents found' }, { status: 400 });
    }

    const respondents = respondentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Fetch all responses for each respondent
    const allResponsesRaw = await Promise.all(
      respondents.map((r) =>
        adminDb
          .collection('engagements').doc(id)
          .collection('respondents').doc(r.id)
          .collection('responses').get()
          .then((snap) => snap.docs.map((d) => d.data())),
      ),
    );

    // Fetch question bank
    const questionsSnap = await adminDb
      .collection('questions')
      .where('version', '==', engagement.questionSetVersion)
      .where('isActive', '==', true)
      .get();
    const questions: Record<string, Question> = {};
    questionsSnap.docs.forEach((d) => { questions[d.id] = { id: d.id, ...d.data() } as Question; });

    // Build structured response summary
    const competencies: Competency[] = ['people_relationships', 'growth_impact', 'purpose_alignment'];
    const managerRespondents = respondents.filter((r) => (r as unknown as { role: string }).role === 'manager');
    const memberRespondents = respondents.filter((r) => (r as unknown as { role: string }).role === 'member');

    const avgScore = (responses: { questionId: string; score: number }[], qId: string) => {
      const filtered = responses.filter((r) => r.questionId === qId);
      if (filtered.length === 0) return null;
      return filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length;
    };

    // Group responses by role
    const managerResponses = allResponsesRaw
      .filter((_, i) => managerRespondents.some((m) => respondents[i]?.id === m.id))
      .flat() as { questionId: string; score: number }[];
    const memberResponses = allResponsesRaw
      .filter((_, i) => memberRespondents.some((m) => respondents[i]?.id === m.id))
      .flat() as { questionId: string; score: number }[];
    const allResponses = allResponsesRaw.flat() as { questionId: string; score: number }[];

    // Compute per-competency averages
    const competencyAvg = (responses: { questionId: string; score: number }[], competency: Competency) => {
      const relevantQs = Object.entries(questions)
        .filter(([, q]) => q.competency === competency)
        .map(([qId]) => qId);
      const scores = relevantQs
        .map((qId) => avgScore(responses, qId))
        .filter((s): s is number => s !== null);
      if (scores.length === 0) return 0;
      return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
    };

    const competencyScores: CompetencyScores = {
      people_relationships: competencyAvg(allResponses, 'people_relationships'),
      growth_impact: competencyAvg(allResponses, 'growth_impact'),
      purpose_alignment: competencyAvg(allResponses, 'purpose_alignment'),
    };
    const managerScores: CompetencyScores = {
      people_relationships: competencyAvg(managerResponses, 'people_relationships'),
      growth_impact: competencyAvg(managerResponses, 'growth_impact'),
      purpose_alignment: competencyAvg(managerResponses, 'purpose_alignment'),
    };
    const memberScores: CompetencyScores = {
      people_relationships: competencyAvg(memberResponses, 'people_relationships'),
      growth_impact: competencyAvg(memberResponses, 'growth_impact'),
      purpose_alignment: competencyAvg(memberResponses, 'purpose_alignment'),
    };

    // Fetch benchmarks
    let benchmarkData = await getBenchmarks(org.industry, team.function, team.size);

    // Build question summary for prompt
    const questionSummary = questionsSnap.docs.map((d) => {
      const q = { id: d.id, ...d.data() } as Question;
      const managerAvg = avgScore(managerResponses, q.id);
      const memberAvg = avgScore(memberResponses, q.id);
      return `[${q.competency}] ${q.text} (Manager avg: ${managerAvg?.toFixed(1) ?? 'N/A'}, Member avg: ${memberAvg?.toFixed(1) ?? 'N/A'})`;
    }).join('\n');

    const benchmarkSummary = benchmarkData
      ? competencies.map((c) =>
          `${c}: industry avg ${benchmarkData![c]?.industryAverage ?? 'N/A'}, best-in-class ${benchmarkData![c]?.bestInClass ?? 'N/A'}`
        ).join(', ')
      : 'No benchmark data available for this organisation profile.';

    const prompt = `You are analysing the results of an Operational Maturity Assessment for a ${org.industry} organisation (${team.function} office, team size: ${team.size}).

Organisation: ${org.name}
Team: ${team.name}
Respondents: ${managerRespondents.length} manager(s), ${memberRespondents.length} member(s)

COMPETENCY SCORES (scale 1–5):
People & Relationships: ${competencyScores.people_relationships} (Manager: ${managerScores.people_relationships}, Member: ${memberScores.people_relationships})
Growth & Impact: ${competencyScores.growth_impact} (Manager: ${managerScores.growth_impact}, Member: ${memberScores.growth_impact})
Purpose & Alignment: ${competencyScores.purpose_alignment} (Manager: ${managerScores.purpose_alignment}, Member: ${memberScores.purpose_alignment})

INDUSTRY BENCHMARKS: ${benchmarkSummary}

QUESTION-LEVEL DETAIL:
${questionSummary}

Provide a structured JSON analysis with these exact fields:
{
  "aiSummary": "3-4 sentence narrative overview of the team's diagnostic results, direct and data-grounded, forward-facing in tone",
  "keyStrengths": ["3 specific strengths based on highest scores"],
  "quickWins": [
    { "title": "Action title", "description": "Specific action description with measurable outcome", "competency": "people_relationships|growth_impact|purpose_alignment", "priority": 1 },
    ... (3-5 short-term actions, ordered by priority)
  ],
  "strategicInitiatives": [
    { "title": "Initiative title", "description": "Longer-term strategic initiative description", "competency": "people_relationships|growth_impact|purpose_alignment", "priority": 1 },
    ... (3-5 long-term initiatives)
  ],
  "benchmarkNotes": "1-2 sentences contextualising performance against benchmarks"${!benchmarkData ? ',\n  "supplementaryBenchmarks": { "people_relationships": { "industryAverage": 0.0, "bestInClass": 0.0 }, "growth_impact": { "industryAverage": 0.0, "bestInClass": 0.0 }, "purpose_alignment": { "industryAverage": 0.0, "bestInClass": 0.0 } }' : ''}
}

Return ONLY valid JSON, no markdown formatting.`;

    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const analysis = JSON.parse(rawText.trim());

    // If no benchmark data, use AI-supplemented values
    if (!benchmarkData && analysis.supplementaryBenchmarks) {
      benchmarkData = analysis.supplementaryBenchmarks;
      // Persist the AI-supplemented benchmarks
      const range = sizeRange(team.size);
      const benchmarkId = `${slugify(org.industry)}__${team.function}__${range}`;
      await adminDb.collection('benchmarks').doc(benchmarkId).set({
        industry: org.industry,
        function: team.function,
        sizeRange: range,
        competencyScores: benchmarkData,
        source: 'ai_supplemented',
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: 'claude',
      });
    }

    // Build benchmark comparison
    const benchmarkComparison: Record<string, object> = {};
    for (const c of competencies) {
      const score = competencyScores[c];
      const bm = benchmarkData?.[c];
      benchmarkComparison[c] = {
        score,
        industryAverage: bm?.industryAverage ?? 0,
        bestInClass: bm?.bestInClass ?? 0,
        delta: bm ? Math.round((score - bm.industryAverage) * 100) / 100 : 0,
      };
    }

    // Write insights doc
    await adminDb.collection('insights').doc(id).set({
      engagementId: id,
      teamId: engagement.teamId,
      organisationId: engagement.organisationId,
      competencyScores,
      managerScores,
      memberScores,
      respondentCount: {
        manager: managerRespondents.length,
        member: memberRespondents.length,
      },
      aiSummary: analysis.aiSummary,
      keyStrengths: analysis.keyStrengths,
      quickWins: analysis.quickWins ?? [],
      strategicInitiatives: analysis.strategicInitiatives ?? [],
      benchmarkComparison,
      generatedAt: FieldValue.serverTimestamp(),
      modelVersion: CLAUDE_MODEL,
    });

    // Write action items
    const batch = adminDb.batch();
    const allActions = [
      ...(analysis.quickWins ?? []).map((a: { title: string; description: string; competency: string; priority: number }, i: number) => ({
        ...a,
        timeframe: 'short_term',
        priority: i + 1,
      })),
      ...(analysis.strategicInitiatives ?? []).map((a: { title: string; description: string; competency: string; priority: number }, i: number) => ({
        ...a,
        timeframe: 'long_term',
        priority: i + 1,
      })),
    ];

    for (const action of allActions) {
      const actionRef = adminDb.collection('actionItems').doc();
      batch.set(actionRef, {
        engagementId: id,
        teamId: engagement.teamId,
        organisationId: engagement.organisationId,
        title: action.title,
        description: action.description,
        competency: action.competency,
        timeframe: action.timeframe,
        priority: action.priority,
        status: 'not_started',
        assignedTo: '',
        dueDate: null,
        source: 'ai_generated',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    // Update engagement status
    await adminDb.collection('engagements').doc(id).update({
      status: 'analysed',
      analysedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, actionCount: allActions.length });
  } catch (err) {
    console.error('[analyse POST]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    );
  }
}
