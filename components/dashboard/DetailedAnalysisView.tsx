'use client';
/**
 * Operational Maturity Assessment — matches the page 5 mockup.
 * Left: compact radar chart. Right: 2-column grid of pillar cards.
 * Each pillar card: left = score + response distribution bars,
 * right = AI insight + quick win + how Oaklin can support.
 */
import { useState } from 'react';
import Link from 'next/link';
import type { Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';
import {
  DASHBOARD_NOT_AVAILABLE,
  type DetailedAnalysisData,
  type DetailedCompetencyBreakdown,
} from '@/lib/dashboard-types';
import RadarChartWrapper, { type WrapperDataPoint } from '@/components/charts/RadarChartWrapper';

const COMPETENCY_ICONS: Record<Competency, string> = {
  people_relationships: '👥',
  growth_impact: '🌱',
  purpose_alignment: '🎯',
};

const COMPETENCY_DESCRIPTIONS: Record<Competency, string> = {
  people_relationships:
    'How effectively does the team collaborate, communicate, and develop relationships across functions and boundaries?',
  growth_impact:
    'How systematically does the organisation support ongoing learning, skill development, and high performance?',
  purpose_alignment:
    'How clearly are team members aligned to organisational purpose, strategy, and their individual contribution?',
};

const LEVEL_LABELS = ['Ad Hoc', 'Informal', 'Defined', 'Managed', 'Optimised'];

const LEVEL_COLORS = [
  'bg-red-100',
  'bg-orange-100',
  'bg-yellow-100',
  'bg-green-100',
  'bg-emerald-200',
];

const COMPETENCIES: Competency[] = [
  'people_relationships',
  'growth_impact',
  'purpose_alignment',
];

function isNA(text: string | null | undefined) {
  return !text || text === DASHBOARD_NOT_AVAILABLE;
}

// ─── Pillar card ───────────────────────────────────────────────────────────────
function PillarCard({ pillar }: { pillar: DetailedCompetencyBreakdown }) {
  const noData = pillar.score === null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white flex flex-col">
      {/* Dark green header */}
      <div className="bg-orbit-forest px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{COMPETENCY_ICONS[pillar.competency]}</span>
          <span className="text-sm font-bold text-white">
            {COMPETENCY_LABELS[pillar.competency]}
          </span>
        </div>
        {pillar.score !== null && (
          <span className="text-sm font-bold text-green-200">{pillar.score.toFixed(1)}</span>
        )}
      </div>

      {/* Body: two columns */}
      <div className="flex flex-1 divide-x divide-gray-100">
        {/* ── Left: score breakdown + distribution ── */}
        <div className="w-[55%] flex-shrink-0 px-4 py-4 space-y-3">
          {/* Scores */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-xs font-bold text-orbit-dark">
                {COMPETENCY_LABELS[pillar.competency]}
              </p>
              <span
                className={[
                  'font-bold',
                  noData ? 'text-xs text-gray-400 italic' : 'text-base text-orbit-forest',
                ].join(' ')}
              >
                {noData ? DASHBOARD_NOT_AVAILABLE : pillar.score!.toFixed(1)}
              </span>
            </div>
            <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Assessment Area
            </p>
            <p className="text-xs text-gray-600 leading-snug">
              {COMPETENCY_DESCRIPTIONS[pillar.competency]}
            </p>
          </div>

          {/* Manager / Member breakdown */}
          {!noData && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded px-2 py-1.5">
                <p className="text-2xs text-gray-500">Manager</p>
                <p className="text-sm font-bold text-orbit-forest">
                  {pillar.managerScore?.toFixed(1) ?? '—'}
                </p>
              </div>
              <div className="bg-amber-50 rounded px-2 py-1.5">
                <p className="text-2xs text-gray-500">Members</p>
                <p className="text-sm font-bold text-orbit-amber">
                  {pillar.memberScore?.toFixed(1) ?? '—'}
                </p>
              </div>
            </div>
          )}

          {/* Distribution */}
          <div>
            <p className="text-2xs font-semibold text-gray-500 mb-2">
              Response Distribution
              {pillar.respondentCount > 0 && (
                <span className="font-normal text-gray-400">
                  {' '}(Total: {pillar.respondentCount} respondent{pillar.respondentCount !== 1 ? 's' : ''})
                </span>
              )}:
            </p>
            <div className="space-y-1.5">
              {pillar.distribution.map(({ level, pct }) => (
                <div key={level} className="flex items-center gap-1.5">
                  <div className="text-2xs text-gray-500 w-[44%] leading-tight flex-shrink-0 truncate">
                    <span className="font-semibold">{level}</span>
                    {' — '}
                    {LEVEL_LABELS[level - 1]}
                  </div>
                  <div className="flex-1 h-3.5 bg-gray-100 rounded overflow-hidden">
                    <div
                      className={`h-full rounded transition-all ${LEVEL_COLORS[level - 1]}`}
                      style={{ width: pct !== null ? `${pct}%` : '0%' }}
                    />
                  </div>
                  <span className="text-2xs text-gray-500 w-7 text-right flex-shrink-0 tabular-nums">
                    {pct !== null ? `${pct}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Benchmark if available */}
          {pillar.industryAverage !== null && (
            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-2xs text-gray-500">
              <div>
                <span className="block text-gray-400">Industry avg</span>
                <span className="font-semibold text-orbit-dark">
                  {pillar.industryAverage.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="block text-gray-400">Best in class</span>
                <span className="font-semibold text-orbit-green">
                  {pillar.bestInClass?.toFixed(1) ?? '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: AI sections ── */}
        <div className="flex-1 px-4 py-4 space-y-4 bg-gray-50/60">
          {/* INSIGHT */}
          <div>
            <p className="text-2xs font-bold text-orbit-amber uppercase tracking-wide flex items-center gap-1 mb-1.5">
              💡 Insight
            </p>
            <p
              className={`text-xs leading-relaxed ${
                isNA(pillar.aiInsight)
                  ? 'text-gray-400 italic'
                  : 'text-gray-700'
              }`}
            >
              {pillar.aiInsight}
            </p>
          </div>

          {/* QUICK WIN */}
          <div>
            <p className="text-2xs font-bold text-orbit-green uppercase tracking-wide flex items-center gap-1 mb-1.5">
              🚀 Quick Win
            </p>
            {pillar.quickWin ? (
              <>
                <p className="text-xs font-semibold text-orbit-dark leading-snug">
                  {pillar.quickWin.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                  {pillar.quickWin.description}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">{DASHBOARD_NOT_AVAILABLE}</p>
            )}
          </div>

          {/* HOW OAKLIN CAN SUPPORT */}
          <div>
            <p className="text-2xs font-bold text-orbit-forest uppercase tracking-wide flex items-center gap-1 mb-1.5">
              → How Oaklin Can Support
            </p>
            {pillar.oaklinSupport ? (
              <p className="text-xs text-gray-600 leading-snug">
                {pillar.oaklinSupport.description}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">{DASHBOARD_NOT_AVAILABLE}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────
interface DetailedAnalysisViewProps {
  data: DetailedAnalysisData;
  backHref: string;
  showAnalysisBanner?: boolean;
}

export default function DetailedAnalysisView({
  data,
  backHref,
  showAnalysisBanner = false,
}: DetailedAnalysisViewProps) {
  const [selectedPillar, setSelectedPillar] = useState<Competency | 'all'>('all');

  const {
    teamName,
    overallScore,
    maturityLabel,
    competencyBreakdown,
    radarAvailable,
    radarOverall,
    radarManager,
    radarMember,
  } = data;

  const radarData: WrapperDataPoint[] | null =
    radarAvailable && radarOverall && radarManager && radarMember
      ? COMPETENCIES.map((c) => ({
          subject: COMPETENCY_LABELS[c],
          overall: radarOverall[c],
          manager: radarManager[c],
          member: radarMember[c],
          fullMark: 5,
        }))
      : null;

  const visiblePillars =
    selectedPillar === 'all'
      ? competencyBreakdown
      : competencyBreakdown.filter((p) => p.competency === selectedPillar);

  return (
    <div className="space-y-5">
      <Link href={backHref} className="text-sm text-orbit-green hover:underline inline-block">
        ← Back to dashboard
      </Link>

      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">
            Operational Maturity Assessment
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Detailed breakdown of operational maturity competencies and components with
            response distribution analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="pillar-select" className="text-sm text-gray-500 font-semibold">
              View Pillar:
            </label>
            <select
              id="pillar-select"
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value as Competency | 'all')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-orbit-dark font-semibold"
            >
              <option value="all">All Pillars</option>
              {COMPETENCIES.map((c) => (
                <option key={c} value={c}>
                  {COMPETENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <select
            disabled
            value={teamName}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-orbit-dark font-semibold min-w-[140px]"
          >
            <option value={teamName}>{teamName}</option>
          </select>
        </div>
      </div>

      {showAnalysisBanner && !data.hasFullAnalysis && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Insights, quick wins, and Oaklin support recommendations will populate after AI analysis
          is run. Score distributions reflect completed survey responses.
        </div>
      )}

      {/* Main layout: radar left + pillar grid right */}
      <div className="flex gap-4 items-start">
        {/* Radar — compact left panel */}
        <div className="hidden lg:flex flex-col gap-3 w-52 flex-shrink-0">
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="text-xs font-bold text-orbit-dark">Spider Diagram</p>
            </div>
            {radarData ? (
              <RadarChartWrapper data={radarData} />
            ) : (
              <div className="px-4 py-10 text-center text-xs text-gray-400 italic">
                {DASHBOARD_NOT_AVAILABLE}
              </div>
            )}
          </div>

          {/* Overall score beneath radar */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-4 py-4">
            <p className="text-2xs font-semibold text-gray-500 uppercase tracking-wide">
              Overall Maturity
            </p>
            <p
              className={[
                'mt-2 font-bold leading-none',
                overallScore !== null
                  ? 'text-4xl text-orbit-forest'
                  : 'text-lg text-gray-400 italic',
              ].join(' ')}
            >
              {overallScore !== null ? overallScore.toFixed(1) : DASHBOARD_NOT_AVAILABLE}
            </p>
            <p className="text-xs text-gray-500 mt-1.5">Out of 5 ({maturityLabel})</p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-1.5 bg-orbit-green rounded-full"
                style={{
                  width: overallScore !== null ? `${(overallScore / 5) * 100}%` : '0%',
                }}
              />
            </div>
          </div>
        </div>

        {/* Pillar cards grid */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {visiblePillars.map((pillar) => (
            <PillarCard key={pillar.competency} pillar={pillar} />
          ))}
        </div>
      </div>
    </div>
  );
}
