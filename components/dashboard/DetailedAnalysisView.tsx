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

function isNA(text: string | null | undefined) {
  return !text || text === DASHBOARD_NOT_AVAILABLE;
}

// ─── Response distribution bar ───────────────────────────────────────────────
function DistBar({
  level,
  pct,
  criteriaText,
}: {
  level: number;
  pct: number | null;
  criteriaText?: string;
}) {
  const defaultLabels = ['Ad Hoc', 'Informal', 'Defined', 'Managed', 'Optimised'];
  const label = criteriaText
    ? `${level} - ${criteriaText}`
    : `${level} - ${defaultLabels[level - 1]}`;

  const barColor =
    level <= 2 ? 'bg-red-300' :
    level === 3 ? 'bg-amber-300' :
    level === 4 ? 'bg-orbit-green' :
    'bg-orbit-forest';

  return (
    <div className="flex items-start gap-2 text-xs">
      {/* Label — takes 50% of width */}
      <div className="w-[50%] flex-shrink-0 text-gray-600 leading-tight pr-1 break-words">
        {label}
      </div>
      {/* Bar + percentage */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
          <div
            className={`h-full rounded transition-all ${barColor}`}
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

// ─── Question card ────────────────────────────────────────────────────────────
function QuestionCard({
  question,
  breakdown,
}: {
  question: QuestionBreakdown;
  breakdown: DetailedCompetencyBreakdown | undefined;
}) {
  const noData = question.overallScore === null;
  const respondentLine =
    question.respondentCount > 0
      ? `Total: ${question.respondentCount} respondent${question.respondentCount !== 1 ? 's' : ''}`
      : null;

  // Use subtext as the short "title" if available, otherwise derive from questionText
  const cardTitle = question.questionSubtext ?? question.questionText;
  // If we used subtext as title, show the full question text under "Assessment Question:"
  const assessmentQuestion = question.questionSubtext ? question.questionText : null;

  const aiInsight = breakdown?.aiInsight;
  const quickWin = breakdown?.quickWin;
  const oaklinSupport = breakdown?.oaklinSupport;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── Card header: title + score ── */}
      <div className="px-4 py-3 flex items-start justify-between gap-3 border-b border-gray-100">
        <p className="text-sm font-bold text-orbit-dark leading-snug flex-1 min-w-0">
          {cardTitle}
        </p>
        <span
          className={[
            'flex-shrink-0 font-bold leading-none pt-0.5',
            noData ? 'text-sm text-gray-400 italic' : 'text-xl text-orbit-forest',
          ].join(' ')}
        >
          {noData ? DASHBOARD_NOT_AVAILABLE : question.overallScore!.toFixed(1)}
        </span>
      </div>

      {/* ── Card body: left (question + distribution) | right (AI) ── */}
      <div className="flex divide-x divide-gray-100">

        {/* Left: assessment question + scores + distribution */}
        <div className="w-[55%] flex-shrink-0 px-4 py-4 space-y-3">

          {/* Assessment Question */}
          {assessmentQuestion && (
            <div>
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Assessment Question
              </p>
              <p className="text-xs text-gray-600 leading-snug">{assessmentQuestion}</p>
            </div>
          )}
          {!assessmentQuestion && (
            <div>
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Assessment Question
              </p>
              <p className="text-xs text-gray-600 leading-snug">{question.questionText}</p>
            </div>
          )}

          {/* Manager / Member score pills */}
          {(question.managerScore !== null || question.memberScore !== null) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded px-2 py-1.5">
                <p className="text-2xs text-gray-400">Manager</p>
                <p className="text-sm font-bold text-orbit-forest">
                  {question.managerScore?.toFixed(1) ?? '—'}
                </p>
                {question.managerCriteriaLabel && (
                  <p className="text-2xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                    {question.managerCriteriaLabel}
                  </p>
                )}
              </div>
              <div className="bg-amber-50 rounded px-2 py-1.5">
                <p className="text-2xs text-gray-400">Members</p>
                <p className="text-sm font-bold text-orbit-amber">
                  {question.memberScore?.toFixed(1) ?? '—'}
                </p>
                {question.memberCriteriaLabel && (
                  <p className="text-2xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                    {question.memberCriteriaLabel}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Response distribution */}
          <div>
            <p className="text-2xs font-semibold text-gray-500 mb-2">
              Response Distribution
              {respondentLine && (
                <span className="font-normal text-gray-400"> ({respondentLine})</span>
              )}:
            </p>
            <div className="space-y-2">
              {question.overallDistribution.map(({ level, pct }) => (
                <DistBar
                  key={level}
                  level={level}
                  pct={pct}
                  criteriaText={question.criteria[String(level)]}
                />
              ))}
            </div>
          </div>

          {/* Benchmark (if available) */}
          {breakdown?.industryAverage !== null && breakdown?.industryAverage !== undefined && (
            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-2xs text-gray-500">
              <div>
                <span className="block text-gray-400">Industry avg</span>
                <span className="font-semibold text-orbit-dark">
                  {breakdown.industryAverage.toFixed(1)}
                </span>
              </div>
              {breakdown.bestInClass !== null && (
                <div>
                  <span className="block text-gray-400">Best in class</span>
                  <span className="font-semibold text-orbit-green">
                    {breakdown.bestInClass.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: AI sections */}
        <div className="flex-1 px-4 py-4 space-y-4 bg-gray-50/70">

          {/* INSIGHT */}
          <div>
            <p className="text-2xs font-bold text-orbit-amber uppercase tracking-wide mb-1.5">
              💡 Insight
            </p>
            <p className={`text-xs leading-relaxed ${isNA(aiInsight) ? 'text-gray-400 italic' : 'text-gray-700'}`}>
              {aiInsight ?? DASHBOARD_NOT_AVAILABLE}
            </p>
          </div>

          {/* QUICK WIN */}
          <div>
            <p className="text-2xs font-bold text-orbit-green uppercase tracking-wide mb-1.5">
              🚀 Quick Win
            </p>
            {quickWin && !isNA(quickWin.title) ? (
              <>
                <p className="text-xs font-semibold text-orbit-dark leading-snug">
                  {quickWin.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                  {quickWin.description}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">{DASHBOARD_NOT_AVAILABLE}</p>
            )}
          </div>

          {/* HOW OAKLIN CAN SUPPORT */}
          <div>
            <p className="text-2xs font-bold text-orbit-forest uppercase tracking-wide mb-1.5">
              — How Oaklin Can Support
            </p>
            {oaklinSupport && !isNA(oaklinSupport.title) ? (
              <p className="text-xs text-gray-600 leading-snug">
                {oaklinSupport.description}
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

  // Filter questions by selected pillar
  const visibleQuestions =
    selectedPillar === 'all'
      ? questionBreakdowns
      : questionBreakdowns.filter((q) => q.competency === selectedPillar);

  // Group by competency
  const grouped = COMPETENCIES.reduce<Record<Competency, QuestionBreakdown[]>>(
    (acc, c) => {
      acc[c] = visibleQuestions.filter((q) => q.competency === c);
      return acc;
    },
    { people_relationships: [], growth_impact: [], purpose_alignment: [] },
  );

  const competenciesToShow =
    selectedPillar === 'all'
      ? COMPETENCIES
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
            Detailed breakdown of operational maturity competencies and components with
            response distribution analysis
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="pillar-select" className="text-sm text-gray-500 font-semibold whitespace-nowrap">
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
          Insights, quick wins, and Oaklin support recommendations will populate once AI analysis
          has been run. Score distributions will update as survey responses come in.
        </div>
      )}

      {/* Main layout: radar left + question cards right */}
      <div className="flex gap-4 items-start">

        {/* Radar + score panel — left sidebar */}
        <div className="hidden lg:flex flex-col gap-3 w-52 flex-shrink-0">

          {/* Radar chart */}
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

          {/* Overall score */}
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
                className="h-1.5 bg-orbit-green rounded-full transition-all"
                style={{ width: overallScore !== null ? `${(overallScore / 5) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* Pillar score summary */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-4 py-4 space-y-3">
            <p className="text-2xs font-semibold text-gray-500 uppercase tracking-wide">
              Pillar Scores
            </p>
            {COMPETENCIES.map((c) => {
              const bd = competencyBreakdown.find((b) => b.competency === c);
              return (
                <div key={c}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">
                      {COMPETENCY_ICONS[c]}{' '}
                      {COMPETENCY_LABELS[c].split(' & ')[0]}
                    </span>
                    <span
                      className={
                        bd?.score != null
                          ? 'font-bold text-orbit-forest'
                          : 'text-gray-400 italic text-2xs'
                      }
                    >
                      {bd?.score?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-orbit-forest rounded-full transition-all"
                      style={{ width: bd?.score != null ? `${(bd.score / 5) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-4 py-4 space-y-1.5">
            <p className="text-2xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Distribution key
            </p>
            {[
              { label: 'Level 1–2 (Ad Hoc / Informal)', color: 'bg-red-300' },
              { label: 'Level 3 (Defined)', color: 'bg-amber-300' },
              { label: 'Level 4 (Managed)', color: 'bg-orbit-green' },
              { label: 'Level 5 (Optimised)', color: 'bg-orbit-forest' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${item.color}`} />
                <span className="text-2xs text-gray-500 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question cards — grouped by competency */}
        <div className="flex-1 space-y-8 min-w-0">
          {competenciesToShow.map((competency) => {
            const questions = grouped[competency];
            const bd = competencyBreakdown.find((b) => b.competency === competency);

            return (
              <div key={competency}>
                {/* Competency section header — dark green band */}
                <div className="bg-orbit-forest rounded-t-xl px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{COMPETENCY_ICONS[competency]}</span>
                    <h2 className="text-sm font-bold text-white">
                      {COMPETENCY_LABELS[competency]}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-200 font-semibold">
                      {bd?.score != null ? bd.score.toFixed(1) : DASHBOARD_NOT_AVAILABLE}
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

                {/* Question cards grid */}
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
                          // Add borders between cards in the grid
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
    </div>
  );
}
