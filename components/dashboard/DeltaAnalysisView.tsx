'use client';

import { useState } from 'react';
import type { QuestionBreakdown, DetailedAnalysisData } from '@/lib/dashboard-types';
import type { Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

const COMPETENCIES: Competency[] = [
  'people_relationships',
  'growth_impact',
  'purpose_alignment',
];

function gapLabel(gap: number): { label: string; colour: string } {
  const abs = Math.abs(gap);
  if (abs < 0.3) return { label: 'Aligned', colour: 'bg-green-50 text-green-700 border-green-200' };
  if (abs < 0.7) return { label: 'Minor Gap', colour: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (abs < 1.2) return { label: 'Moderate Gap (Candour concern)', colour: 'bg-red-50 text-red-600 border-red-200' };
  return { label: 'Significant Gap', colour: 'bg-red-100 text-red-700 border-red-300' };
}

function DistBar({
  level,
  pct,
  count,
  color,
}: {
  level: number;
  pct: number | null;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs text-gray-500 flex-shrink-0">Level {level}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
        <div
          className={`h-full rounded ${color}`}
          style={{ width: pct !== null ? `${pct}%` : '0%' }}
        />
      </div>
      <span className="w-5 text-right text-xs text-gray-500 tabular-nums flex-shrink-0">
        {count}
      </span>
    </div>
  );
}

function QuestionCard({ question }: { question: QuestionBreakdown }) {
  const delta = question.delta;
  const { label: gLabel, colour: gColour } =
    delta !== null
      ? gapLabel(delta)
      : { label: 'No comparison data', colour: 'bg-gray-100 text-gray-400 border-gray-200' };

  const noMgr = question.managerCount === 0;
  const noMem = question.memberCount === 0;

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header — question topic */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm font-semibold text-orbit-dark">
          {question.questionSubtext ?? question.questionText}
        </p>
      </div>

      {/* Score row */}
      <div className="px-8 py-7 grid grid-cols-3 items-center gap-6 border-b border-gray-100">
        {/* Manager score */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">Team Manager Assessment</p>
          <p className={`text-5xl font-bold leading-none ${noMgr ? 'text-gray-200' : 'text-orbit-forest'}`}>
            {noMgr ? '—' : (question.managerScore?.toFixed(1) ?? '—')}
          </p>
          {question.managerCriteriaLabel && (
            <p className="text-xs text-gray-500 mt-3 leading-snug">
              {question.managerCriteriaLabel}
            </p>
          )}
        </div>

        {/* Delta badge */}
        <div className="text-center">
          <span
            className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold border ${gColour}`}
          >
            {delta !== null && <>Δ Delta: {Math.abs(delta).toFixed(1)} &mdash; </>}
            {gLabel}
          </span>
        </div>

        {/* Member score */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">Team Member Assessment</p>
          <p className={`text-5xl font-bold leading-none ${noMem ? 'text-gray-200' : 'text-gray-500'}`}>
            {noMem ? '—' : (question.memberScore?.toFixed(1) ?? '—')}
          </p>
          {question.memberCriteriaLabel && (
            <p className="text-xs text-gray-500 mt-3 leading-snug">
              {question.memberCriteriaLabel}
            </p>
          )}
        </div>
      </div>

      {/* Side-by-side distribution panels */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Manager panel */}
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-gray-700 mb-1">
            Team Manager Assessment
            {question.managerCount > 0 && (
              <span className="font-normal text-gray-400"> (n={question.managerCount})</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mb-4 leading-snug border-b border-gray-100 pb-3">
            {question.questionText}
          </p>
          {noMgr ? (
            <p className="text-xs text-gray-400 italic">No manager responses yet</p>
          ) : (
            <div className="space-y-2.5">
              {question.managerDistribution.map(({ level, pct }) => (
                <DistBar
                  key={level}
                  level={level}
                  pct={pct}
                  count={pct !== null ? Math.round((pct / 100) * question.managerCount) : 0}
                  color="bg-orbit-green"
                />
              ))}
            </div>
          )}
        </div>

        {/* Member panel */}
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-gray-700 mb-1">
            Team Member Assessment
            {question.memberCount > 0 && (
              <span className="font-normal text-gray-400"> (n={question.memberCount})</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mb-4 leading-snug border-b border-gray-100 pb-3">
            {question.questionText}
          </p>
          {noMem ? (
            <p className="text-xs text-gray-400 italic">No member responses yet</p>
          ) : (
            <div className="space-y-2.5">
              {question.memberDistribution.map(({ level, pct }) => (
                <DistBar
                  key={level}
                  level={level}
                  pct={pct}
                  count={pct !== null ? Math.round((pct / 100) * question.memberCount) : 0}
                  color="bg-orbit-green"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interpretation banner */}
      {delta !== null && Math.abs(delta) >= 0.5 && (
        <div className="px-6 py-4 bg-green-50/70 border-t border-green-100">
          <p className="text-xs font-bold text-orbit-forest mb-1">🔎 Interpretation</p>
          <p className="text-xs text-gray-700 leading-relaxed">
            {question.managerScore! > question.memberScore!
              ? `Team managers perceive this ${Math.abs(delta).toFixed(1)} points higher than team members, with ${question.managerCount} managers rating it at ${question.managerScore!.toFixed(1)} and ${question.memberCount} members at ${question.memberScore!.toFixed(1)}. This gap signals possible candour concerns — the team may be experiencing challenges that management doesn't yet recognise.`
              : `Team members rate this ${Math.abs(delta).toFixed(1)} points higher than the manager. Members may feel more confident in this area than leadership recognises.`}
          </p>
        </div>
      )}
    </div>
  );
}

interface DeltaAnalysisViewProps {
  data: DetailedAnalysisData;
}

export default function DeltaAnalysisView({ data }: DeltaAnalysisViewProps) {
  const { questionBreakdowns } = data;

  const grouped = COMPETENCIES.reduce<Record<Competency, QuestionBreakdown[]>>(
    (acc, c) => {
      acc[c] = questionBreakdowns.filter((q) => q.competency === c);
      return acc;
    },
    { people_relationships: [], growth_impact: [], purpose_alignment: [] },
  );

  // Default to first competency that has questions
  const firstWithQuestions = COMPETENCIES.find((c) => grouped[c].length > 0) ?? COMPETENCIES[0];
  const [selectedCompetency, setSelectedCompetency] = useState<Competency>(firstWithQuestions);

  if (questionBreakdowns.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">
            Team Manager and Team Member Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Comparison of team manager and team member assessments to identify candour gaps
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 px-8 py-16 text-center text-gray-400">
          Results will be available once your engagement has been analysed.
        </div>
      </div>
    );
  }

  const visibleQuestions = grouped[selectedCompetency] ?? [];

  return (
    <div className="space-y-6">
      {/* Page header + competency dropdown */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">
            Team Manager and Team Member Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Comparison of team manager and team member assessments to identify candour gaps and
            authentic pain points
          </p>
        </div>
        <div className="flex-shrink-0 mt-1">
          <label htmlFor="competency-select" className="sr-only">
            Select competency
          </label>
          <select
            id="competency-select"
            value={selectedCompetency}
            onChange={(e) => setSelectedCompetency(e.target.value as Competency)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-orbit-dark font-medium min-w-[220px] focus:outline-none focus:ring-2 focus:ring-orbit-green/40"
          >
            {COMPETENCIES.map((c) => (
              <option key={c} value={c}>
                {COMPETENCY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question cards for selected competency */}
      {visibleQuestions.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 px-8 py-12 text-center text-gray-400 text-sm">
          No questions found for this competency.
        </div>
      ) : (
        <div className="space-y-5">
          {visibleQuestions.map((q) => (
            <QuestionCard key={q.questionId} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
