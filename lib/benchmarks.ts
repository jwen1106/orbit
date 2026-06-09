import { adminDb } from '@/lib/firebase-admin';
import type { Benchmark, BenchmarkEntry, BenchmarkScore, Competency, CompetencyScores, Insights, Organisation, Team } from '@/types';
import { getManagerDashboardData } from '@/lib/engagement-dashboard';

const COMPETENCIES: Competency[] = ['people_relationships', 'growth_impact', 'purpose_alignment'];

export function sizeRange(size: number): string {
  if (size <= 10) return '1-10';
  if (size <= 25) return '11-25';
  if (size <= 50) return '26-50';
  return '51+';
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function functionLabel(fn: string): string {
  if (fn === 'front') return 'Front Office';
  if (fn === 'middle') return 'Middle Office';
  if (fn === 'back') return 'Back Office';
  return fn;
}

export function averageOf(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function overallMaturity(scores: CompetencyScores): number {
  return averageOf(COMPETENCIES.map((c) => scores[c]));
}

export async function fetchBenchmarkForProfile(
  industry: string,
  func: string,
  size: number,
): Promise<Record<Competency, BenchmarkEntry> | null> {
  const range = sizeRange(size);
  const id = `${slugify(industry)}__${func}__${range}`;
  const doc = await adminDb.collection('benchmarks').doc(id).get();
  if (doc.exists) {
    return (doc.data() as { competencyScores: Record<Competency, BenchmarkEntry> }).competencyScores;
  }
  const broadId = `${slugify(industry)}__${func}__all`;
  const broadDoc = await adminDb.collection('benchmarks').doc(broadId).get();
  if (broadDoc.exists) {
    return (broadDoc.data() as { competencyScores: Record<Competency, BenchmarkEntry> }).competencyScores;
  }
  return null;
}

export function buildBenchmarkComparison(
  competencyScores: CompetencyScores,
  benchmark: Record<Competency, BenchmarkEntry> | null,
): Record<Competency, BenchmarkScore> {
  const result = {} as Record<Competency, BenchmarkScore>;
  for (const c of COMPETENCIES) {
    const score = competencyScores[c];
    const bm = benchmark?.[c];
    result[c] = {
      score,
      industryAverage: bm?.industryAverage ?? 0,
      bestInClass: bm?.bestInClass ?? 0,
      delta: bm ? Math.round((score - bm.industryAverage) * 100) / 100 : 0,
    };
  }
  return result;
}

export interface SectorBenchmarkRow {
  industry: string;
  people: number | null;
  growth: number | null;
  purpose: number | null;
  average: number | null;
  hasData: boolean;
}

/** Returns benchmark data for the organisation's industry only. */
export function getSectorBenchmarkForIndustry(
  benchmarks: Benchmark[],
  industry: string,
): SectorBenchmarkRow {
  const rows = benchmarks.filter(
    (bm) => bm.industry.toLowerCase() === industry.toLowerCase(),
  );

  if (rows.length === 0) {
    return {
      industry,
      people: null,
      growth: null,
      purpose: null,
      average: null,
      hasData: false,
    };
  }

  const people = averageOf(rows.map((r) => r.competencyScores.people_relationships.industryAverage));
  const growth = averageOf(rows.map((r) => r.competencyScores.growth_impact.industryAverage));
  const purpose = averageOf(rows.map((r) => r.competencyScores.purpose_alignment.industryAverage));

  return {
    industry,
    people,
    growth,
    purpose,
    average: averageOf([people, growth, purpose]),
    hasData: true,
  };
}

export function formatTargetRange(baseline: number, bestInClass: number, mode: 'quick_win' | 'oaklin'): string {
  const cap = (n: number) => Math.min(Math.max(n, 0), 5);
  if (mode === 'quick_win') {
    const low = cap(baseline + 0.7);
    const high = cap(Math.min(baseline + 1.3, bestInClass + 0.2));
    return `${low.toFixed(1)} – ${Math.max(high, low).toFixed(1)}`;
  }
  const low = cap(baseline + 0.9);
  const high = cap(bestInClass);
  return `${low.toFixed(1)} – ${Math.max(high, low).toFixed(1)}`;
}

export function buildKeyInsight(
  orgName: string,
  industry: string,
  baseline: number,
  industryPeer: number,
  bestInClass: number,
  aiSummary?: string,
): string {
  if (aiSummary?.trim()) {
    return aiSummary.trim();
  }
  const vsPeer = baseline - industryPeer;
  const peerText =
    vsPeer >= 0.2
      ? `above the average for ${industry} organisations (${industryPeer.toFixed(1)})`
      : vsPeer <= -0.2
        ? `below the average for ${industry} organisations (${industryPeer.toFixed(1)})`
        : `in line with the average for ${industry} organisations (${industryPeer.toFixed(1)})`;
  const gapToBest = bestInClass - baseline;
  const focus =
    gapToBest > 0.8
      ? 'There is meaningful headroom to close the gap with best-in-class peers through targeted quick wins and structured Oaklin support.'
      : 'Focus on sustaining strengths while addressing the competencies with the largest manager–member gaps.';
  return `${orgName}'s overall maturity of ${baseline.toFixed(1)} is ${peerText}. ${focus}`;
}

export interface BenchmarkPageData {
  org: Organisation;
  team: Team;
  engagementTitle: string;
  competencyScores: CompetencyScores;
  benchmarkComparison: Record<Competency, BenchmarkScore>;
  sectorRow: SectorBenchmarkRow;
  keyInsight: string;
  surveys: { id: string; title: string }[];
  selectedSurveyId: string;
}

export async function getManagerBenchmarkPageData(
  uid: string,
  engagementId?: string,
): Promise<BenchmarkPageData | null> {
  const managerData = await getManagerDashboardData(uid, engagementId);
  if (!managerData?.dashboard) return null;

  const { team, dashboard, surveys, selectedSurveyId } = managerData;
  const orgDoc = await adminDb.collection('organisations').doc(team.organisationId).get();
  if (!orgDoc.exists) return null;
  const org = { id: orgDoc.id, ...orgDoc.data() } as Organisation;

  const insightsDoc = await adminDb.collection('insights').doc(dashboard.engagementId).get();
  const insights = insightsDoc.exists ? (insightsDoc.data() as Insights) : null;

  let competencyScores = insights?.competencyScores;
  if (!competencyScores && dashboard.overallScore !== null) {
    const pillars = dashboard.pillars;
    competencyScores = {
      people_relationships: pillars.find((p) => p.competency === 'people_relationships')?.score ?? 0,
      growth_impact: pillars.find((p) => p.competency === 'growth_impact')?.score ?? 0,
      purpose_alignment: pillars.find((p) => p.competency === 'purpose_alignment')?.score ?? 0,
    };
  }
  if (!competencyScores) return null;

  const profileBenchmark = await fetchBenchmarkForProfile(org.industry, team.function, team.size);
  const benchmarkComparison =
    insights?.benchmarkComparison ?? buildBenchmarkComparison(competencyScores, profileBenchmark);

  const benchmarksSnap = await adminDb.collection('benchmarks').orderBy('industry').get();
  const allBenchmarks = benchmarksSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Benchmark[];

  const engDoc = await adminDb.collection('engagements').doc(dashboard.engagementId).get();
  const engagementTitle =
    (engDoc.data()?.title as string | undefined) || `${team.name} survey`;

  const baseline = overallMaturity(competencyScores);
  const industryPeer = averageOf(COMPETENCIES.map((c) => benchmarkComparison[c].industryAverage));
  const bestInClass = averageOf(COMPETENCIES.map((c) => benchmarkComparison[c].bestInClass));

  return {
    org,
    team,
    engagementTitle,
    competencyScores,
    benchmarkComparison,
    sectorRow: getSectorBenchmarkForIndustry(allBenchmarks, org.industry),
    keyInsight: buildKeyInsight(org.name, org.industry, baseline, industryPeer, bestInClass, insights?.aiSummary),
    surveys,
    selectedSurveyId: selectedSurveyId ?? dashboard.engagementId,
  };
}
