'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ActionItem, ActionStatus, Team } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

type SerializedAction = Omit<ActionItem, 'dueDate' | 'createdAt' | 'updatedAt'> & {
  dueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

interface ActionPlanClientProps {
  data: { team: Team; actions: SerializedAction[] } | null;
}

const statusOptions: { value: ActionStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
];

const competencyBadgeMap: Record<string, 'people' | 'growth' | 'purpose'> = {
  people_relationships: 'people',
  growth_impact: 'growth',
  purpose_alignment: 'purpose',
};

function ActionCard({ action }: { action: SerializedAction }) {
  const [status, setStatus] = useState<ActionStatus>(action.status);
  const [assignedTo, setAssignedTo] = useState(action.assignedTo ?? '');
  const [dueDate, setDueDate] = useState(
    action.dueDate ? action.dueDate.substring(0, 10) : '',
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/action-items/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assignedTo, dueDate: dueDate || null }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const isDirty =
    status !== action.status ||
    assignedTo !== (action.assignedTo ?? '') ||
    dueDate !== (action.dueDate ? action.dueDate.substring(0, 10) : '');

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={action.timeframe} />
            <Badge
              variant={competencyBadgeMap[action.competency] ?? 'people'}
              label={COMPETENCY_LABELS[action.competency as keyof typeof COMPETENCY_LABELS]}
            />
          </div>
          <h3 className="font-bold text-orbit-dark text-sm leading-snug">{action.title}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{action.description}</p>
        </div>
        <div className="flex-shrink-0 text-xs font-bold text-gray-300">#{action.priority}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-100">
        <div>
          <label className="block text-2xs text-gray-400 uppercase mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ActionStatus)}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-orbit-dark focus:outline-none focus:ring-1 focus:ring-orbit-green"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-2xs text-gray-400 uppercase mb-1">Owner</label>
          <input
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Assign to…"
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-orbit-dark focus:outline-none focus:ring-1 focus:ring-orbit-green placeholder-gray-300"
          />
        </div>
        <div>
          <label className="block text-2xs text-gray-400 uppercase mb-1">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-orbit-dark focus:outline-none focus:ring-1 focus:ring-orbit-green"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div
          className={[
            'h-1.5 flex-1 mr-4 rounded-full overflow-hidden bg-gray-100',
          ].join(' ')}
        >
          <div
            className={[
              'h-1.5 rounded-full transition-all',
              status === 'complete'
                ? 'w-full bg-orbit-forest'
                : status === 'in_progress'
                ? 'w-1/2 bg-orbit-amber'
                : 'w-0',
            ].join(' ')}
          />
        </div>
        {isDirty && (
          <Button size="sm" onClick={save} loading={saving} className="flex-shrink-0">
            {saved ? 'Saved ✓' : 'Save'}
          </Button>
        )}
        {!isDirty && saved && (
          <span className="text-xs text-orbit-green font-semibold">Saved ✓</span>
        )}
      </div>
    </Card>
  );
}

export default function ActionPlanClient({ data }: ActionPlanClientProps) {
  const [filter, setFilter] = useState<'all' | 'short_term' | 'long_term'>('all');

  if (!data || data.actions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">Action Plan</h1>
        <Card>
          <div className="text-center py-12 text-gray-500">
            {!data
              ? 'No team assigned yet.'
              : 'Your action plan will appear here once your engagement has been analysed.'}
          </div>
        </Card>
      </div>
    );
  }

  const { team, actions } = data;
  const shortTerm = actions.filter((a) => a.timeframe === 'short_term');
  const longTerm = actions.filter((a) => a.timeframe === 'long_term');
  const completeCount = actions.filter((a) => a.status === 'complete').length;

  const shown =
    filter === 'short_term' ? shortTerm : filter === 'long_term' ? longTerm : actions;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">Action Plan</h1>
          <p className="text-sm text-gray-500 mt-1">
            {team.name} · {completeCount}/{actions.length} actions complete
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'short_term', 'long_term'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={[
                'px-3 py-1.5 rounded text-sm font-semibold transition-colors',
                filter === f
                  ? 'bg-orbit-forest text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orbit-green',
              ].join(' ')}
            >
              {f === 'all' ? 'All' : f === 'short_term' ? 'Short-term' : 'Long-term'}
              <span className="ml-1.5 text-xs opacity-70">
                ({f === 'all' ? actions.length : f === 'short_term' ? shortTerm.length : longTerm.length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Not started', count: actions.filter((a) => a.status === 'not_started').length, color: 'text-gray-500' },
          { label: 'In progress', count: actions.filter((a) => a.status === 'in_progress').length, color: 'text-orbit-amber' },
          { label: 'Complete', count: completeCount, color: 'text-orbit-forest' },
        ].map((s) => (
          <Card key={s.label} padding="md">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </Card>
        ))}
      </div>

      {/* Action cards */}
      <div className="space-y-4">
        {shown.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}
