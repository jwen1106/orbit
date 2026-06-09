'use client';

import { useState, useMemo } from 'react';
import type { QuestionBreakdown, DetailedAnalysisData } from '@/lib/dashboard-types';
import type { Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

const COMPETENCIES: Competency[] = [
  'people_relationships',
  'growth_impact',
  'purpose_alignment',
];

const LEVELS = [1, 2, 3, 4, 5];

function gapLabel(gap: number): { label: string; colour: string } {
  const abs = Math.abs(gap);
  if (abs < 0.3) return { label: 'Aligned', colour: 'bg-green-50 text-green-700 border-green-200' };
  if (abs < 0.7) return { label: 'Minor Gap', colour: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (abs < 1.2) return { label: 'Moderate Gap (Candour concern)', colour: 'bg-red-50 text-red-600 border-red-200' };
  return { label: 'Significant Gap', colour: 'bg-red-100 text-red-700 border-red-300' };
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

function DistBar({ level, pct, count, color }: { level: number; pct: number | null; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs text-gray-500 flex-shrink-0">Level {level}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
        <div className={`h-full rounded ${color}`} style={{ width: pct !== null ? `${pct}%` : '0%' }} />
      </div>
      <span className="w-6 text-right text-xs text-gray-500 tabular-nums flex-shrink-0">{count}</span>
    </div>
  );
}

/* ── Single-question card ── */
function QuestionCard({ question }: { question: QuestionBreakdown }) {
  const delta = question.delta;
  const { label: gLabel, colour: gColour } =
    delta !== null ? gapLabel(delta) : { label: 'No comparison data', colour: 'bg-gray-100 text-gray-400 border-gray-200' };
  const noMgr = question.managerCount === 0;
  const noMem = question.memberCount === 0;

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm font-semibold text-orbit-dark">
          {question.questionSubtext ?? question.questionText}
        </p>
      </div>

      {/* Scores */}
      <div className="px-8 py-7 grid grid-cols-3 items-center gap-6 border-b border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">Team Manager Assessment</p>
          <p className={`text-5xl font-bold leading-none ${noMgr ? 'text-gray-200' : 'text-orbit-forest'}`}>
            {noMgr ? '—' : (question.managerScore?.toFixed(1) ?? '—')}
          </p>
          {question.managerCriteriaLabel && (
            <p className="text-xs text-gray-500 mt-3 leading-snug">{question.managerCriteriaLabel}</p>
          )}
        </div>
        <div className="text-center">
          <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold border ${gColour}`}>
            {delta !== null && <>Δ Delta: {Math.abs(delta).toFixed(1)} &mdash; </>}{gLabel}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">Team Member Assessment</p>
          <p className={`text-5xl font-bold leading-none ${noMem ? 'text-gray-200' : 'text-gray-500'}`}>
            {noMem ? '—' : (question.memberScore?.toFixed(1) ?? '—')}
          </p>
          {question.memberCriteriaLabel && (
            <p className="text-xs text-gray-500 mt-3 leading-snug">{question.memberCriteriaLabel}</p>
          )}
        </div>
      </div>

      {/* Distribution panels */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-gray-700 mb-1">
            Team Manager Assessment
            {question.managerCount > 0 && <span className="font-normal text-gray-400"> (n={question.managerCount})</span>}
          </p>
          <p className="text-xs text-gray-400 mb-4 leading-snug border-b border-gray-100 pb-3">{question.questionText}</p>
          {noMgr ? (
            <p className="text-xs text-gray-400 italic">No manager responses yet</p>
          ) : (
            <div className="space-y-2.5">
              {question.managerDistribution.map(({ level, pct }) => (
                <DistBar key={level} level={level} pct={pct}
                  count={pct !== null ? Math.round((pct / 100) * question.managerCount) : 0}
                  color="bg-orbit-green" />
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-gray-700 mb-1">
            Team Member Assessment
            {question.memberCount > 0 && <span className="font-normal text-gray-400"> (n={question.memberCount})</span>}
          </p>
          <p className="text-xs text-gray-400 mb-4 leading-snug border-b border-gray-100 pb-3">{question.questionText}</p>
          {noMem ? (
            <p className="text-xs text-gray-400 italic">No member responses yet</p>
          ) : (
            <div className="space-y-2.5">
              {question.memberDistribution.map(({ level, pct }) => (
                <DistBar key={level} level={level} pct={pct}
                  count={pct !== null ? Math.round((pct / 100) * question.memberCount) : 0}
                  color="bg-orbit-green" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interpretation */}
      {delta !== null && Math.abs(delta) >= 0.5 && (
        <div className="px-6 py-4 bg-green-50/70 border-t border-green-100">
          <p className="text-xs font-bold text-orbit-forest mb-1">🔎 Interpretation</p>
          <p className="text-xs text-gray-700 leading-relaxed">
            {question.managerScore! > question.memberScore!
              ? `Team managers perceive this ${Math.abs(delta).toFixed(1)} points higher than team members (managers: ${question.managerScore!.toFixed(1)}, members: ${question.memberScore!.toFixed(1)}). This gap signals possible candour concerns — the team may be experiencing challenges that management doesn't yet recognise.`
              : `Team members rate this ${Math.abs(delta).toFixed(1)} points higher than the manager. Members may feel more confident in this area than leadership recognises.`}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Aggregated "All questions" card ── */
function AggregatedCard({ questions, competencyLabel }: { questions: QuestionBreakdown[]; competencyLabel: string }) {
  const withData = questions.filter((q) => q.managerScore !== null || q.memberScore !== null);

  const mgrScore = avg(questions.map((q) => q.managerScore));
  const memScore = avg(questions.map((q) => q.memberScore));
  const delta = mgrScore !== null && memScore !== null ? mgrScore - memScore : null;
  const { label: gLabel, colour: gColour } =
    delta !== null ? gapLabel(delta) : { label: 'No comparison data', colour: 'bg-gray-100 text-gray-400 border-gray-200' };

  // Average distributions across all questions
  const mgrCounts = questions.map((q) => q.managerCount);
  const memCounts = questions.map((q) => q.memberCount);
  const totalMgr = mgrCounts.reduce((a, b) => a + b, 0);
  const totalMem = memCounts.reduce((a, b) => a + b, 0);

  const avgMgrDist = LEVELS.map((level) => {
    const pcts = questions.map((q) => {
      const item = q.managerDistribution.find((d) => d.level === level);
      return item?.pct ?? null;
    });
    const p = avg(pcts);
    return { level, pct: p, count: p !== null ? Math.round((p / 100) * totalMgr) : 0 };
  });

  const avgMemDist = LEVELS.map((level) => {
    const pcts = questions.map((q) => {
      const item = q.memberDistribution.find((d) => d.level === level);
      return item?.pct ?? null;
    });
    const p = avg(pcts);
    return { level, pct: p, count: p !== null ? Math.round((p / 100) * totalMem) : 0 };
  });

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-orbit-dark">{competencyLabel} — Average across all questions</p>
        <span className="text-xs text-gray-400">{withData.length} question{withData.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Scores */}
      <div className="px-8 py-7 grid grid-cols-3 items-center gap-6 border-b border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">Team Manager Assessment</p>
          <p className={`text-5xl font-bold leading-none ${mgrScore === null ? 'text-gray-200' : 'text-orbit-forest'}`}>
            {mgrScore !== null ? mgrScore.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-3">avg score</p>
        </div>
        <div className="text-center">
          <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold border ${gColour}`}>
            {delta !== null && <>Δ Delta: {Math.abs(delta).toFixed(1)} &mdash; </>}{gLabel}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">Team Member Assessment</p>
          <p className={`text-5xl font-bold leading-none ${memScore === null ? 'text-gray-200' : 'text-gray-500'}`}>
            {memScore !== null ? memScore.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-3">avg score</p>
        </div>
      </div>

      {/* Averaged distribution panels */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-gray-700 mb-1">
            Team Manager Assessment
            {totalMgr > 0 && <span className="font-normal text-gray-400"> (n={totalMgr})</span>}
          </p>
          <p className="text-xs text-gray-400 mb-4 leading-snug border-b border-gray-100 pb-3">
            Averaged distribution across {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
          {totalMgr === 0 ? (
            <p className="text-xs text-gray-400 italic">No manager responses yet</p>
          ) : (
            <div className="space-y-2.5">
              {avgMgrDist.map(({ level, pct, count }) => (
                <DistBar key={level} level={level} pct={pct} count={count} color="bg-orbit-green" />
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-5">
          <p className="text-xs font-bold text-gray-700 mb-1">
            Team Member Assessment
            {totalMem > 0 && <span className="font-normal text-gray-400"> (n={totalMem})</span>}
          </p>
          <p className="text-xs text-gray-400 mb-4 leading-snug border-b border-gray-100 pb-3">
            Averaged distribution across {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
          {totalMem === 0 ? (
            <p className="text-xs text-gray-400 italic">No member responses yet</p>
          ) : (
            <div className="space-y-2.5">
              {avgMemDist.map(({ level, pct, count }) => (
                <DistBar key={level} level={level} pct={pct} count={count} color="bg-orbit-green" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-question score summary table */}
      {withData.length > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Question breakdown</p>
          <div className="space-y-2">
            {questions.map((q) => {
              const qDelta = q.delta;
              const { label: ql, colour: qc } =
                qDelta !== null ? gapLabel(qDelta) : { label: '—', colour: 'bg-gray-100 text-gray-400 border-gray-200' };
              return (
                <div key={q.questionId} className="flex items-center gap-4 text-xs">
                  <p className="flex-1 text-gray-600 truncate" title={q.questionSubtext ?? q.questionText}>
                    {q.questionSubtext ?? q.questionText}
                  </p>
                  <span className="text-orbit-forest font-semibold w-8 text-right tabular-nums flex-shrink-0">
                    {q.managerScore?.toFixed(1) ?? '—'}
                  </span>
                  <span className="text-gray-400 flex-shrink-0">vs</span>
                  <span className="text-gray-500 font-semibold w-8 text-right tabular-nums flex-shrink-0">
                    {q.memberScore?.toFixed(1) ?? '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border text-2xs font-medium flex-shrink-0 ${qc}`}>{ql}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
interface DeltaAnalysisViewProps {
  data: DetailedAnalysisData;
}

export default function DeltaAnalysisView({ data }: DeltaAnalysisViewProps) {
  const { questionBreakdowns } = data;

  const grouped = useMemo(
    () =>
      COMPETENCIES.reduce<Record<Competency, QuestionBreakdown[]>>(
        (acc, c) => {
          acc[c] = questionBreakdowns.filter((q) => q.competency === c);
          return acc;
        },
        { people_relationships: [], growth_impact: [], purpose_alignment: [] },
      ),
    [questionBreakdowns],
  );

  const firstWithQuestions = COMPETENCIES.find((c) => grouped[c].length > 0) ?? COMPETENCIES[0];
  const [selectedCompetency, setSelectedCompetency] = useState<Competency>(firstWithQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('all');

  // Reset question selection when competency changes
  const handleCompetencyChange = (c: Competency) => {
    setSelectedCompetency(c);
    setSelectedQuestion('all');
  };

  if (questionBreakdowns.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">Team Manager and Team Member Analysis</h1>
        <p className="text-sm text-gray-500">
          Comparison of team manager and team member assessments to identify candour gaps
        </p>
        <div className="rounded-xl bg-white border border-gray-200 px-8 py-16 text-center text-gray-400">
          Results will be available once your engagement has been analysed.
        </div>
      </div>
    );
  }

  const competencyQuestions = grouped[selectedCompetency] ?? [];
  const activeQuestion =
    selectedQuestion !== 'all'
      ? competencyQuestions.find((q) => q.questionId === selectedQuestion) ?? null
      : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">Team Manager and Team Member Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Comparison of team manager and team member assessments to identify candour gaps and authentic pain points
        </p>
      </div>

      {/* Filter bar — both dropdowns on the left */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label htmlFor="competency-select" className="block text-xs text-gray-400 mb-1">Pillar</label>
          <select
            id="competency-select"
            value={selectedCompetency}
            onChange={(e) => handleCompetencyChange(e.target.value as Competency)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-orbit-dark font-medium min-w-[200px] focus:outline-none focus:ring-2 focus:ring-orbit-green/40"
          >
            {COMPETENCIES.map((c) => (
              <option key={c} value={c}>{COMPETENCY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="question-select" className="block text-xs text-gray-400 mb-1">Question</label>
          <select
            id="question-select"
            value={selectedQuestion}
            onChange={(e) => setSelectedQuestion(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-orbit-dark font-medium min-w-[240px] max-w-xs focus:outline-none focus:ring-2 focus:ring-orbit-green/40"
          >
            <option value="all">All questions (aggregated)</option>
            {competencyQuestions.map((q) => (
              <option key={q.questionId} value={q.questionId}>
                {q.questionSubtext ?? q.questionText}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {competencyQuestions.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 px-8 py-12 text-center text-gray-400 text-sm">
          No questions found for this pillar.
        </div>
      ) : selectedQuestion === 'all' ? (
        <AggregatedCard
          questions={competencyQuestions}
          competencyLabel={COMPETENCY_LABELS[selectedCompetency]}
        />
      ) : activeQuestion ? (
        <QuestionCard question={activeQuestion} />
      ) : null}
    </div>
  );
}
