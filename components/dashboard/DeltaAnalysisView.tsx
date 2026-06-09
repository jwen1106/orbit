import Card from '@/components/ui/Card';
import type { QuestionBreakdown, DetailedAnalysisData } from '@/lib/dashboard-types';
import type { Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

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

const LEVEL_LABELS = ['Ad Hoc', 'Informal', 'Defined', 'Managed', 'Optimised'];

function gapLabel(gap: number): { label: string; colour: string } {
  const abs = Math.abs(gap);
  if (abs < 0.3) return { label: 'Aligned', colour: 'bg-green-100 text-orbit-forest' };
  if (abs < 0.7) return { label: 'Minor Gap', colour: 'bg-amber-50 text-amber-700' };
  if (abs < 1.2) return { label: 'Moderate Gap (Candour concern)', colour: 'bg-orange-50 text-orange-700' };
  return { label: 'Significant Gap', colour: 'bg-red-50 text-red-700' };
}

function HorizontalDistBar({
  level,
  pct,
  criteria,
  color = 'bg-orbit-forest',
}: {
  level: number;
  pct: number | null;
  criteria?: string;
  color?: string;
}) {
  const label = criteria ?? LEVEL_LABELS[level - 1];
  return (
    <div className="flex items-center gap-2 text-xs min-w-0">
      <span className="w-4 text-gray-400 font-semibold flex-shrink-0">{level}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="flex-1 h-3.5 bg-gray-100 rounded overflow-hidden">
            <div
              className={`h-full rounded ${color}`}
              style={{ width: pct !== null ? `${pct}%` : '0%' }}
            />
          </div>
          {pct !== null && (
            <span className="text-2xs text-gray-500 w-7 text-right tabular-nums flex-shrink-0">
              {pct}%
            </span>
          )}
        </div>
        <p className="text-2xs text-gray-400 truncate" title={label}>{label}</p>
      </div>
    </div>
  );
}

function QuestionDeltaCard({ question }: { question: QuestionBreakdown }) {
  const delta = question.delta;
  const { label: gLabel, colour: gColour } = delta !== null
    ? gapLabel(delta)
    : { label: 'No comparison data', colour: 'bg-gray-100 text-gray-500' };

  const noMgr = question.managerCount === 0;
  const noMem = question.memberCount === 0;

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Question heading */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm font-bold text-orbit-dark leading-snug">
          {question.questionSubtext ?? question.questionText}
        </p>
        {question.questionSubtext && (
          <p className="text-xs text-gray-500 mt-0.5">{question.questionText}</p>
        )}
      </div>

      {/* Score summary row */}
      <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-100">
        {/* Manager score */}
        <div className="flex-1 text-center">
          <p className="text-2xs text-gray-400 mb-1">Team Manager Assessment</p>
          <p className={`text-2xl font-bold ${noMgr ? 'text-gray-300' : 'text-orbit-forest'}`}>
            {noMgr ? '—' : question.managerScore?.toFixed(1) ?? '—'}
          </p>
          {question.managerCriteriaLabel && (
            <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
              {question.managerCriteriaLabel}
            </p>
          )}
        </div>

        {/* Delta badge */}
        <div className="flex-shrink-0 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${gColour}`}>
            {delta !== null ? `Δ ${Math.abs(delta).toFixed(1)} — ` : ''}{gLabel}
          </div>
        </div>

        {/* Member score */}
        <div className="flex-1 text-center">
          <p className="text-2xs text-gray-400 mb-1">Team Member Assessment</p>
          <p className={`text-2xl font-bold ${noMem ? 'text-gray-300' : 'text-orbit-amber'}`}>
            {noMem ? '—' : question.memberScore?.toFixed(1) ?? '—'}
          </p>
          {question.memberCriteriaLabel && (
            <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
              {question.memberCriteriaLabel}
            </p>
          )}
        </div>
      </div>

      {/* Side-by-side distribution bars */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="px-4 py-4">
          <p className="text-2xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Manager Assessment{question.managerCount > 0 ? ` (n=${question.managerCount})` : ''}
          </p>
          {noMgr ? (
            <p className="text-xs text-gray-400 italic">No manager responses yet</p>
          ) : (
            <div className="space-y-2">
              {question.managerDistribution.map(({ level, pct }) => (
                <HorizontalDistBar
                  key={level}
                  level={level}
                  pct={pct}
                  criteria={question.criteria[String(level)]}
                  color="bg-orbit-forest"
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-4">
          <p className="text-2xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Team Member Assessment{question.memberCount > 0 ? ` (n=${question.memberCount})` : ''}
          </p>
          {noMem ? (
            <p className="text-xs text-gray-400 italic">No member responses yet</p>
          ) : (
            <div className="space-y-2">
              {question.memberDistribution.map(({ level, pct }) => (
                <HorizontalDistBar
                  key={level}
                  level={level}
                  pct={pct}
                  criteria={question.criteria[String(level)]}
                  color="bg-orbit-amber"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interpretation banner for significant gaps */}
      {delta !== null && Math.abs(delta) >= 0.5 && (
        <div className="px-5 py-3 bg-blue-50/60 border-t border-blue-100">
          <p className="text-2xs font-bold text-blue-700 uppercase tracking-wide mb-1">
            🔎 Interpretation
          </p>
          <p className="text-xs text-blue-800 leading-relaxed">
            {question.managerScore! > question.memberScore!
              ? `The manager rates this ${delta.toFixed(1)} points higher than team members. This may indicate a candour gap — the team may be experiencing challenges that aren't yet visible to the manager.`
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

  const comparableQuestions = questionBreakdowns.filter(
    (q) => q.managerScore !== null && q.memberScore !== null,
  );
  const avgGap =
    comparableQuestions.length > 0
      ? comparableQuestions.reduce((sum, q) => sum + Math.abs(q.delta ?? 0), 0) /
        comparableQuestions.length
      : null;

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
        <Card>
          <div className="text-center py-12 text-gray-500">
            Results will be available once your engagement has been analysed.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">
          Team Manager and Team Member Analysis
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Comparison of team manager and team member assessments to identify candour gaps and
          authentic pain points
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md">
          <p className="text-xs text-gray-400">Average perception gap</p>
          <p className={[
            'text-3xl font-bold mt-1',
            avgGap === null ? 'text-gray-300' :
            avgGap < 0.3 ? 'text-orbit-green' :
            avgGap >= 1 ? 'text-red-600' : 'text-orbit-amber',
          ].join(' ')}>
            {avgGap !== null ? avgGap.toFixed(2) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {avgGap === null ? 'No data' :
             avgGap < 0.3 ? 'Well aligned overall' :
             avgGap >= 1 ? 'Significant gaps' : 'Some misalignment'}
          </p>
        </Card>
        {COMPETENCIES.map((c) => {
          const qs = grouped[c].filter((q) => q.delta !== null);
          const avg = qs.length > 0
            ? qs.reduce((sum, q) => sum + Math.abs(q.delta ?? 0), 0) / qs.length
            : null;
          return (
            <Card key={c} padding="md">
              <p className="text-xs text-gray-400">{COMPETENCY_ICONS[c]} {COMPETENCY_LABELS[c]}</p>
              <p className={[
                'text-xl font-bold mt-1',
                avg === null ? 'text-gray-300' :
                avg < 0.3 ? 'text-orbit-green' :
                avg >= 1 ? 'text-red-600' : 'text-orbit-amber',
              ].join(' ')}>
                {avg !== null ? avg.toFixed(2) : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">avg gap</p>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orbit-forest inline-block" />
          Manager distribution
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orbit-amber inline-block" />
          Team member distribution
        </span>
      </div>

      {/* Per-competency question cards */}
      {COMPETENCIES.map((competency) => {
        const questions = grouped[competency];
        if (questions.length === 0) return null;
        return (
          <div key={competency} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-lg">{COMPETENCY_ICONS[competency]}</span>
              <h2 className="text-base font-bold text-orbit-dark">
                {COMPETENCY_LABELS[competency]}
              </h2>
            </div>
            <div className="space-y-4">
              {questions.map((q) => (
                <QuestionDeltaCard key={q.questionId} question={q} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
