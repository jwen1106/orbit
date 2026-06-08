'use client';

import dynamic from 'next/dynamic';

const OrbitRadarChart = dynamic(
  () => import('./OrbitRadarChart'),
  { ssr: false },
);

export interface WrapperDataPoint {
  subject: string;
  fullMark: number;
  overall: number;
  manager: number;
  member: number;
  [key: string]: number | string;
}

export default function RadarChartWrapper({ data }: { data: WrapperDataPoint[] }) {
  const series = [
    { key: 'overall', label: 'Overall', color: '#1A4D23' },
    { key: 'manager', label: 'Manager', color: '#2E7D3A', strokeDasharray: '4 2' },
    { key: 'member', label: 'Members', color: '#F5A623', strokeDasharray: '2 2' },
  ];

  return <OrbitRadarChart data={data} series={series} height={340} />;
}
