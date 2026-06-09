'use client';

import { useState, useMemo } from 'react';
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

// SVG icon components — green circle with white icon
function CompetencyIcon({ competency, size = 'md' }: { competency: Competency; size?: 'sm' | 'md' | 'lg' }) {
  const circle = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const icon = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';

  const paths: Record<Competency, React.ReactNode> = {
    people_relationships: (
      <svg className={`${icon} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a4 4 0 00-5.916-3.519M17 20H7m10 0v-2a5.978 5.978 0 00-.94-3.254M7 20H2v-2a4 4 0 015.916-3.519M7 20v-2c0-1.116.384-2.142 1.024-2.957M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM3 10a2 2 0 114 0 2 2 0 01-4 0z" />
      </svg>
    ),
    growth_impact: (
      <svg className={`${icon} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    purpose_alignment: (
      <svg className={`${icon} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  };

  return (
    <div className={`${circle} rounded-full bg-orbit-forest flex items-center justify-center flex-shrink-0`}>
      {paths[competency]}
    </div>
  );
}

const COMPETENCY_COLORS: Record<Competency, { border: string; bg: string; text: string; pill: string }> = {
  people_relationships: {
    border: 'border-orbit-forest',
    bg: 'bg-orbit-forest/5',
    text: 'text-orbit-forest',
    pill: 'bg-orbit-forest/10 text-orbit-forest',
  },
  growth_impact: {
    border: 'border-orbit-forest',
    bg: 'bg-orbit-forest/5',
    text: 'text-orbit-forest',
    pill: 'bg-orbit-forest/10 text-orbit-forest',
  },
  purpose_alignment: {
    border: 'border-orbit-forest',
    bg: 'bg-orbit-forest/5',
    text: 'text-orbit-forest',
    pill: 'bg-orbit-forest/10 text-orbit-forest',
  },
};

const COMPETENCIES: Competency[] = [
  'people_relationships',
  'growth_impact',
  'purpose_alignment',
];

function isNA(text: string | null | undefined) {
  return !text || text === DASHBOARD_NOT_AVAILABLE;
}

// ─── Response Frequency horizontal bar ───────────────────────────────────────
function FreqBar({ level, count, maxCount }: { level: number; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const levelLabels = ['Ad Hoc', 'Informal', 'Defined', 'Managed', 'Optimised'];
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-20 text-gray-500 flex-shrink-0">Answer {level}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full rounded bg-orbit-forest transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-gray-600 font-semibold tabular-nums flex-shrink-0">{count}</span>
      <span className="hidden xl:block w-20 text-gray-400 flex-shrink-0">{levelLabels[level - 1]}</span>
    </div>
  );
}

// ─── Distribution bar (for question cards) ───────────────────────────────────
function DistBar({ level, pct, criteriaText }: { level: number; pct: number | null; criteriaText?: string }) {
  const defaultLabels = ['Ad Hoc', 'Informal', 'Defined', 'Managed', 'Optimised'];
  const label = criteriaText ? `${level} — ${criteriaText}` : `${level} — ${defaultLabels[level - 1]}`;
  const barColor = level <= 2 ? 'bg-red-300' : level === 3 ? 'bg-amber-300' : level === 4 ? 'bg-orbit-green' : 'bg-orbit-forest';
  return (
    <div className="flex items-start gap-2 text-xs">
      <div className="w-[50%] flex-shrink-0 text-gray-600 leading-tight pr-1 break-words">{label}</div>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
          <div className={`h-full rounded transition-all ${barColor}`} style={{ width: pct !== null ? `${pct}%` : '0%' }} />
        </div>
        <span className="w-8 text-right text-gray-500 tabular-nums flex-shrink-0">
          {pct !== null ? `${pct}%` : '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────
function QuestionCard({ question, breakdown }: { question: QuestionBreakdown; breakdown: DetailedCompetencyBreakdown | undefined }) {
  const noData = question.overallScore === null;
  const cardTitle = question.questionSubtext ?? question.questionText;
  const assessmentQuestion = question.questionSubtext ? question.questionText : null;
  const aiInsight = breakdown?.aiInsight;
  const quickWin = breakdown?.quickWin;
  const oaklinSupport = breakdown?.oaklinSupport;
  const respondentLine = question.respondentCount > 0
    ? `${question.respondentCount} respondent${question.respondentCount !== 1 ? 's' : ''}`
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-bold text-orbit-dark leading-snug flex-1 min-w-0">{cardTitle}</p>
        <span className={['flex-shrink-0 font-bold leading-none pt-0.5', noData ? 'text-sm text-gray-400 italic' : 'text-xl text-orbit-forest'].join(' ')}>
          {noData ? '—' : question.overallScore!.toFixed(1)}
        </span>
      </div>

      <div className="flex divide-x divide-gray-100">
        {/* Left: question + scores + distribution */}
        <div className="w-[55%] flex-shrink-0 px-4 py-4 space-y-3">
          <div>
            <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Assessment Question</p>
            <p className="text-xs text-gray-600 leading-snug">{assessmentQuestion ?? question.questionText}</p>
          </div>

          {(question.managerScore !== null || question.memberScore !== null) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded px-2 py-1.5">
                <p className="text-2xs text-gray-400">Manager</p>
                <p className="text-sm font-bold text-orbit-forest">{question.managerScore?.toFixed(1) ?? '—'}</p>
                {question.managerCriteriaLabel && (
                  <p className="text-2xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{question.managerCriteriaLabel}</p>
                )}
              </div>
              <div className="bg-amber-50 rounded px-2 py-1.5">
                <p className="text-2xs text-gray-400">Members</p>
                <p className="text-sm font-bold text-orbit-amber">{question.memberScore?.toFixed(1) ?? '—'}</p>
                {question.memberCriteriaLabel && (
                  <p className="text-2xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{question.memberCriteriaLabel}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-2xs font-semibold text-gray-500 mb-2">
              Response Distribution{respondentLine && <span className="font-normal text-gray-400"> (n={respondentLine})</span>}:
            </p>
            <div className="space-y-2">
              {question.overallDistribution.map(({ level, pct }) => (
                <DistBar key={level} level={level} pct={pct} criteriaText={question.criteria[String(level)]} />
              ))}
            </div>
          </div>

          {breakdown?.industryAverage != null && (
            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-2xs text-gray-500">
              <div>
                <span className="block text-gray-400">Industry avg</span>
                <span className="font-semibold text-orbit-dark">{breakdown.industryAverage.toFixed(1)}</span>
              </div>
              {breakdown.bestInClass != null && (
                <div>
                  <span className="block text-gray-400">Best in class</span>
                  <span className="font-semibold text-orbit-green">{breakdown.bestInClass.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: AI sections */}
        <div className="flex-1 px-4 py-4 space-y-4 bg-gray-50/70">
          <div>
            <p className="text-2xs font-bold text-orbit-amber uppercase tracking-wide mb-1.5">💡 Insight</p>
            <p className={`text-xs leading-relaxed ${isNA(aiInsight) ? 'text-gray-400 italic' : 'text-gray-700'}`}>
              {aiInsight ?? DASHBOARD_NOT_AVAILABLE}
            </p>
          </div>
          <div>
            <p className="text-2xs font-bold text-orbit-green uppercase tracking-wide mb-1.5">🚀 Quick Win</p>
            {quickWin && !isNA(quickWin.title) ? (
              <>
                <p className="text-xs font-semibold text-orbit-dark leading-snug">{quickWin.title}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-snug">{quickWin.description}</p>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">{DASHBOARD_NOT_AVAILABLE}</p>
            )}
          </div>
          <div>
            <p className="text-2xs font-bold text-orbit-forest uppercase tracking-wide mb-1.5">— How Oaklin Can Support</p>
            {oaklinSupport && !isNA(oaklinSupport.title) ? (
              <p className="text-xs text-gray-600 leading-snug">{oaklinSupport.description}</p>
            ) : (
              <p className="text-xs text-gray-400 italic">{DASHBOARD_NOT_AVAILABLE}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Competency summary card ──────────────────────────────────────────────────
function CompetencyCard({ competency, breakdown, actionCount }: {
  competency: Competency;
  breakdown: DetailedCompetencyBreakdown | undefined;
  actionCount: number;
}) {
  const colors = COMPETENCY_COLORS[competency];
  const score = breakdown?.score;
  const mgrScore = breakdown?.managerScore;
  const memScore = breakdown?.memberScore;
  const insight = breakdown?.aiInsight;
  const quickWin = breakdown?.quickWin;

  return (
    <div className={`rounded-xl bg-white border-2 ${colors.border} shadow-sm overflow-hidden flex flex-col`}>
      {/* Card header */}
      <div className={`px-5 py-4 ${colors.bg} border-b ${colors.border} border-opacity-30`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CompetencyIcon competency={competency} size="sm" />
            <h3 className="text-sm font-bold text-orbit-dark leading-snug">
              {COMPETENCY_LABELS[competency]}
            </h3>
          </div>
          {score != null && (
            <span className={`text-2xl font-bold ${colors.text}`}>{score.toFixed(1)}</span>
          )}
        </div>
        {/* Score bar */}
        <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.border.replace('border-', 'bg-')}`}
            style={{ width: score != null ? `${(score / 5) * 100}%` : '0%' }}
          />
        </div>
        <p className="text-2xs text-gray-500 mt-1.5">
          {score != null ? `${score.toFixed(1)} / 5.0` : 'No data'}
          {mgrScore != null && memScore != null && (
            <span className="ml-2">
              · Manager {mgrScore.toFixed(1)} · Members {memScore.toFixed(1)}
            </span>
          )}
        </p>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex-1 space-y-3">
        {/* AI insight */}
        <p className={`text-xs leading-relaxed ${isNA(insight) ? 'text-gray-400 italic' : 'text-gray-700'}`}>
          {!isNA(insight) ? insight : 'Insight will be available once AI analysis has been run.'}
        </p>

        {/* Quick win */}
        {quickWin && !isNA(quickWin.title) && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-2xs font-bold text-orbit-green uppercase tracking-wide mb-1">Quick Win</p>
            <p className="text-xs font-semibold text-orbit-dark">{quickWin.title}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`px-5 py-3 border-t border-gray-100 ${colors.bg}`}>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${colors.pill}`}>
          {actionCount} action{actionCount !== 1 ? 's' : ''} recommended
        </span>
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

export default function DetailedAnalysisView({ data, backHref }: DetailedAnalysisViewProps) {
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

  // Aggregate response frequency across all questions
  const freqTotals = useMemo(() => {
    const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    questionBreakdowns.forEach((q) => {
      q.overallDistribution.forEach(({ level, pct }) => {
        if (pct !== null && q.respondentCount > 0) {
          totals[level] = (totals[level] ?? 0) + Math.round((pct / 100) * q.respondentCount);
        }
      });
    });
    return totals;
  }, [questionBreakdowns]);
  const freqMax = Math.max(...Object.values(freqTotals));
  const freqTotal = Object.values(freqTotals).reduce((a, b) => a + b, 0);

  // Count actions per competency (quick wins that are non-null)
  const actionCounts = useMemo(() => {
    const counts: Record<Competency, number> = {
      people_relationships: 0,
      growth_impact: 0,
      purpose_alignment: 0,
    };
    competencyBreakdown.forEach((b) => {
      if (b.quickWin && !isNA(b.quickWin.title)) counts[b.competency] += 1;
      if (b.oaklinSupport && !isNA(b.oaklinSupport.title)) counts[b.competency] += 1;
    });
    return counts;
  }, [competencyBreakdown]);

  // Gather recommended actions (quick wins) for sidebar
  const recommendedActions = useMemo(() =>
    COMPETENCIES.flatMap((c) => {
      const bd = competencyBreakdown.find((b) => b.competency === c);
      if (!bd?.quickWin || isNA(bd.quickWin.title)) return [];
      return [{ competency: c, title: bd.quickWin.title, description: bd.quickWin.description ?? '' }];
    }), [competencyBreakdown]);

  const visibleQuestions = selectedPillar === 'all'
    ? questionBreakdowns
    : questionBreakdowns.filter((q) => q.competency === selectedPillar);

  const grouped = COMPETENCIES.reduce<Record<Competency, QuestionBreakdown[]>>(
    (acc, c) => { acc[c] = visibleQuestions.filter((q) => q.competency === c); return acc; },
    { people_relationships: [], growth_impact: [], purpose_alignment: [] },
  );

  const competenciesToShow = selectedPillar === 'all' ? COMPETENCIES : ([selectedPillar] as Competency[]);

  return (
    <div className="space-y-6">
      <Link href={backHref} className="text-sm text-orbit-green hover:underline inline-block">
        ← Back to dashboard
      </Link>

      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">Operational Maturity Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organisation operational maturity overview — detailed breakdown across all pillars
          </p>
        </div>
        <select
          disabled
          value={teamName}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-orbit-dark font-semibold min-w-[140px]"
        >
          <option value={teamName}>{teamName}</option>
        </select>
      </div>

      {/* ── Top section: charts + sidebar ─────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* Charts area (left + middle) */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Two-panel chart row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Spider diagram */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-orbit-dark">Overall Maturity &amp; Benchmark</p>
                {overallScore !== null && (
                  <span className="text-sm font-bold text-orbit-forest">{overallScore.toFixed(1)} / 5</span>
                )}
              </div>
              {radarData ? (
                <RadarChartWrapper data={radarData} />
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No radar data yet</p>
                  <p className="text-xs text-gray-400 mt-1">Survey responses will populate this chart</p>
                </div>
              )}
              {/* Maturity label strip */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orbit-forest rounded-full"
                    style={{ width: overallScore !== null ? `${(overallScore / 5) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0 font-medium">{maturityLabel}</span>
              </div>
            </div>

            {/* Response Frequency */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-orbit-dark">Response Frequency (by Answer)</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm bg-orbit-forest inline-block" />
                  Responses
                </div>
              </div>
              <div className="px-5 py-5 space-y-3">
                {freqTotal === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-gray-400">No responses recorded yet</p>
                  </div>
                ) : (
                  [1, 2, 3, 4, 5].map((level) => (
                    <FreqBar key={level} level={level} count={freqTotals[level] ?? 0} maxCount={freqMax} />
                  ))
                )}
              </div>
              {freqTotal > 0 && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                    Number of Responses · <span className="font-semibold text-orbit-dark">{freqTotal.toLocaleString()}</span> total responses tracked
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pillar scores quick strip */}
          <div className="grid grid-cols-3 gap-3">
            {COMPETENCIES.map((c) => {
              const bd = competencyBreakdown.find((b) => b.competency === c);
              const colors = COMPETENCY_COLORS[c];
              return (
                <div key={c} className={`rounded-lg border ${colors.border} ${colors.bg} px-4 py-3 flex items-center gap-3`}>
                  <CompetencyIcon competency={c} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-orbit-dark truncate">{COMPETENCY_LABELS[c]}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors.border.replace('border-', 'bg-')}`}
                          style={{ width: bd?.score != null ? `${(bd.score / 5) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${colors.text}`}>
                        {bd?.score?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar: Recommended actions */}
        {recommendedActions.length > 0 && (
          <div className="hidden xl:flex flex-col gap-3 w-64 flex-shrink-0">
            <div className="rounded-xl bg-orbit-forest text-white px-5 py-4">
              <p className="text-sm font-bold leading-snug">Recommended Actions for High Performance</p>
            </div>
            {recommendedActions.map((action, i) => {
              const colors = COMPETENCY_COLORS[action.competency];
              return (
                <div key={i} className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <div className={`px-4 py-1.5 ${colors.bg}`}>
                    <div className={`flex items-center gap-1.5`}>
                      <CompetencyIcon competency={action.competency} size="sm" />
                      <p className={`text-2xs font-semibold uppercase tracking-wide ${colors.text}`}>
                        {COMPETENCY_LABELS[action.competency]}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs font-bold text-orbit-dark leading-snug">
                      Action: {action.title}
                    </p>
                    {action.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-3">{action.description}</p>
                    )}
                    <Link
                      href={`${backHref}#actions`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white bg-orbit-forest rounded px-3 py-1 hover:bg-orbit-green transition-colors"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Competency summary cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COMPETENCIES.map((c) => (
          <CompetencyCard
            key={c}
            competency={c}
            breakdown={competencyBreakdown.find((b) => b.competency === c)}
            actionCount={actionCounts[c]}
          />
        ))}
      </div>

      {/* ── Detailed question section ──────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Section header + pillar filter */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <h2 className="text-base font-bold text-orbit-dark">Detailed Question Breakdown</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="pillar-select" className="text-sm text-gray-500 whitespace-nowrap">Pillar:</label>
            <select
              id="pillar-select"
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value as Competency | 'all')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-orbit-dark font-semibold"
            >
              <option value="all">All Pillars</option>
              {COMPETENCIES.map((c) => (
                <option key={c} value={c}>{COMPETENCY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-1">
          {[
            { label: 'Level 1–2 (Ad Hoc / Informal)', color: 'bg-red-300' },
            { label: 'Level 3 (Defined)', color: 'bg-amber-300' },
            { label: 'Level 4 (Managed)', color: 'bg-orbit-green' },
            { label: 'Level 5 (Optimised)', color: 'bg-orbit-forest' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm inline-block ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>

        {/* Question cards grouped by competency */}
        {competenciesToShow.map((competency) => {
          const questions = grouped[competency];
          const bd = competencyBreakdown.find((b) => b.competency === competency);
          const colors = COMPETENCY_COLORS[competency];

          return (
            <div key={competency}>
              {/* Section band */}
              <div className={`bg-orbit-forest rounded-t-xl px-5 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CompetencyIcon competency={competency} size="sm" />
                  </div>
                  <h2 className="text-sm font-bold text-white">{COMPETENCY_LABELS[competency]}</h2>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-200 font-semibold">
                    {bd?.score != null ? bd.score.toFixed(1) : '—'}
                  </span>
                  {bd?.industryAverage != null && (
                    <span className="text-green-300 text-xs">
                      vs avg {bd.industryAverage.toFixed(1)}
                      {bd.delta != null && (
                        <span className={bd.delta >= 0 ? ' text-green-200' : ' text-red-300'}>
                          {' '}({bd.delta >= 0 ? '+' : ''}{bd.delta.toFixed(1)})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 border border-t-0 border-orbit-forest/20 rounded-b-xl overflow-hidden">
                {questions.length === 0 ? (
                  <div className="col-span-2 px-8 py-10 text-center text-sm text-gray-400 bg-white">
                    No questions found for this competency.
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div
                      key={q.questionId}
                      className={[
                        idx % 2 === 0 && questions.length > 1 ? 'xl:border-r xl:border-gray-100' : '',
                        idx >= 2 ? 'border-t border-gray-100' : '',
                        idx >= 1 && idx % 2 !== 0 ? 'border-t border-gray-100 xl:border-t-0' : '',
                      ].join(' ')}
                    >
                      <QuestionCard question={q} breakdown={bd} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
