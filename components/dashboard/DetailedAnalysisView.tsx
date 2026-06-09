'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';
import {
  DASHBOARD_NOT_AVAILABLE,
  type DetailedAnalysisData,
  type DetailedCompetencyBreakdown,
  type QuestionBreakdown,
} from '@/lib/dashboard-types';
import RadarChartWrapper, { type WrapperDataPoint } from '@/components/charts/RadarChartWrapper';

const COMPETENCY_ICONS: Record<Competency, string> = {
  people_relationships: '👥',
  growth_impact: '🌱',
  purpose_alignment: '🎯',
};

const COMPETENCIES: Competency[] = [
  'people_relationships',
  'growth_impact',
  'purpose_alignment',
];

const LEVEL_LABELS = ['Ad Hoc', 'Informal', 'Defined', 'Managed', 'Optimised'];

function isNA(text: string | null | undefined) {
  return !text || text === DASHBOARD_NOT_AVAILABLE;
}

// ─── Distribution bar row ─────────────────────────────────────────────────────
function DistributionRow({
  level,
  pct,
  criteriaText,
  color = 'bg-orbit-forest',
}: {
  level: number;
  pct: number | null;
  criteriaText?: string;
  color?: string;
}) {
  const label = criteriaText ? `${level} – ${criteriaText}` : `${level} – ${LEVEL_LABELS[level - 1]}`;

  return (
    <div className="flex items-start gap-2 text-xs">
      <div className="flex-shrink-0 w-[44%] leading-tight text-gray-600 pr-1">
        {label}
      </div>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
          <div
            className={`h-full rounded transition-all ${color}`}
            style={{ width: pct !== null ? `${pct}%` : '0%' }}
          />
        </div>
        <span className="w-8 text-right text-gray-500 tabular-nums flex-shrink-0">
          {pct !== null ? `${pct}%` : '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Question card ─────────────────────────────────────────────────────────────
function QuestionCard({
  question,
  breakdown,
}: {
  question: QuestionBreakdown;
  breakdown: DetailedCompetencyBreakdown | undefined;
}) {
  const noData = question.overallScore === null;
  const respondentLabel =
    question.respondentCount > 0
      ? `Total: ${question.respondentCount} respondent${question.respondentCount !== 1 ? 's' : ''}`
      : '';

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white flex flex-col">
      {/* Card header row */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-orbit-dark leading-snug">
            {question.questionSubtext ?? question.questionText}
          </p>
          {question.questionSubtext && (
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{question.questionText}</p>
          )}
        </div>
        {!noData && (
          <span className="flex-shrink-0 text-xl font-bold text-orbit-forest leading-none pt-0.5">
            {question.overallScore!.toFixed(1)}
          </span>
        )}
      </div>

      {/* Body: two columns */}
      <div className="flex flex-1 divide-x divide-gray-100">

        {/* ── Left: scores + distribution ── */}
        <div className="w-[52%] flex-shrink-0 px-4 py-4 space-y-3">

          {/* Manager / Member score pills */}
          {!noData && (question.managerScore !== null || question.memberScore !== null) && (
            <div className="grid grid-cols-2 gap-2">
              {question.managerScore !== null && (
                <div className="bg-green-50 rounded px-2 py-1.5">
                  <p className="text-2xs text-gray-500">Manager</p>
                  <p className="text-sm font-bold text-orbit-forest">{question.managerScore.toFixed(1)}</p>
                  {question.managerCriteriaLabel && (
                    <p className="text-2xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                      {question.managerCriteriaLabel}
                    </p>
                  )}
                </div>
              )}
              {question.memberScore !== null && (
                <div className="bg-amber-50 rounded px-2 py-1.5">
                  <p className="text-2xs text-gray-500">Members</p>
                  <p className="text-sm font-bold text-orbit-amber">{question.memberScore.toFixed(1)}</p>
                  {question.memberCriteriaLabel && (
                    <p className="text-2xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                      {question.memberCriteriaLabel}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Response Distribution */}
          <div>
            <p className="text-2xs font-semibold text-gray-500 mb-2">
              Response Distribution
              {respondentLabel && (
                <span className="font-normal text-gray-400"> ({respondentLabel})</span>
              )}:
            </p>
            <div className="space-y-1.5">
              {question.overallDistribution.map(({ level, pct }) => (
                <DistributionRow
                  key={level}
                  level={level}
                  pct={pct}
                  criteriaText={question.criteria[String(level)]}
                  color={
                    level <= 2 ? 'bg-red-300' :
                    level === 3 ? 'bg-amber-300' :
                    level === 4 ? 'bg-orbit-green' :
                    'bg-orbit-forest'
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: AI insight, quick win, Oaklin support ── */}
        <div className="flex-1 px-4 py-4 space-y-4 bg-gray-50/60">
          {/* INSIGHT */}
          <div>
            <p className="text-2xs font-bold text-orbit-amber uppercase tracking-wide flex items-center gap-1 mb-1.5">
              💡 Insight
            </p>
            <p
              className={`text-xs leading-relaxed ${
                isNA(breakdown?.aiInsight) ? 'text-gray-400 italic' : 'text-gray-700'
              }`}
            >
              {breakdown?.aiInsight ?? DASHBOARD_NOT_AVAILABLE}
            </p>
          </div>

          {/* QUICK WIN */}
          <div>
            <p className="text-2xs font-bold text-orbit-green uppercase tracking-wide flex items-center gap-1 mb-1.5">
              🚀 Quick Win
            </p>
            {breakdown?.quickWin && !isNA(breakdown.quickWin.title) ? (
              <>
                <p className="text-xs font-semibold text-orbit-dark leading-snug">
                  {breakdown.quickWin.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                  {breakdown.quickWin.description}
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
            {breakdown?.oaklinSupport && !isNA(breakdown.oaklinSupport.title) ? (
              <p className="text-xs text-gray-600 leading-snug">
                {breakdown.oaklinSupport.description}
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
    questionBreakdowns,
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

  const visibleQuestions =
    selectedPillar === 'all'
      ? questionBreakdowns
      : questionBreakdowns.filter((q) => q.competency === selectedPillar);

  // Group visible questions by competency
  const grouped = COMPETENCIES.reduce<Record<Competency, QuestionBreakdown[]>>(
    (acc, c) => {
      acc[c] = visibleQuestions.filter((q) => q.competency === c);
      return acc;
    },
    { people_relationships: [], growth_impact: [], purpose_alignment: [] },
  );

  const competenciesToShow =
    selectedPillar === 'all'
      ? COMPETENCIES.filter((c) => grouped[c].length > 0)
      : ([selectedPillar] as Competency[]);

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
            Detailed breakdown of operational maturity competencies with response distribution analysis
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

      {/* Main layout: radar left + question cards right */}
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

          {/* Competency scores legend */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-4 py-4 space-y-3">
            <p className="text-2xs font-semibold text-gray-500 uppercase tracking-wide">
              Pillar Scores
            </p>
            {COMPETENCIES.map((c) => {
              const bd = competencyBreakdown.find((b) => b.competency === c);
              return (
                <div key={c}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{COMPETENCY_ICONS[c]} {COMPETENCY_LABELS[c]}</span>
                    <span className="font-bold text-orbit-forest">
                      {bd?.score?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-orbit-forest rounded-full"
                      style={{ width: bd?.score ? `${(bd.score / 5) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question cards — grouped by competency */}
        <div className="flex-1 space-y-8 min-w-0">
          {questionBreakdowns.length === 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 px-8 py-16 text-center">
              <p className="text-sm text-gray-500">
                No survey responses yet. Question-level breakdowns will appear once respondents have completed the survey.
              </p>
            </div>
          ) : (
            competenciesToShow.map((competency) => {
              const questions = grouped[competency];
              if (questions.length === 0) return null;
              const bd = competencyBreakdown.find((b) => b.competency === competency);

              return (
                <div key={competency} className="space-y-3">
                  {/* Competency section header */}
                  <div className="flex items-center gap-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{COMPETENCY_ICONS[competency]}</span>
                      <h2 className="text-base font-bold text-orbit-dark">
                        {COMPETENCY_LABELS[competency]}
                      </h2>
                    </div>
                    {bd?.score !== null && bd?.score !== undefined && (
                      <span className="text-sm font-bold text-orbit-forest bg-green-50 px-2 py-0.5 rounded">
                        {bd.score.toFixed(1)}
                      </span>
                    )}
                    {bd?.industryAverage !== null && bd?.industryAverage !== undefined && (
                      <span className="text-xs text-gray-500">
                        vs industry avg {bd.industryAverage.toFixed(1)}
                        {bd.delta !== null && (
                          <span className={bd.delta >= 0 ? 'text-orbit-green font-semibold' : 'text-red-600 font-semibold'}>
                            {' '}({bd.delta >= 0 ? '+' : ''}{bd.delta.toFixed(1)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Question cards */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {questions.map((q) => (
                      <QuestionCard key={q.questionId} question={q} breakdown={bd} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
