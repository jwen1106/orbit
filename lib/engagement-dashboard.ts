import { adminDb } from '@/lib/firebase-admin';
import type {
  ActionItem,
  Competency,
  Engagement,
  Insights,
  Organisation,
  Question,
  Team,
} from '@/types';
import { COMPETENCY_LABELS } from '@/types';
import {
  DASHBOARD_NOT_AVAILABLE,
  type DashboardStrength,
  type DashboardPillar,
  type EngagementDashboardData,
  type ScoreDistributionItem,
  type DetailedCompetencyBreakdown,
  type DetailedAnalysisData,
  type QuestionBreakdown,
} from '@/lib/dashboard-types';

export {
  DASHBOARD_NOT_AVAILABLE,
  type DashboardStrength,
  type DashboardPillar,
  type EngagementDashboardData,
  type ScoreDistributionItem,
  type DetailedCompetencyBreakdown,
  type DetailedAnalysisData,
  type QuestionBreakdown,
} from '@/lib/dashboard-types';

const COMPETENCIES: Competency[] = [
  'people_relationships',
  'growth_impact',
  'purpose_alignment',
];

const PLACEHOLDER_COUNT = 3;

export function maturityLabel(score: number) {
  if (score >= 4.5) return 'Optimised';
  if (score >= 3.5) return 'Established';
  if (score >= 2.5) return 'Managed';
  if (score >= 1.5) return 'Emerging';
  return 'Beginning';
}

function avgScore(
  responses: { questionId: string; score: number }[],
  qId: string,
) {
  const filtered = responses.filter((r) => r.questionId === qId);
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length;
}

function competencyAvg(
  responses: { questionId: string; score: number }[],
  competency: Competency,
  questions: Record<string, Question>,
) {
  const relevantQs = Object.entries(questions)
    .filter(([, q]) => q.competency === competency)
    .map(([qId]) => qId);
  const scores = relevantQs
    .map((qId) => avgScore(responses, qId))
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

function keyMetricForCompetency(
  memberResponses: { questionId: string; score: number }[],
  competency: Competency,
  questions: Record<string, Question>,
): string {
  const relevantQs = Object.entries(questions)
    .filter(([, q]) => q.competency === competency)
    .map(([qId, q]) => ({ qId, q }));

  if (relevantQs.length === 0) return 'No survey data available yet.';

  let lowestQ = relevantQs[0];
  let lowestAvg = Infinity;

  for (const { qId, q } of relevantQs) {
    const avg = avgScore(memberResponses, qId);
    if (avg !== null && avg < lowestAvg) {
      lowestAvg = avg;
      lowestQ = { qId, q };
    }
  }

  const responses = memberResponses.filter((r) => r.questionId === lowestQ.qId);
  if (responses.length === 0) {
    return lowestQ.q.subtext ?? lowestQ.q.text;
  }

  const meetingThreshold = responses.filter((r) => r.score >= 4).length;
  const pct = Math.round((meetingThreshold / responses.length) * 100);
  const label =
    lowestQ.q.criteria?.['4'] ??
    lowestQ.q.criteria?.['5'] ??
    lowestQ.q.subtext ??
    lowestQ.q.text;

  return `${pct}% ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

function placeholderItem(): DashboardStrength {
  return { title: DASHBOARD_NOT_AVAILABLE, description: DASHBOARD_NOT_AVAILABLE };
}

function placeholderItems(count = PLACEHOLDER_COUNT): DashboardStrength[] {
  return Array.from({ length: count }, placeholderItem);
}

function padDashboardItems(items: DashboardStrength[]): DashboardStrength[] {
  const padded = [...items];
  while (padded.length < PLACEHOLDER_COUNT) {
    padded.push(placeholderItem());
  }
  return padded.slice(0, PLACEHOLDER_COUNT);
}

function placeholderPillars(): DashboardPillar[] {
  return COMPETENCIES.map((competency) => ({
    competency,
    score: null,
    keyMetric: DASHBOARD_NOT_AVAILABLE,
    actions: placeholderItems(),
  }));
}

function buildEmptyDashboard(
  engagementId: string,
  teamName: string,
  orgName: string,
): EngagementDashboardData {
  return {
    engagementId,
    teamName,
    orgName,
    overallScore: null,
    maturityLabel: DASHBOARD_NOT_AVAILABLE,
    strengths: placeholderItems(),
    opportunities: placeholderItems(),
    pillars: placeholderPillars(),
    hasFullAnalysis: false,
    hasSurveyData: false,
  };
}
function parseStrength(text: string): DashboardStrength {
  const dot = text.indexOf('. ');
  if (dot > 0) {
    return {
      title: text.slice(0, dot),
      description: text.slice(dot + 2),
    };
  }
  return { title: text, description: '' };
}

function buildFallbackStrengths(
  competencyScores: Insights['competencyScores'],
): DashboardStrength[] {
  const ranked = COMPETENCIES.map((c) => ({
    competency: c,
    score: competencyScores[c],
  })).sort((a, b) => b.score - a.score);

  return ranked.slice(0, 3).map(({ competency, score }, i) => {
    const label = COMPETENCY_LABELS[competency];
    if (i === 0) {
      return {
        title: `${label.split(' & ')[0]} pillar leads maturity`,
        description: `${label} (${score.toFixed(1)}) is your strongest area based on current survey responses.`,
      };
    }
    return {
      title: `Solid performance in ${label.toLowerCase()}`,
      description: `${label} scored ${score.toFixed(1)} out of 5 across completed responses.`,
    };
  });
}

function buildFallbackOpportunities(
  competencyScores: Insights['competencyScores'],
): DashboardStrength[] {
  const ranked = COMPETENCIES.map((c) => ({
    competency: c,
    score: competencyScores[c],
  })).sort((a, b) => a.score - b.score);

  return ranked.slice(0, 3).map(({ competency, score }, i) => {
    const label = COMPETENCY_LABELS[competency];
    if (i === 0) {
      return {
        title: `${label.split(' & ')[0]} development priority`,
        description: `${label} (${score.toFixed(1)}) has the most room for improvement across the team.`,
      };
    }
    return {
      title: `Strengthen ${label.toLowerCase()}`,
      description: `Focus improvement efforts on raising the ${score.toFixed(1)} average in this pillar.`,
    };
  });
}

async function loadQuestions(engagement: Engagement) {
  const questionsSnap = await adminDb
    .collection('questions')
    .where('version', '==', engagement.questionSetVersion)
    .where('isActive', '==', true)
    .get();

  const questions: Record<string, Question> = {};
  questionsSnap.docs.forEach((d) => {
    questions[d.id] = { id: d.id, ...d.data() } as Question;
  });
  return questions;
}

async function computeScoresFromResponses(engagementId: string, engagement: Engagement) {
  const questions = await loadQuestions(engagement);

  const respondentsSnap = await adminDb
    .collection('engagements')
    .doc(engagementId)
    .collection('respondents')
    .where('status', '==', 'completed')
    .get();

  if (respondentsSnap.empty) return null;

  const respondents = respondentsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as { id: string; role: string }[];
  const allResponsesRaw = await Promise.all(
    respondents.map((r) =>
      adminDb
        .collection('engagements')
        .doc(engagementId)
        .collection('respondents')
        .doc(r.id)
        .collection('responses')
        .get()
        .then((snap) => snap.docs.map((d) => d.data() as { questionId: string; score: number })),
    ),
  );

  const memberResponses = allResponsesRaw
    .filter((_, i) => respondents[i]?.role === 'member')
    .flat();
  const managerResponses = allResponsesRaw
    .filter((_, i) => respondents[i]?.role === 'manager')
    .flat();
  const allResponses = allResponsesRaw.flat();

  const competencyScores = {
    people_relationships: competencyAvg(allResponses, 'people_relationships', questions),
    growth_impact: competencyAvg(allResponses, 'growth_impact', questions),
    purpose_alignment: competencyAvg(allResponses, 'purpose_alignment', questions),
  };
  const managerScores = {
    people_relationships: competencyAvg(managerResponses, 'people_relationships', questions),
    growth_impact: competencyAvg(managerResponses, 'growth_impact', questions),
    purpose_alignment: competencyAvg(managerResponses, 'purpose_alignment', questions),
  };
  const memberScores = {
    people_relationships: competencyAvg(memberResponses, 'people_relationships', questions),
    growth_impact: competencyAvg(memberResponses, 'growth_impact', questions),
    purpose_alignment: competencyAvg(memberResponses, 'purpose_alignment', questions),
  };

  const memberCount = respondents.filter((r) => r.role === 'member').length;

  return {
    competencyScores,
    managerScores,
    memberScores,
    memberResponses,
    managerResponses,
    allResponses,
    questions,
    memberCount,
  };
}

function buildPillars(
  competencyScores: Insights['competencyScores'],
  memberResponses: { questionId: string; score: number }[],
  questions: Record<string, Question>,
  actions: ActionItem[],
  padActions = true,
): DashboardPillar[] {
  return COMPETENCIES.map((competency) => {
    const pillarActions = actions
      .filter((a) => a.competency === competency)
      .slice(0, PLACEHOLDER_COUNT)
      .map((a) => ({ title: a.title, description: a.description }));

    return {
      competency,
      score: competencyScores[competency],
      keyMetric: keyMetricForCompetency(memberResponses, competency, questions),
      actions: padActions ? padDashboardItems(pillarActions) : pillarActions,
    };
  });
}

export async function getEngagementDashboardData(
  engagementId: string,
): Promise<EngagementDashboardData | null> {
  const engDoc = await adminDb.collection('engagements').doc(engagementId).get();
  if (!engDoc.exists) return null;

  const engagement = { id: engDoc.id, ...engDoc.data() } as Engagement;
  if (engagement.status === 'draft' || engagement.status === 'active') return null;

  const [teamDoc, orgDoc, insightsDoc, actionsSnap] = await Promise.all([
    adminDb.collection('teams').doc(engagement.teamId).get(),
    adminDb.collection('organisations').doc(engagement.organisationId).get(),
    adminDb.collection('insights').doc(engagementId).get(),
    adminDb.collection('actionItems').where('engagementId', '==', engagementId).get(),
  ]);

  if (!teamDoc.exists || !orgDoc.exists) return null;

  const team = { id: teamDoc.id, ...teamDoc.data() } as Team;
  const orgName = orgDoc.data()?.name ?? '';
  const actions = actionsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ActionItem))
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  if (insightsDoc.exists) {
    const insights = insightsDoc.data() as Insights;
    const overallScore =
      Object.values(insights.competencyScores).reduce((a, b) => a + b, 0) /
      COMPETENCIES.length;

    const computed = await computeScoresFromResponses(engagementId, engagement);
    const memberResponses = computed?.memberResponses ?? [];
    const questions = computed?.questions ?? {};

    return {
      engagementId,
      teamName: team.name,
      orgName,
      overallScore,
      maturityLabel: maturityLabel(overallScore),
      strengths: padDashboardItems(insights.keyStrengths.slice(0, PLACEHOLDER_COUNT).map(parseStrength)),
      opportunities: padDashboardItems(
        insights.quickWins.slice(0, PLACEHOLDER_COUNT).map((w) => ({
          title: w.title,
          description: w.description,
        })),
      ),
      pillars: buildPillars(
        insights.competencyScores,
        memberResponses,
        questions,
        actions,
      ),
      hasFullAnalysis: true,
      hasSurveyData: true,
    };
  }

  const computed = await computeScoresFromResponses(engagementId, engagement);
  if (!computed) {
    return buildEmptyDashboard(engagementId, team.name, orgName);
  }

  const { competencyScores, memberResponses, questions } = computed;
  const overallScore =
    Object.values(competencyScores).reduce((a, b) => a + b, 0) / COMPETENCIES.length;

  return {
    engagementId,
    teamName: team.name,
    orgName,
    overallScore,
    maturityLabel: maturityLabel(overallScore),
    strengths: padDashboardItems(buildFallbackStrengths(competencyScores)),
    opportunities: padDashboardItems(buildFallbackOpportunities(competencyScores)),
    pillars: buildPillars(competencyScores, memberResponses, questions, []),
    hasFullAnalysis: false,
    hasSurveyData: true,
  };
}

export async function getManagerDashboardData(uid: string) {
  const teamsSnap = await adminDb.collection('teams').where('managerId', '==', uid).get();
  if (teamsSnap.empty) return null;

  const team = { id: teamsSnap.docs[0].id, ...teamsSnap.docs[0].data() } as Team;

  const engagementsSnap = await adminDb
    .collection('engagements')
    .where('teamId', '==', team.id)
    .get();

  const engagements = engagementsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Engagement))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

  const dashboardEng = engagements.find(
    (e) => e.status === 'closed' || e.status === 'analysed',
  );

  if (!dashboardEng) {
    return { team, dashboard: null as EngagementDashboardData | null, latestEngagement: engagements[0] ?? null };
  }

  const dashboard = await getEngagementDashboardData(dashboardEng.id);
  return { team, dashboard, latestEngagement: dashboardEng };
}

export interface OrgEngagementOption {
  id: string;
  title: string;
  status: string;
  teamId: string;
  teamName: string;
  createdAt: number;
}

export async function getOrgDashboardData(orgId: string, teamId?: string, engagementId?: string) {
  const [orgDoc, teamsSnap] = await Promise.all([
    adminDb.collection('organisations').doc(orgId).get(),
    adminDb.collection('teams').where('organisationId', '==', orgId).get(),
  ]);

  if (!orgDoc.exists) return null;

  const org = { id: orgDoc.id, ...orgDoc.data() } as Organisation;
  let teams = teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Team));

  if (teamId) teams = teams.filter((t) => t.id === teamId);

  if (teams.length === 0) {
    return { org, teams, dashboard: null as EngagementDashboardData | null, engagements: [] as OrgEngagementOption[] };
  }

  const engagementLists = await Promise.all(
    teams.map((team) =>
      adminDb.collection('engagements').where('teamId', '==', team.id).get(),
    ),
  );

  // Build flat list of all engagements with their team context
  const allEngagements = engagementLists.flatMap((snap, index) =>
    snap.docs.map((d) => ({
      engagement: { id: d.id, ...d.data() } as Engagement,
      team: teams[index],
    })),
  );

  // Check which active engagements have at least one completed response
  const activeWithResponses = await Promise.all(
    allEngagements
      .filter(({ engagement }) => engagement.status === 'active')
      .map(async ({ engagement, team }) => {
        const respondents = await adminDb
          .collection('engagements').doc(engagement.id)
          .collection('respondents')
          .where('status', '==', 'completed')
          .limit(1)
          .get();
        return respondents.size > 0 ? { engagement, team } : null;
      }),
  );

  // Eligible = closed, analysed, or active with at least one completed response
  const eligible = [
    ...allEngagements.filter(({ engagement }) =>
      engagement.status === 'closed' || engagement.status === 'analysed',
    ),
    ...activeWithResponses.filter((x): x is { engagement: Engagement; team: Team } => x !== null),
  ].sort((a, b) => {
    const aTime = a.engagement.closedAt?.toMillis?.() ?? a.engagement.createdAt?.toMillis?.() ?? 0;
    const bTime = b.engagement.closedAt?.toMillis?.() ?? b.engagement.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });

  // Build the options list for the dropdown (most recent first)
  const engagements: OrgEngagementOption[] = eligible.map(({ engagement, team }) => ({
    id: engagement.id,
    title: engagement.title || `${team.name} survey`,
    status: engagement.status,
    teamId: team.id,
    teamName: team.name,
    createdAt: engagement.createdAt?.toMillis?.() ?? 0,
  }));

  // Pick which engagement to display
  const selected = engagementId
    ? eligible.find(({ engagement }) => engagement.id === engagementId) ?? eligible[0]
    : eligible[0];

  if (selected) {
    const dashboard = await getEngagementDashboardData(selected.engagement.id);
    return { org, teams, dashboard, engagements };
  }

  return {
    org,
    teams,
    dashboard: buildEmptyDashboard('preview', teams[0].name, org.name),
    engagements,
  };
}

function computeDistribution(
  memberResponses: { questionId: string; score: number }[],
  competency: Competency,
  questions: Record<string, Question>,
): ScoreDistributionItem[] {
  const relevantQIds = new Set(
    Object.entries(questions)
      .filter(([, q]) => q.competency === competency)
      .map(([qId]) => qId),
  );
  const responses = memberResponses.filter((r) => relevantQIds.has(r.questionId));
  const total = responses.length;

  return [1, 2, 3, 4, 5].map((level) => ({
    level,
    pct:
      total > 0
        ? Math.round(
            (responses.filter((r) => Math.round(r.score) === level).length / total) * 100,
          )
        : null,
  }));
}

const EMPTY_DISTRIBUTION: ScoreDistributionItem[] = [1, 2, 3, 4, 5].map((level) => ({
  level,
  pct: null,
}));

function buildEmptyDetailedAnalysis(
  engagementId: string,
  teamName: string,
): DetailedAnalysisData {
  return {
    engagementId,
    teamName,
    overallScore: null,
    maturityLabel: DASHBOARD_NOT_AVAILABLE,
    hasFullAnalysis: false,
    hasSurveyData: false,
    aiSummary: DASHBOARD_NOT_AVAILABLE,
    quickWins: placeholderItems(),
    oaklinSupport: placeholderItems(),
    competencyBreakdown: COMPETENCIES.map((competency) => ({
      competency,
      score: null,
      managerScore: null,
      memberScore: null,
      industryAverage: null,
      bestInClass: null,
      delta: null,
      respondentCount: 0,
      distribution: EMPTY_DISTRIBUTION,
      aiInsight: DASHBOARD_NOT_AVAILABLE,
      quickWin: null,
      oaklinSupport: null,
    })),
    questionBreakdowns: [],
    radarAvailable: false,
    radarOverall: null,
    radarManager: null,
    radarMember: null,
  };
}

function computeQuestionDistribution(
  responses: { questionId: string; score: number }[],
  questionId: string,
): ScoreDistributionItem[] {
  const filtered = responses.filter((r) => r.questionId === questionId);
  const total = filtered.length;
  return [1, 2, 3, 4, 5].map((level) => ({
    level,
    pct:
      total > 0
        ? Math.round(
            (filtered.filter((r) => Math.round(r.score) === level).length / total) * 100,
          )
        : null,
  }));
}

function roundedAvg(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

function buildPlaceholderQuestionBreakdowns(questions: Record<string, Question>): QuestionBreakdown[] {
  const EMPTY_DIST: ScoreDistributionItem[] = [1, 2, 3, 4, 5].map((level) => ({
    level,
    pct: null,
  }));
  return Object.entries(questions)
    .map(([qId, q]) => ({
      questionId: qId,
      questionText: q.text,
      questionSubtext: q.subtext,
      competency: q.competency,
      order: q.order,
      criteria: q.criteria,
      overallScore: null,
      managerScore: null,
      memberScore: null,
      respondentCount: 0,
      managerCount: 0,
      memberCount: 0,
      delta: null,
      overallDistribution: EMPTY_DIST,
      managerDistribution: EMPTY_DIST,
      memberDistribution: EMPTY_DIST,
      managerCriteriaLabel: null,
      memberCriteriaLabel: null,
    }))
    .sort((a, b) => {
      const COMP_ORDER: Record<string, number> = {
        people_relationships: 0,
        growth_impact: 1,
        purpose_alignment: 2,
      };
      const compDiff = (COMP_ORDER[a.competency] ?? 99) - (COMP_ORDER[b.competency] ?? 99);
      if (compDiff !== 0) return compDiff;
      return a.order - b.order;
    });
}

function buildQuestionBreakdowns(
  allResponses: { questionId: string; score: number }[],
  managerResponses: { questionId: string; score: number }[],
  memberResponses: { questionId: string; score: number }[],
  questions: Record<string, Question>,
): QuestionBreakdown[] {
  return Object.entries(questions)
    .map(([qId, q]) => {
      const allScores = allResponses.filter((r) => r.questionId === qId).map((r) => r.score);
      const mgrScores = managerResponses.filter((r) => r.questionId === qId).map((r) => r.score);
      const memScores = memberResponses.filter((r) => r.questionId === qId).map((r) => r.score);

      const overallScore = roundedAvg(allScores);
      const managerScore = roundedAvg(mgrScores);
      const memberScore = roundedAvg(memScores);

      const managerCriteriaLabel =
        managerScore !== null ? (q.criteria[String(Math.round(managerScore))] ?? null) : null;
      const memberCriteriaLabel =
        memberScore !== null ? (q.criteria[String(Math.round(memberScore))] ?? null) : null;

      return {
        questionId: qId,
        questionText: q.text,
        questionSubtext: q.subtext,
        competency: q.competency,
        order: q.order,
        criteria: q.criteria,
        overallScore,
        managerScore,
        memberScore,
        respondentCount: allScores.length,
        managerCount: mgrScores.length,
        memberCount: memScores.length,
        delta:
          managerScore !== null && memberScore !== null
            ? Math.round((managerScore - memberScore) * 10) / 10
            : null,
        overallDistribution: computeQuestionDistribution(allResponses, qId),
        managerDistribution: computeQuestionDistribution(managerResponses, qId),
        memberDistribution: computeQuestionDistribution(memberResponses, qId),
        managerCriteriaLabel,
        memberCriteriaLabel,
      } satisfies QuestionBreakdown;
    })
    .sort((a, b) => {
      const COMP_ORDER: Record<string, number> = {
        people_relationships: 0,
        growth_impact: 1,
        purpose_alignment: 2,
      };
      const compDiff = (COMP_ORDER[a.competency] ?? 99) - (COMP_ORDER[b.competency] ?? 99);
      if (compDiff !== 0) return compDiff;
      return a.order - b.order;
    });
}

function buildCompetencyBreakdown(
  competencyScores: Insights['competencyScores'],
  managerScores: Insights['competencyScores'],
  memberScores: Insights['competencyScores'],
  memberResponses: { questionId: string; score: number }[],
  questions: Record<string, Question>,
  actions: ActionItem[],
  aiSummary: string,
  respondentCount: number,
  benchmarkComparison?: Insights['benchmarkComparison'],
): DetailedCompetencyBreakdown[] {
  return COMPETENCIES.map((competency) => {
    const bm = benchmarkComparison?.[competency];
    const pillarActions = actions
      .filter((a) => a.competency === competency)
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    const quickWinAction =
      pillarActions.find((a) => a.timeframe === 'short_term') ?? pillarActions[0] ?? null;
    const stratAction =
      pillarActions.find((a) => a.timeframe === 'long_term') ?? pillarActions[1] ?? null;

    return {
      competency,
      score: competencyScores[competency],
      managerScore: managerScores[competency],
      memberScore: memberScores[competency],
      industryAverage: bm?.industryAverage ?? null,
      bestInClass: bm?.bestInClass ?? null,
      delta: bm?.delta ?? null,
      respondentCount,
      distribution: computeDistribution(memberResponses, competency, questions),
      aiInsight: aiSummary,
      quickWin: quickWinAction
        ? { title: quickWinAction.title, description: quickWinAction.description }
        : null,
      oaklinSupport: stratAction
        ? { title: stratAction.title, description: stratAction.description }
        : null,
    };
  });
}

export async function getDetailedAnalysisData(
  engagementId: string,
): Promise<DetailedAnalysisData | null> {
  if (engagementId === 'preview') {
    return buildEmptyDetailedAnalysis(engagementId, 'Team');
  }

  const engDoc = await adminDb.collection('engagements').doc(engagementId).get();
  if (!engDoc.exists) return null;

  const engagement = { id: engDoc.id, ...engDoc.data() } as Engagement;
  if (engagement.status === 'draft' || engagement.status === 'active') return null;

  const [teamDoc, insightsDoc, actionsSnap] = await Promise.all([
    adminDb.collection('teams').doc(engagement.teamId).get(),
    adminDb.collection('insights').doc(engagementId).get(),
    adminDb.collection('actionItems').where('engagementId', '==', engagementId).get(),
  ]);

  if (!teamDoc.exists) return null;
  const team = { id: teamDoc.id, ...teamDoc.data() } as Team;
  const actions = actionsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ActionItem))
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  if (insightsDoc.exists) {
    const insights = insightsDoc.data() as Insights;
    const overallScore =
      Object.values(insights.competencyScores).reduce((a, b) => a + b, 0) / COMPETENCIES.length;

    const computed = await computeScoresFromResponses(engagementId, engagement);
    const memberResponses = computed?.memberResponses ?? [];
    const managerResponses = computed?.managerResponses ?? [];
    const allResponses = computed?.allResponses ?? [];
    const questions = computed?.questions ?? {};
    const respondentCount = insights.respondentCount.member;

    return {
      engagementId,
      teamName: team.name,
      overallScore,
      maturityLabel: maturityLabel(overallScore),
      hasFullAnalysis: true,
      hasSurveyData: true,
      aiSummary: insights.aiSummary,
      quickWins: padDashboardItems(
        insights.quickWins.slice(0, PLACEHOLDER_COUNT).map((w) => ({
          title: w.title,
          description: w.description,
        })),
      ),
      oaklinSupport: padDashboardItems(
        insights.strategicInitiatives.slice(0, PLACEHOLDER_COUNT).map((s) => ({
          title: s.title,
          description: s.description,
        })),
      ),
      competencyBreakdown: buildCompetencyBreakdown(
        insights.competencyScores,
        insights.managerScores,
        insights.memberScores,
        memberResponses,
        questions,
        actions,
        insights.aiSummary,
        respondentCount,
        insights.benchmarkComparison,
      ),
      questionBreakdowns: buildQuestionBreakdowns(
        allResponses,
        managerResponses,
        memberResponses,
        questions,
      ),
      radarAvailable: true,
      radarOverall: insights.competencyScores,
      radarManager: insights.managerScores,
      radarMember: insights.memberScores,
    };
  }

  const computed = await computeScoresFromResponses(engagementId, engagement);
  if (!computed) {
    // No responses yet — load questions anyway so the page shows placeholders
    const questions = await loadQuestions(engagement);
    return {
      ...buildEmptyDetailedAnalysis(engagementId, team.name),
      questionBreakdowns: buildPlaceholderQuestionBreakdowns(questions),
    };
  }

  const {
    competencyScores,
    managerScores,
    memberScores,
    memberResponses,
    managerResponses,
    allResponses,
    questions,
    memberCount,
  } = computed;
  const overallScore =
    Object.values(competencyScores).reduce((a, b) => a + b, 0) / COMPETENCIES.length;

  return {
    engagementId,
    teamName: team.name,
    overallScore,
    maturityLabel: maturityLabel(overallScore),
    hasFullAnalysis: false,
    hasSurveyData: true,
    aiSummary: DASHBOARD_NOT_AVAILABLE,
    quickWins: placeholderItems(),
    oaklinSupport: placeholderItems(),
    competencyBreakdown: buildCompetencyBreakdown(
      competencyScores,
      managerScores,
      memberScores,
      memberResponses,
      questions,
      actions,
      DASHBOARD_NOT_AVAILABLE,
      memberCount,
    ),
    questionBreakdowns: buildQuestionBreakdowns(
      allResponses,
      managerResponses,
      memberResponses,
      questions,
    ),
    radarAvailable: true,
    radarOverall: competencyScores,
    radarManager: managerScores,
    radarMember: memberScores,
  };
}

export async function getManagerDetailedAnalysisData(uid: string) {
  const managerData = await getManagerDashboardData(uid);
  if (!managerData?.dashboard) return null;
  const analysis = await getDetailedAnalysisData(managerData.dashboard.engagementId);
  return analysis;
}
