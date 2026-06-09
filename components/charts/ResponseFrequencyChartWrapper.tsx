'use client';

import dynamic from 'next/dynamic';
import type { FrequencyPoint } from './ResponseFrequencyChart';

const ResponseFrequencyChart = dynamic(
  () => import('./ResponseFrequencyChart'),
  {
    ssr: false,
    loading: () => (
      <div className="px-6 py-8 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        <div className="h-10 w-20 bg-gray-100 rounded" />
        <div className="h-[240px] bg-gray-50 rounded-xl" />
      </div>
    ),
  },
);

interface Props {
  data: FrequencyPoint[];
  total: number;
}

export default function ResponseFrequencyChartWrapper({ data, total }: Props) {
  return <ResponseFrequencyChart data={data} total={total} />;
}
