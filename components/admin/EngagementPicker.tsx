'use client';

import { useRouter } from 'next/navigation';
import type { OrgEngagementOption } from '@/lib/engagement-dashboard';

interface Props {
  engagements: OrgEngagementOption[];
  selectedId: string;
  baseUrl: string;
  teamId?: string;
}

const statusLabel: Record<string, string> = {
  active: 'Live',
  closed: 'Closed',
  analysed: 'Analysed',
  draft: 'Draft',
};

const statusColour: Record<string, string> = {
  active: 'text-emerald-600',
  closed: 'text-amber-600',
  analysed: 'text-orbit-forest',
  draft: 'text-gray-400',
};

export default function EngagementPicker({ engagements, selectedId, baseUrl, teamId }: Props) {
  const router = useRouter();
  const selected = engagements.find((e) => e.id === selectedId) ?? engagements[0];

  function handleChange(engagementId: string) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    router.push(`${baseUrl}${separator}engagementId=${engagementId}`);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Viewing survey</p>
        <p className="text-sm font-bold text-orbit-dark">{selected?.title ?? '—'}</p>
      </div>

      <div className="flex items-center gap-3">
        {selected && (
          <span className={`text-xs font-semibold ${statusColour[selected.status] ?? 'text-gray-500'}`}>
            ● {statusLabel[selected.status] ?? selected.status}
          </span>
        )}
        {engagements.length > 1 && (
          <select
            value={selectedId}
            onChange={(e) => handleChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-orbit-dark font-semibold focus:outline-none focus:ring-2 focus:ring-orbit-forest"
          >
            {engagements.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.title}
              </option>
            ))}
          </select>
        )}
        {engagements.length === 1 && (
          <span className="text-xs text-gray-400 italic">1 survey available</span>
        )}
      </div>
    </div>
  );
}
