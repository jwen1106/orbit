import type { BenchmarkPageData } from '@/lib/benchmarks';
import {
  formatTargetRange,
  functionLabel,
  overallMaturity,
  sizeRange,
} from '@/lib/benchmarks';
import type { Competency } from '@/types';
import SurveySelector from '@/components/dashboard/SurveySelector';
import CompetencyDonutCard from '@/components/dashboard/CompetencyDonutCard';

const COMPETENCIES: Competency[] = ['people_relationships', 'growth_impact', 'purpose_alignment'];

const COLUMN_HEADING =
  'px-2 py-2.5 text-center text-2xs font-bold text-orbit-dark uppercase tracking-wide leading-snug';

function formatSectorScore(value: number | null): string {
  return value !== null ? value.toFixed(1) : 'N/A';
}

function TableScoreCell({ value, highlight, muted }: { value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <td className="px-2 py-3 text-center align-middle">
      <span
        className={[
          'inline-flex items-center justify-center min-w-[2.5rem] text-sm tabular-nums leading-snug',
          muted ? 'text-gray-400 font-medium' : highlight ? 'font-bold text-orbit-forest' : 'font-semibold text-orbit-dark',
        ].join(' ')}
      >
        {value}
      </span>
    </td>
  );
}

export default function BenchmarkComparisonView({ data }: { data: BenchmarkPageData }) {
  const { org, team, benchmarkComparison, sectorRow, surveys, selectedSurveyId } = data;

  const baseline = overallMaturity(data.competencyScores);
  const industryPeer = overallMaturity({
    people_relationships: benchmarkComparison.people_relationships.industryAverage,
    growth_impact: benchmarkComparison.growth_impact.industryAverage,
    purpose_alignment: benchmarkComparison.purpose_alignment.industryAverage,
  });
  const bestInClass = overallMaturity({
    people_relationships: benchmarkComparison.people_relationships.bestInClass,
    growth_impact: benchmarkComparison.growth_impact.bestInClass,
    purpose_alignment: benchmarkComparison.purpose_alignment.bestInClass,
  });

  const teamSizeLabel = sizeRange(team.size);
  const quickWinTarget = formatTargetRange(baseline, bestInClass, 'quick_win');
  const oaklinTarget = formatTargetRange(baseline, bestInClass, 'oaklin');

  const maturityRows = [
    {
      label: 'Your Organisation',
      sublabel: org.name,
      size: teamSizeLabel,
      baseline: baseline.toFixed(1),
      quickWin: quickWinTarget,
      oaklin: oaklinTarget,
      highlight: true,
    },
    {
      label: 'Industry Peer',
      sublabel: `${org.industry} average`,
      size: teamSizeLabel,
      baseline: industryPeer.toFixed(1),
      quickWin: '—',
      oaklin: '—',
      highlight: false,
    },
    {
      label: 'Best-in-Class',
      sublabel: 'Top quartile benchmark',
      size: teamSizeLabel,
      baseline: bestInClass.toFixed(1),
      quickWin: '—',
      oaklin: '—',
      highlight: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">Industry Benchmark Comparison</h1>
          <p className="text-sm text-gray-500 mt-1">
            {team.name} · How your maturity scores compare to industry peers and best-in-class organisations
          </p>
        </div>
        {surveys.length > 0 && selectedSurveyId ? (
          <SurveySelector
            surveys={surveys}
            selectedId={selectedSurveyId}
            baseUrl="/dashboard/benchmarks"
          />
        ) : null}
      </div>

      {/* Operational Maturity Score */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-center">
          <h2 className="text-sm font-bold text-orbit-dark">Operational Maturity Score</h2>
          <p className="text-2xs text-gray-400 mt-0.5">
            {functionLabel(team.function)} · {team.size} people · {org.industry}
          </p>
        </div>
        <div className="px-3 sm:px-5 py-3">
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-orbit-forest/[0.02]">
            <table className="w-full min-w-[640px] table-fixed text-sm">
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr className="bg-orbit-forest/[0.1]">
                  <th className={COLUMN_HEADING}>Organisation</th>
                  <th className={`${COLUMN_HEADING} leading-snug`}>
                    Organisation<br />Size
                  </th>
                  <th className={`${COLUMN_HEADING} leading-snug`}>
                    Diagnostic<br />Baseline
                  </th>
                  <th className={`${COLUMN_HEADING} leading-snug`}>
                    Target / After<br />Quick Win Actions
                  </th>
                  <th className={`${COLUMN_HEADING} leading-snug`}>
                    Target / With<br />Oaklin Support
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orbit-forest/10">
                {maturityRows.map((row) => (
                  <tr
                    key={row.label}
                    className={row.highlight ? 'bg-green-50/60' : 'bg-white hover:bg-gray-50/40'}
                  >
                    <td className="px-2 py-3 text-center align-middle">
                      <p className={`text-xs leading-snug ${row.highlight ? 'font-bold text-orbit-dark' : 'font-semibold text-orbit-dark'}`}>
                        {row.label}
                      </p>
                      <p className="text-2xs text-gray-400 mt-0.5 leading-snug truncate">{row.sublabel}</p>
                      {row.highlight && (
                        <span className="inline-block mt-1 text-2xs font-semibold uppercase tracking-wide text-orbit-forest bg-orbit-forest/10 px-2 py-0.5 rounded-full">
                          Your organisation
                        </span>
                      )}
                    </td>
                    <TableScoreCell value={row.size} highlight={row.highlight} />
                    <TableScoreCell value={row.baseline} highlight={row.highlight} />
                    <TableScoreCell value={row.quickWin} highlight={row.highlight} muted={row.quickWin === '—'} />
                    <TableScoreCell value={row.oaklin} highlight={row.highlight} muted={row.oaklin === '—'} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Competency benchmarks */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-center">
          <h2 className="text-sm font-bold text-orbit-dark">Competency Benchmarks</h2>
          <p className="text-2xs text-gray-400 mt-0.5">
            Your scores compared to industry peers and best-in-class
          </p>
        </div>
        <div className="px-3 sm:px-5 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPETENCIES.map((c) => {
              const bm = benchmarkComparison[c];
              return (
                <CompetencyDonutCard
                  key={c}
                  competency={c}
                  score={bm.score}
                  industryAverage={bm.industryAverage}
                  bestInClass={bm.bestInClass}
                  compact
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Industry Sector Benchmarks — own sector only */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-center">
          <h2 className="text-sm font-bold text-orbit-dark">Industry Sector Benchmarks</h2>
          <p className="text-2xs text-gray-400 mt-0.5">
            Maturity scores for your sector
          </p>
        </div>
        <div className="px-3 sm:px-5 py-3">
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-orbit-forest/[0.02]">
            <table className="w-full min-w-[640px] table-fixed text-sm">
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr className="bg-orbit-forest/[0.1]">
                  <th className={COLUMN_HEADING}>Sector</th>
                  <th className={`${COLUMN_HEADING} leading-snug`}>
                    People &amp;<br />Relationships
                  </th>
                  <th className={`${COLUMN_HEADING} leading-snug`}>
                    Growth &amp;<br />Impact
                  </th>
                  <th className={`${COLUMN_HEADING} leading-snug`}>
                    Purpose &amp;<br />Alignment
                  </th>
                  <th className={`${COLUMN_HEADING} leading-snug`}>
                    Average<br />Score
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50/60 border-t border-orbit-forest/10">
                  <td className="px-2 py-3 text-center align-middle">
                    <p className="font-bold text-orbit-dark text-sm leading-snug">{sectorRow.industry}</p>
                    <span className="inline-block mt-1 text-2xs font-semibold uppercase tracking-wide text-orbit-forest bg-orbit-forest/10 px-2 py-0.5 rounded-full">
                      Your sector
                    </span>
                  </td>
                  <TableScoreCell value={formatSectorScore(sectorRow.people)} highlight={sectorRow.hasData} muted={!sectorRow.hasData} />
                  <TableScoreCell value={formatSectorScore(sectorRow.growth)} highlight={sectorRow.hasData} muted={!sectorRow.hasData} />
                  <TableScoreCell value={formatSectorScore(sectorRow.purpose)} highlight={sectorRow.hasData} muted={!sectorRow.hasData} />
                  <TableScoreCell value={formatSectorScore(sectorRow.average)} highlight={sectorRow.hasData} muted={!sectorRow.hasData} />
                </tr>
              </tbody>
            </table>
          </div>
          {!sectorRow.hasData && (
            <p className="text-2xs text-gray-400 text-center mt-2">
              Sector data for {sectorRow.industry} not yet available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
