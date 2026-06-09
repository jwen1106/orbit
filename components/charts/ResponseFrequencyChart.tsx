'use client';

import { useId } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const MATURITY_LEVEL_LABELS = ['Ad Hoc', 'Informal', 'Defined', 'Managed', 'Optimised'];

const CHART_HEIGHT = 240;
const BAR_COLORS = ['#94a894', '#6b9a72', '#1A4D23', '#2E7D3A', '#163d1c'];

export interface FrequencyPoint {
  level: number;
  label: string;
  count: number;
}

interface ResponseFrequencyChartProps {
  data: FrequencyPoint[];
  total: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: FrequencyPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-lg px-4 py-3 text-left min-w-[140px]">
      <p className="text-xs font-bold text-orbit-dark">Level {point.level} — {point.label}</p>
      <p className="text-lg font-bold text-orbit-forest tabular-nums mt-0.5">{point.count}</p>
      <p className="text-2xs text-gray-400 mt-0.5">responses at this maturity level</p>
    </div>
  );
}

export default function ResponseFrequencyChart({ data, total }: ResponseFrequencyChartProps) {
  const gradientId = useId().replace(/:/g, '');
  const peak = data.reduce(
    (best, item) => (item.count > best.count ? item : best),
    data[0] ?? { level: 0, label: '', count: 0 },
  );
  const peakPct = total > 0 ? Math.round((peak.count / total) * 100) : 0;

  return (
    <div>
      <div className="px-6 pt-5 pb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Total responses
        </p>
        <p className="text-3xl font-bold text-orbit-dark tabular-nums tracking-tight">
          {total.toLocaleString()}
        </p>
        {total > 0 && peak.count > 0 && (
          <span className="inline-flex items-center mt-2.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-orbit-forest/10 text-orbit-forest">
            Most common: {peak.label} · {peakPct}%
          </span>
        )}
      </div>

      <div className="px-4" style={{ height: CHART_HEIGHT }}>
        {total === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No responses recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 8 }} barCategoryGap="20%">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E7D3A" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#1A4D23" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eef0ee" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(_, index) => `L${data[index]?.level ?? index + 1}`}
              />
              <YAxis hide allowDecimals={false} width={0} domain={[0, 'auto']} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(26, 77, 35, 0.06)' }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {data.map((entry) => (
                  <Cell
                    key={entry.level}
                    fill={entry.level === peak.level ? `url(#${gradientId})` : BAR_COLORS[entry.level - 1]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="px-6 pb-5 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {MATURITY_LEVEL_LABELS.map((label, index) => (
            <span key={label} className="text-2xs text-gray-400">
              <span className="font-semibold text-gray-500">L{index + 1}</span> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
