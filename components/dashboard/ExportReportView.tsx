'use client';

import { COMPETENCY_LABELS } from '@/types';
import type { Competency } from '@/types';
import type { EngagementDashboardData, DetailedAnalysisData } from '@/lib/dashboard-types';
import { DASHBOARD_NOT_AVAILABLE } from '@/lib/dashboard-types';

const COMPETENCIES: Competency[] = [
  'people_relationships',
  'growth_impact',
  'purpose_alignment',
];

const COMPETENCY_ICONS: Record<Competency, string> = {
  people_relationships: '👥',
  growth_impact: '🌱',
  purpose_alignment: '🎯',
};

const MATURITY_COLOR: Record<string, string> = {
  Optimised: 'text-emerald-600',
  Established: 'text-orbit-forest',
  Managed: 'text-orbit-green',
  Emerging: 'text-orbit-amber',
  Beginning: 'text-red-600',
};

function isNA(val: string | null | undefined) {
  return !val || val === DASHBOARD_NOT_AVAILABLE;
}

function ScoreBar({ value, max = 5, color = 'bg-orbit-forest' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}

interface ExportReportViewProps {
  dashboard: EngagementDashboardData;
  analysis: DetailedAnalysisData | null;
  orgName: string;
  reportDate: string;
  respondentCount: number;
}

export default function ExportReportView({
  dashboard,
  analysis,
  orgName,
  reportDate,
  respondentCount,
}: ExportReportViewProps) {
  function handlePrint() {
    window.print();
  }

  const shortTermActions = analysis
    ? analysis.competencyBreakdown
        .flatMap((c) => (c.quickWin ? [{ ...c.quickWin, competency: c.competency, timeframe: 'short_term' as const }] : []))
    : [];

  const longTermActions = analysis
    ? analysis.competencyBreakdown
        .flatMap((c) =>
          c.oaklinSupport ? [{ ...c.oaklinSupport, competency: c.competency, timeframe: 'long_term' as const }] : [],
        )
    : [];

  return (
    <>
      {/* Print toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-semibold text-orbit-dark">
            Team Diagnostic Report — {dashboard.teamName}
          </p>
          <p className="text-xs text-gray-500">{reportDate}</p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orbit-forest text-white text-sm font-semibold rounded-lg hover:bg-orbit-green transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save as PDF
        </button>
      </div>

      {/* Report body */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 print:px-0 print:py-0 print:space-y-6">

        {/* ── COVER HEADER ─────────────────────────────────────────────────── */}
        <div className="rounded-xl bg-orbit-forest text-white px-8 py-6 flex items-start justify-between print:rounded-none">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300 mb-1">
              Orbit by Oaklin
            </p>
            <h1 className="text-2xl font-bold">Team Diagnostic Report</h1>
            <p className="mt-2 text-green-200 text-sm">{orgName} · {dashboard.teamName}</p>
            <p className="text-green-300 text-xs mt-0.5">{reportDate} · {respondentCount} respondent{respondentCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {dashboard.overallScore !== null ? (
              <>
                <p className="text-5xl font-bold">{dashboard.overallScore.toFixed(1)}</p>
                <p className="text-green-300 text-xs mt-1">out of 5</p>
                <p className="text-green-200 text-sm font-semibold mt-0.5">{dashboard.maturityLabel}</p>
              </>
            ) : (
              <p className="text-green-300 text-sm italic">Score pending</p>
            )}
          </div>
        </div>

        {/* ── AI SUMMARY ───────────────────────────────────────────────────── */}
        {analysis?.aiSummary && !isNA(analysis.aiSummary) && (
          <div className="rounded-xl bg-white border border-gray-200 px-6 py-5">
            <h2 className="text-sm font-bold text-orbit-dark uppercase tracking-wide mb-3">
              Executive Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.aiSummary}</p>
          </div>
        )}

        {/* ── STRENGTHS & OPPORTUNITIES ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
          {/* Strengths */}
          <div className="rounded-xl bg-white border border-gray-200 px-6 py-5">
            <h2 className="text-sm font-bold text-orbit-dark mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orbit-forest text-white text-xs flex items-center justify-center flex-shrink-0">✓</span>
              Top 3 Strengths
            </h2>
            <ol className="space-y-3">
              {dashboard.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-orbit-forest text-xs flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className={`font-semibold leading-snug ${isNA(s.title) ? 'text-gray-400 italic' : 'text-orbit-dark'}`}>
                      {s.title}
                    </p>
                    {s.description && !isNA(s.description) && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{s.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Opportunities */}
          <div className="rounded-xl bg-white border border-gray-200 px-6 py-5">
            <h2 className="text-sm font-bold text-orbit-dark mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orbit-amber text-white text-xs flex items-center justify-center flex-shrink-0">↑</span>
              Top 3 Opportunities
            </h2>
            <ol className="space-y-3">
              {dashboard.opportunities.map((o, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-orbit-amber text-xs flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className={`font-semibold leading-snug ${isNA(o.title) ? 'text-gray-400 italic' : 'text-orbit-dark'}`}>
                      {o.title}
                    </p>
                    {o.description && !isNA(o.description) && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{o.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── COMPETENCY BREAKDOWN ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-orbit-dark mb-3">Competency Breakdown</h2>
          <div className="space-y-3">
            {COMPETENCIES.map((c) => {
              const pillar = dashboard.pillars.find((p) => p.competency === c);
              const breakdown = analysis?.competencyBreakdown.find((b) => b.competency === c);
              const score = pillar?.score ?? null;
              const managerScore = breakdown?.managerScore ?? null;
              const memberScore = breakdown?.memberScore ?? null;
              const industryAvg = breakdown?.industryAverage ?? null;
              const bestInClass = breakdown?.bestInClass ?? null;
              const delta = breakdown?.delta ?? null;
              const aiInsight = breakdown?.aiInsight;

              return (
                <div key={c} className="rounded-xl bg-white border border-gray-200 overflow-hidden">
                  {/* Pillar header */}
                  <div className="bg-orbit-forest px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{COMPETENCY_ICONS[c]}</span>
                      <span className="text-sm font-bold text-white">{COMPETENCY_LABELS[c]}</span>
                    </div>
                    {score !== null && (
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">{score.toFixed(1)}</span>
                        <span className="text-green-300 text-xs ml-1">/ 5</span>
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-4">
                    {/* Score bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                      <div className="space-y-3">
                        {managerScore !== null && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Manager</span>
                              <span className="font-bold text-orbit-forest">{managerScore.toFixed(1)}</span>
                            </div>
                            <ScoreBar value={managerScore} color="bg-orbit-forest" />
                          </div>
                        )}
                        {memberScore !== null && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Team Members</span>
                              <span className="font-bold text-orbit-amber">{memberScore.toFixed(1)}</span>
                            </div>
                            <ScoreBar value={memberScore} color="bg-orbit-amber" />
                          </div>
                        )}
                        {industryAvg !== null && (
                          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-gray-400">Industry avg</p>
                              <p className="font-semibold text-gray-700">{industryAvg.toFixed(1)}</p>
                            </div>
                            {bestInClass !== null && (
                              <div>
                                <p className="text-gray-400">Best in class</p>
                                <p className="font-semibold text-orbit-green">{bestInClass.toFixed(1)}</p>
                              </div>
                            )}
                            {delta !== null && (
                              <div className="col-span-2">
                                <p className="text-gray-400">vs industry</p>
                                <p className={`font-bold text-sm ${delta >= 0 ? 'text-orbit-green' : 'text-red-600'}`}>
                                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* AI Insight */}
                      {aiInsight && !isNA(aiInsight) && (
                        <div className="bg-gray-50 rounded-lg px-4 py-3">
                          <p className="text-2xs font-bold text-orbit-amber uppercase tracking-wide mb-1.5">
                            💡 Insight
                          </p>
                          <p className="text-xs text-gray-700 leading-relaxed">{aiInsight}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ACTION PLAN ──────────────────────────────────────────────────── */}
        {(shortTermActions.length > 0 || longTermActions.length > 0) && (
          <div className="print:break-before-page">
            <h2 className="text-base font-bold text-orbit-dark mb-3">Action Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
              {/* Short-term */}
              <div className="rounded-xl bg-white border border-gray-200 px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-orbit-amber text-white text-xs font-bold px-2 py-0.5 rounded">
                    Short-term
                  </span>
                  <span className="text-xs text-gray-400">Quick wins to act on now</span>
                </div>
                <ol className="space-y-3">
                  {shortTermActions.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-orbit-amber text-xs flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-orbit-dark leading-snug">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{a.description}</p>
                        <p className="text-2xs text-gray-400 mt-1 uppercase tracking-wide">
                          {COMPETENCY_LABELS[a.competency]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Long-term */}
              <div className="rounded-xl bg-white border border-gray-200 px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-orbit-forest text-white text-xs font-bold px-2 py-0.5 rounded">
                    Long-term
                  </span>
                  <span className="text-xs text-gray-400">Strategic initiatives</span>
                </div>
                <ol className="space-y-3">
                  {longTermActions.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-orbit-forest text-xs flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-orbit-dark leading-snug">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{a.description}</p>
                        <p className="text-2xs text-gray-400 mt-1 uppercase tracking-wide">
                          {COMPETENCY_LABELS[a.competency]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* ── RECOMMENDED SUPPORT ──────────────────────────────────────────── */}
        {analysis?.oaklinSupport && analysis.oaklinSupport.some((s) => !isNA(s.title)) && (
          <div className="rounded-xl bg-green-50 border border-orbit-green/20 px-6 py-5">
            <h2 className="text-sm font-bold text-orbit-dark mb-3">How Oaklin Can Support</h2>
            <div className="space-y-3">
              {analysis.oaklinSupport
                .filter((s) => !isNA(s.title))
                .map((s, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 text-orbit-forest font-bold mt-0.5">→</span>
                    <div>
                      <p className="font-semibold text-orbit-dark leading-snug">{s.title}</p>
                      {s.description && !isNA(s.description) && (
                        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{s.description}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-6 flex items-center justify-between text-xs text-gray-400 print:pt-4">
          <p>Confidential — prepared by Oaklin for {orgName}</p>
          <p>Orbit Platform · orbit.oaklin.com</p>
        </div>
      </div>
    </>
  );
}
