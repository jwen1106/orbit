'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface RadarDataPoint {
  subject: string;
  fullMark: number;
  [key: string]: number | string;
}

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  strokeDasharray?: string;
}

interface OrbitRadarChartProps {
  data: RadarDataPoint[];
  series: SeriesConfig[];
  height?: number;
}

export default function OrbitRadarChart({
  data,
  series,
  height = 340,
}: OrbitRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid
          stroke="#e5e7eb"
          gridType="polygon"
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: '#1A2E1C',
            fontSize: 12,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 600,
          }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 5]}
          tickCount={6}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
        />
        {series.map((s) => (
          <Radar
            key={s.key}
            name={s.label}
            dataKey={s.key}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.15}
            strokeWidth={2}
            strokeDasharray={s.strokeDasharray}
            dot={{ r: 4, fill: s.color }}
          />
        ))}
        <Tooltip
          contentStyle={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
          formatter={(value: number) => [value.toFixed(2), '']}
        />
        <Legend
          wrapperStyle={{
            fontSize: 12,
            fontFamily: 'Arial, Helvetica, sans-serif',
            paddingTop: 12,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
