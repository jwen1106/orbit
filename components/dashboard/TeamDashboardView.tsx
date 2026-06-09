/**
 * Canonical "My Team Dashboard" — the first page team managers see after logging in
 * at /dashboard (once their survey is closed). Admin preview routes reuse this same
 * component so Oaklin sees exactly what the client will see.
 */
import Link from 'next/link';
import type { Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';
import {
  DASHBOARD_NOT_AVAILABLE,
  type EngagementDashboardData,
} from '@/lib/dashboard-types';
import SurveySelector, { type SurveyOption } from '@/components/dashboard/SurveySelector';

function CompetencyIcon({ competency }: { competency: Competency }) {
  const iconClass = 'w-5 h-5 text-white';
  if (competency === 'people_relationships') {
    return (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  if (competency === 'growth_impact') {
    return (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11M12 11C12 11 8 9 6 5c4 0 6 3 6 6M12 11c0 0 4-2 6-6c-4 0-6 3-6 6" />
      </svg>
    );
  }
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function parseKeyMetric(keyMetric: string): { pct: string; label: string } {
  const match = keyMetric.match(/^(\d+%)\s*(.*)$/);
  if (match) return { pct: match[1], label: match[2] };
  return { pct: '', label: keyMetric };
}

function PillarScoreDisplay({ score }: { score: number | null }) {
  const pct = score !== null ? (score / 5) * 100 : 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="rounded-lg bg-white border border-gray-200 px-4 py-4 flex flex-col items-center justify-center min-h-[120px]">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">
        Average Score
      </p>
      {score !== null ? (
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#E8EDE9" strokeWidth="8" />
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="#1A4D23"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute text-3xl font-bold text-orbit-dark tabular-nums">
            {score.toFixed(1)}
          </span>
        </div>
      ) : (
        <p className="text-lg text-gray-400 italic text-center">{DASHBOARD_NOT_AVAILABLE}</p>
      )}
    </div>
  );
}

interface TeamDashboardViewProps {
  data: EngagementDashboardData;
  showAnalysisBanner?: boolean;
  analysisHref?: string;
  deltaHref?: string;
  surveys?: SurveyOption[];
  selectedSurveyId?: string;
  surveyPickerBaseUrl?: string;
}

function placeholderClass(text: string) {
  return text === DASHBOARD_NOT_AVAILABLE ? 'text-gray-400 italic' : '';
}

export default function TeamDashboardView({
  data,
  showAnalysisBanner = false,
  analysisHref = '/dashboard/analysis',
  deltaHref,
  surveys,
  selectedSurveyId,
  surveyPickerBaseUrl,
}: TeamDashboardViewProps) {
  const { overallScore, maturityLabel, strengths, opportunities, pillars, teamName } = data;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">HPT Diagnostic Tool</h1>
          <p className="text-sm text-gray-500 mt-1">
            {teamName} · Current assessment across operational pillars and competencies
          </p>
        </div>
        {surveys && surveys.length > 0 && surveyPickerBaseUrl && selectedSurveyId ? (
          <SurveySelector
            surveys={surveys}
            selectedId={selectedSurveyId}
            baseUrl={surveyPickerBaseUrl}
          />
        ) : null}
      </div>

      {showAnalysisBanner && data.hasSurveyData && !data.hasFullAnalysis && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Survey scores are shown from completed responses. Run AI analysis to generate full
          strengths, opportunities, and recommended actions.
        </div>
      )}

      {/* Top summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Overall maturity */}
        <div className="lg:col-span-3 rounded-xl bg-white border border-gray-200 px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Overall Maturity
          </p>
          <p
            className={[
              'mt-3 leading-none font-bold',
              overallScore !== null ? 'text-5xl text-orbit-forest' : 'text-2xl text-gray-400 italic',
            ].join(' ')}
          >
            {overallScore !== null ? overallScore.toFixed(1) : DASHBOARD_NOT_AVAILABLE}
          </p>
          <p className={`text-sm mt-2 ${placeholderClass(maturityLabel)}`}>
            Out of 5 ({maturityLabel})
          </p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
            <div
              className="h-2 bg-orbit-forest/70 rounded-full"
              style={{ width: overallScore !== null ? `${(overallScore / 5) * 100}%` : '0%' }}
            />
          </div>
          <Link
            href={analysisHref}
            className="mt-4 w-full inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-md bg-orbit-forest text-white hover:bg-orbit-green transition-colors"
          >
            View for detailed analysis
          </Link>
          {deltaHref && (
            <Link
              href={deltaHref}
              className="mt-2 w-full inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-md border border-orbit-forest text-orbit-forest hover:bg-orbit-forest/[0.04] transition-colors"
            >
              Manager &amp; Member Analysis
            </Link>
          )}
        </div>

        {/* Top 3 Strengths & Opportunities — equal width */}
        <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white border border-gray-200 px-6 py-5 shadow-sm">
            <p className="text-sm font-bold text-orbit-dark mb-4">Top 3 Strengths</p>
            <ol className="space-y-4">
              {strengths.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orbit-forest text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div className="text-sm leading-snug">
                    <p className={`font-bold ${placeholderClass(s.title) || 'text-orbit-dark'}`}>
                      {s.title}
                    </p>
                    {s.description && (
                      <p className={`mt-0.5 ${placeholderClass(s.description) || 'text-gray-600'}`}>
                        {s.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 px-6 py-5 shadow-sm">
            <p className="text-sm font-bold text-orbit-dark mb-4">Top 3 Opportunities</p>
            <ol className="space-y-4">
              {opportunities.map((o, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orbit-forest text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div className="text-sm leading-snug">
                    <p className={`font-bold ${placeholderClass(o.title) || 'text-orbit-dark'}`}>
                      {o.title}
                    </p>
                    {o.description && (
                      <p className={`mt-0.5 ${placeholderClass(o.description) || 'text-gray-600'}`}>
                        {o.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Three pillar columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.competency}
            className="flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white"
          >
            {/* Pillar header */}
            <div className="bg-orbit-forest px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <CompetencyIcon competency={pillar.competency} />
              </div>
              <p className="text-sm font-bold text-white">
                {COMPETENCY_LABELS[pillar.competency]}
              </p>
            </div>

            {/* Metrics row */}
            <div className="bg-orbit-forest/[0.04] px-4 py-4 grid grid-cols-2 gap-3 border-b border-gray-200">
              <PillarScoreDisplay score={pillar.score} />
              <div className="rounded-lg bg-white border border-gray-200 px-4 py-4 flex flex-col items-center justify-center min-h-[120px]">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">
                  Key Metric
                </p>
                {(() => {
                  const { pct, label } = parseKeyMetric(pillar.keyMetric);
                  const isPlaceholder = pillar.keyMetric === DASHBOARD_NOT_AVAILABLE;
                  return isPlaceholder ? (
                    <p className="text-sm text-gray-400 italic text-center">{DASHBOARD_NOT_AVAILABLE}</p>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      {pct && (
                        <p className="text-2xl font-bold text-orbit-dark leading-none">{pct}</p>
                      )}
                      <p className={`text-xs mt-2 leading-snug ${placeholderClass(label) || 'text-gray-700'}`}>
                        {label}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Recommended actions */}
            <div className="flex-1 px-5 py-5">
              <p className="text-sm font-bold text-orbit-dark mb-4">
                Top 3 Recommended Actions
              </p>
              <ol className="space-y-4">
                {pillar.actions.map((action, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0 font-bold text-orbit-forest">
                      {i + 1}.
                    </span>
                    <div>
                      <p
                        className={[
                          'font-bold leading-snug',
                          placeholderClass(action.title) || 'text-orbit-dark',
                        ].join(' ')}
                      >
                        {action.title}
                      </p>
                      <p
                        className={[
                          'leading-snug mt-0.5',
                          placeholderClass(action.description) || 'text-gray-600',
                        ].join(' ')}
                      >
                        {action.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
