import Link from 'next/link';
import type { Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

const ACCENT: Record<Competency, { ring: string; track: string; border: string }> = {
  people_relationships: { ring: '#1A4D23', track: '#E8EDE9', border: 'border-t-orbit-forest' },
  growth_impact: { ring: '#2E7D3A', track: '#E8EDE9', border: 'border-t-orbit-green' },
  purpose_alignment: { ring: '#C8860A', track: '#FEF3E2', border: 'border-t-orbit-amber' },
};

const COLUMN_HEADING =
  'text-2xs font-bold text-orbit-dark uppercase tracking-wide leading-snug text-center';

const ROW_LABEL = 'text-xs font-semibold text-orbit-dark leading-snug text-center';

function BenchmarkScoreWheel({
  value,
  ringColor,
  trackColor = '#E8EDE9',
  size = 'md',
}: {
  value: number;
  ringColor: string;
  trackColor?: string;
  size?: 'sm' | 'md';
}) {
  const r = 32;
  const circumference = 2 * Math.PI * r;
  const pct = (value / 5) * 100;
  const offset = circumference - (pct / 100) * circumference;
  const box = size === 'sm' ? 'w-[4.5rem] h-[4.5rem]' : 'w-[5.5rem] h-[5.5rem]';

  return (
    <div className={`relative flex items-center justify-center mx-auto ${box}`}>
      <svg className={`${box} -rotate-90`} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke={trackColor} strokeWidth={7} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-sm font-bold text-orbit-dark tabular-nums leading-none">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function ScoreWheel({
  value,
  label,
  ringColor,
  trackColor = '#E8EDE9',
}: {
  value: number;
  label: string;
  ringColor: string;
  trackColor?: string;
}) {
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <BenchmarkScoreWheel value={value} ringColor={ringColor} trackColor={trackColor} />
      <p className={`${ROW_LABEL} mt-2 px-0.5`}>{label}</p>
    </div>
  );
}

interface CompetencyDonutCardProps {
  competency: Competency;
  score: number;
  industryAverage: number;
  bestInClass: number;
  analysisHref?: string;
  compact?: boolean;
}

export default function CompetencyDonutCard({
  competency,
  score,
  industryAverage,
  bestInClass,
  analysisHref,
  compact = false,
}: CompetencyDonutCardProps) {
  const accent = ACCENT[competency];
  const pct = (score / 5) * 100;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const vsIndustry = score - industryAverage;

  if (compact) {
    return (
      <div
        className={`rounded-xl border border-gray-100 bg-orbit-forest/[0.02] border-t-4 ${accent.border} px-4 py-4 text-center`}
      >
        <p className={`${COLUMN_HEADING} mb-3`}>{COMPETENCY_LABELS[competency]}</p>

        <div className="flex items-start justify-center gap-2 sm:gap-3">
          <ScoreWheel value={score} label="Your Organisation" ringColor={accent.ring} trackColor={accent.track} />
          <ScoreWheel value={industryAverage} label="Industry Peer" ringColor="#6B7280" />
          <ScoreWheel value={bestInClass} label="Best-in-Class" ringColor="#C8860A" trackColor="#FEF3E2" />
        </div>
      </div>
    );
  }

  const donut = (
    <div className="relative flex items-center justify-center flex-shrink-0">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke={accent.track} strokeWidth={10} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={accent.ring}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-3xl font-bold text-orbit-dark tabular-nums">{score.toFixed(1)}</span>
    </div>
  );

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 pt-5 pb-3 text-center">
        <p className="text-sm font-bold text-orbit-dark leading-snug">{COMPETENCY_LABELS[competency]}</p>
        <p className="text-xs text-gray-400 mt-1 tabular-nums">{score.toFixed(1)} / 5</p>
      </div>
      <div className="flex flex-col items-center justify-center px-5 py-2">{donut}</div>
      <div className="px-5 py-3 flex flex-col items-center gap-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>
            Industry avg{' '}
            <span className="font-semibold text-orbit-dark tabular-nums">{industryAverage.toFixed(1)}</span>
          </span>
          <span>
            Best in class{' '}
            <span className="font-semibold text-orbit-amber tabular-nums">{bestInClass.toFixed(1)}</span>
          </span>
        </div>
        <span
          className={`text-2xs font-semibold px-2.5 py-0.5 rounded-full ${vsIndustry >= 0 ? 'bg-green-50 text-orbit-forest' : 'bg-amber-50 text-amber-700'}`}
        >
          {vsIndustry >= 0 ? '+' : ''}
          {vsIndustry.toFixed(1)} vs industry
        </span>
      </div>
      {analysisHref && (
        <div className="mt-auto px-5 pb-5 pt-1">
          <Link
            href={analysisHref}
            className="block w-full text-center text-sm font-semibold text-orbit-forest border border-orbit-forest/25 rounded-xl py-2.5 hover:bg-orbit-forest/[0.04] transition-colors"
          >
            View details
          </Link>
        </div>
      )}
    </div>
  );
}
