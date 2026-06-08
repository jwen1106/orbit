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

const COMPETENCY_ICONS: Record<Competency, string> = {
  people_relationships: '👥',
  growth_impact: '🌱',
  purpose_alignment: '🎯',
};

interface TeamDashboardViewProps {
  data: EngagementDashboardData;
  showAnalysisBanner?: boolean;
  analysisHref?: string;
}

function placeholderClass(text: string) {
  return text === DASHBOARD_NOT_AVAILABLE ? 'text-gray-400 italic' : '';
}

export default function TeamDashboardView({
  data,
  showAnalysisBanner = false,
  analysisHref = '/dashboard/analysis',
}: TeamDashboardViewProps) {
  const { overallScore, maturityLabel, strengths, opportunities, pillars, teamName } = data;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">My Team Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Current assessment across operational pillars and competencies
          </p>
        </div>
        <div className="flex-shrink-0">
          <label htmlFor="team-select" className="sr-only">
            Team
          </label>
          <select
            id="team-select"
            disabled
            value={teamName}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-orbit-dark font-semibold min-w-[140px]"
          >
            <option value={teamName}>{teamName}</option>
          </select>
        </div>
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
              className="h-2 bg-orbit-green rounded-full"
              style={{ width: overallScore !== null ? `${(overallScore / 5) * 100}%` : '0%' }}
            />
          </div>
          <Link
            href={analysisHref}
            className="mt-4 w-full inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-md bg-orbit-forest text-white hover:bg-orbit-green transition-colors"
          >
            View for detailed analysis
          </Link>
        </div>

        {/* Top 3 Strengths */}
        <div className="lg:col-span-5 rounded-xl bg-white border border-gray-200 px-6 py-5 shadow-sm">
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

        {/* Top 3 Opportunities */}
        <div className="lg:col-span-4 rounded-xl bg-white border border-gray-200 px-6 py-5 shadow-sm">
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

      {/* Three pillar columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.competency}
            className="flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white"
          >
            {/* Pillar header */}
            <div className="bg-orbit-forest px-5 py-4 flex items-center gap-3">
              <span className="text-xl">{COMPETENCY_ICONS[pillar.competency]}</span>
              <p className="text-sm font-bold text-white">
                {COMPETENCY_LABELS[pillar.competency]}
              </p>
            </div>

            {/* Metrics row — mint green background */}
            <div className="bg-green-50 px-5 py-4 grid grid-cols-2 gap-4 border-b border-green-100">
              <div>
                <p className="text-xs text-gray-500">Average Pillar Score</p>
                <p
                  className={[
                    'mt-1 font-bold',
                    pillar.score !== null
                      ? 'text-3xl text-orbit-forest'
                      : 'text-lg text-gray-400 italic',
                  ].join(' ')}
                >
                  {pillar.score !== null ? pillar.score.toFixed(1) : DASHBOARD_NOT_AVAILABLE}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Key Metric</p>
                <p
                  className={[
                    'text-sm font-semibold mt-1 leading-snug',
                    placeholderClass(pillar.keyMetric) || 'text-orbit-dark',
                  ].join(' ')}
                >
                  {pillar.keyMetric}
                </p>
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
