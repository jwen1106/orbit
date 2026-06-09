'use client';

import { useState, useRef } from 'react';
import type { Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';
import {
  fieldInputClass,
  fieldInputCompactClass,
  fieldLabelCompactClass,
  fieldReadOnlyClass,
  fieldSelectClass,
  fieldSelectCompactClass,
  fieldTextareaClass,
} from '@/lib/field-styles';

export type SerializedTeam = {
  id: string;
  name: string;
  organisationId: string;
  function: string;
  size: number;
  managerId: string;
};
export type SerializedActionItem = {
  id: string;
  title: string;
  description: string;
  competency: string;
  timeframe: string;
  teamId: string;
  organisationId: string;
  assignedTo: string;
  completionPct: number;
  comments: string;
  status: string;
  source: string;
  priority: number;
};

const COMPETENCIES: Competency[] = ['people_relationships', 'growth_impact', 'purpose_alignment'];

const COMPETENCY_COLORS: Record<Competency, string> = {
  people_relationships: 'bg-orbit-forest/10 text-orbit-forest',
  growth_impact: 'bg-orbit-green/10 text-orbit-green',
  purpose_alignment: 'bg-orbit-amber/10 text-amber-800',
};

const TIMELINE_COLORS: Record<string, string> = {
  short_term: 'bg-orbit-amber/15 text-amber-800',
  long_term: 'bg-orbit-forest/10 text-orbit-forest',
};

function StatusIcon({ type, compact }: { type: 'not_started' | 'in_progress' | 'complete'; compact?: boolean }) {
  const box = compact ? 'w-9 h-9' : 'w-12 h-12';
  const icon = compact ? 'w-4 h-4' : 'w-6 h-6';
  if (type === 'complete') {
    return (
      <div className={`${box} rounded-full bg-orbit-forest flex items-center justify-center shadow-sm shadow-orbit-forest/20 flex-shrink-0`}>
        <svg className={`${icon} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (type === 'in_progress') {
    return (
      <div className={`${box} rounded-full bg-orbit-amber flex items-center justify-center shadow-sm shadow-orbit-amber/30 flex-shrink-0`}>
        <svg className={`${icon} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${box} rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0`}>
      <svg className={`${icon} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
      </svg>
    </div>
  );
}

function StatusStatCard({
  type,
  label,
  count,
  total,
  accentBar,
}: {
  type: 'not_started' | 'in_progress' | 'complete';
  label: string;
  count: number;
  total: number;
  accentBar: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-5 py-3 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <StatusIcon type={type} compact />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-2xl font-bold text-orbit-dark tabular-nums leading-none">{count}</p>
          <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
        </div>
        <p className="text-xs text-gray-400 tabular-nums flex-shrink-0">{pct}%</p>
      </div>
      <div className="w-full mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${accentBar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function completionBadge(pct: number) {
  if (pct >= 100) {
    return {
      label: 'Complete',
      cls: 'bg-orbit-forest/10 text-orbit-forest border border-orbit-forest/20',
      icon: 'complete' as const,
    };
  }
  if (pct > 0) {
    return {
      label: `${pct}%`,
      cls: 'bg-orbit-amber/15 text-amber-800 border border-orbit-amber/25',
      icon: 'in_progress' as const,
    };
  }
  return {
    label: 'Not started',
    cls: 'bg-gray-100 text-gray-600 border border-gray-200',
    icon: 'not_started' as const,
  };
}

function CompletionStatusPill({ pct }: { pct: number }) {
  const { label, cls, icon } = completionBadge(pct);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {icon === 'complete' && (
        <span className="w-4 h-4 rounded-full bg-orbit-forest flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      {icon === 'in_progress' && (
        <span className="w-4 h-4 rounded-full bg-orbit-amber flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
          </svg>
        </span>
      )}
      {icon === 'not_started' && (
        <span className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0" />
      )}
      {pct >= 100 ? label : pct > 0 ? `${label} complete` : label}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ---------- Inline editable row ----------
function ActionRow({
  action,
  onDelete,
  onUpdate,
}: {
  action: SerializedActionItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<SerializedActionItem>) => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [completionPct, setCompletionPct] = useState(action.completionPct);
  const [comments, setComments] = useState(action.comments);
  const [assignedTo, setAssignedTo] = useState(action.assignedTo);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const commentsRef = useRef<HTMLTextAreaElement>(null);

  async function save(field: string, value: unknown) {
    setSaving(true);
    const patch: Record<string, unknown> = { [field]: value };
    if (field === 'completionPct') {
      const pct = value as number;
      patch.status = pct >= 100 ? 'complete' : pct > 0 ? 'in_progress' : 'not_started';
    }
    try {
      await fetch(`/api/action-items/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      onUpdate(action.id, patch as Partial<SerializedActionItem>);
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${action.title}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/action-items/${action.id}`, { method: 'DELETE' });
      onDelete(action.id);
    } finally {
      setDeleting(false);
    }
  }

  const { cls: pctCls } = completionBadge(completionPct);

  return (
    <tr className="border-b border-gray-100 hover:bg-orbit-forest/[0.02] transition-colors group">
      {/* Action title */}
      <td className="px-4 py-3">
        <p className="font-medium text-orbit-dark text-sm leading-snug">{action.title}</p>
        {action.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{action.description}</p>
        )}
        <span className="text-2xs text-gray-400 capitalize">
          {action.source === 'ai_generated' ? '✦ AI generated' : '✎ Manual'}
        </span>
      </td>

      {/* Competency */}
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${COMPETENCY_COLORS[action.competency as Competency] ?? 'bg-gray-100 text-gray-600'}`}>
          {COMPETENCY_LABELS[action.competency as Competency] ?? action.competency}
        </span>
      </td>

      {/* Owner */}
      <td className="px-4 py-3 text-sm text-gray-700">
        {editingField === 'assignedTo' ? (
          <input
            autoFocus
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            onBlur={() => save('assignedTo', assignedTo)}
            onKeyDown={(e) => e.key === 'Enter' && save('assignedTo', assignedTo)}
            className={fieldInputCompactClass}
          />
        ) : (
          <button
            onClick={() => setEditingField('assignedTo')}
            className="text-left hover:text-orbit-forest transition-colors"
            title="Click to edit"
          >
            {assignedTo || <span className="text-gray-300 italic">Unassigned</span>}
          </button>
        )}
      </td>

      {/* Timeline */}
      <td className="px-4 py-3">
        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${TIMELINE_COLORS[action.timeframe] ?? 'bg-gray-100 text-gray-600'}`}>
          {action.timeframe === 'short_term' ? 'Short-Term' : 'Long-Term'}
        </span>
      </td>

      {/* Completion */}
      <td className="px-4 py-3">
        {editingField === 'completionPct' ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="number"
              min={0}
              max={100}
              step={5}
              value={completionPct}
              onChange={(e) => setCompletionPct(Number(e.target.value))}
              onBlur={() => save('completionPct', completionPct)}
              onKeyDown={(e) => e.key === 'Enter' && save('completionPct', completionPct)}
              className={`${fieldInputCompactClass} w-16`}
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
        ) : (
          <button
            onClick={() => setEditingField('completionPct')}
            className="hover:opacity-90 transition-opacity"
            title="Click to edit"
          >
            {saving && editingField === 'completionPct' ? (
              <span className={`text-xs font-semibold px-2 py-1 rounded ${pctCls}`}><Spinner /></span>
            ) : (
              <CompletionStatusPill pct={completionPct} />
            )}
          </button>
        )}
      </td>

      {/* Comments */}
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
        {editingField === 'comments' ? (
          <textarea
            ref={commentsRef}
            autoFocus
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            onBlur={() => save('comments', comments)}
            className={`${fieldInputCompactClass} resize-none`}
          />
        ) : (
          <button
            onClick={() => setEditingField('comments')}
            className="text-left w-full hover:text-orbit-forest transition-colors"
            title="Click to edit"
          >
            {comments || <span className="text-gray-300 italic">Add comment…</span>}
          </button>
        )}
      </td>

      {/* Delete */}
      <td className="px-3 py-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-400 hover:text-red-600 transition-colors"
          title="Delete action"
        >
          {deleting ? <Spinner /> : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          )}
        </button>
      </td>
    </tr>
  );
}

// ---------- Main component ----------
const EXAMPLE_ACTIONS = [
  {
    title: 'Establish cross-functional communication forum',
    description: 'Create a monthly forum to improve communication across teams and drive alignment.',
    competency: 'people_relationships' as Competency,
    timeframe: 'short_term',
    assignedTo: 'Operations Manager',
    completionPct: 30,
    comments: 'Forum structure drafted. First session scheduled for next month.',
  },
  {
    title: 'Implement leadership development programme',
    description: 'Design and roll out a structured leadership development pathway for managers.',
    competency: 'growth_impact' as Competency,
    timeframe: 'short_term',
    assignedTo: 'HR Director',
    completionPct: 30,
    comments: 'Provider selection underway. Proposal review in progress.',
  },
  {
    title: 'Implement 360-degree feedback programme',
    description: 'Launch a 360-degree feedback tool to support continuous performance improvement.',
    competency: 'people_relationships' as Competency,
    timeframe: 'long_term',
    assignedTo: 'People & Culture Lead',
    completionPct: 0,
    comments: 'Scheduled to begin Q3. Tool evaluation pending budget approval.',
  },
  {
    title: 'Launch innovation idea management system',
    description: 'Implement a platform for team members to submit, vote on, and track innovation ideas.',
    competency: 'growth_impact' as Competency,
    timeframe: 'long_term',
    assignedTo: 'Innovation Lead',
    completionPct: 15,
    comments: 'Requirements gathered. Platform demos scheduled next week.',
  },
];

type FormState = {
  title: string;
  timeline: string;
  competency: Competency;
  description: string;
  teamId: string;
  assignedTo: string;
};

const defaultForm = (): FormState => ({
  title: '',
  timeline: 'short_term',
  competency: 'people_relationships',
  description: '',
  teamId: '',
  assignedTo: '',
});

export default function ActionPlanView({
  orgId,
  orgName,
  teams,
  initialActions,
}: {
  orgId: string;
  orgName: string;
  teams: SerializedTeam[];
  initialActions: SerializedActionItem[];
}) {
  const [actions, setActions] = useState<SerializedActionItem[]>(initialActions);
  const [form, setForm] = useState<FormState>(() => ({
    ...defaultForm(),
    teamId: teams.length === 1 ? teams[0].id : '',
  }));
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterTimeline, setFilterTimeline] = useState<string>('all');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Action title is required.'); return; }
    if (!form.teamId) { setFormError('Please select a team.'); return; }
    setFormError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          competency: form.competency,
          timeframe: form.timeline,
          teamId: form.teamId,
          organisationId: orgId,
          assignedTo: form.assignedTo.trim(),
          completionPct: 0,
          comments: '',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      const newAction: SerializedActionItem = {
        id,
        title: form.title.trim(),
        description: form.description.trim(),
        competency: form.competency,
        timeframe: form.timeline,
        teamId: form.teamId,
        organisationId: orgId,
        assignedTo: form.assignedTo.trim(),
        completionPct: 0,
        comments: '',
        status: 'not_started',
        source: 'manual',
        priority: actions.length + 1,
      };
      setActions((prev) => [...prev, newAction]);
      setForm({ ...defaultForm(), teamId: teams.length === 1 ? teams[0].id : '' });
    } catch {
      setFormError('Failed to create action. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleSeedExamples() {
    if (teams.length === 0) return;
    setSeeding(true);
    const teamId = teams[0].id;
    try {
      const created: SerializedActionItem[] = [];
      for (const ex of EXAMPLE_ACTIONS) {
        const res = await fetch('/api/action-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...ex, teamId, organisationId: orgId }),
        });
        if (res.ok) {
          const { id } = await res.json();
          created.push({
            id,
            ...ex,
            teamId,
            organisationId: orgId,
            comments: ex.comments,
            status: ex.completionPct >= 100 ? 'complete' : ex.completionPct > 0 ? 'in_progress' : 'not_started',
            source: 'manual',
            priority: actions.length + created.length + 1,
          });
        }
      }
      setActions((prev) => [...prev, ...created]);
    } finally {
      setSeeding(false);
    }
  }

  function handleDelete(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  function handleUpdate(id: string, patch: Partial<SerializedActionItem>) {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  const filtered = actions.filter((a) => {
    if (filterTeam !== 'all' && a.teamId !== filterTeam) return false;
    if (filterTimeline !== 'all' && a.timeframe !== filterTimeline) return false;
    return true;
  });

  const notStarted = actions.filter((a) => a.completionPct === 0).length;
  const inProgress = actions.filter((a) => a.completionPct > 0 && a.completionPct < 100).length;
  const complete = actions.filter((a) => a.completionPct >= 100).length;
  const total = actions.length;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatusStatCard type="not_started" label="Not Started" count={notStarted} total={total} accentBar="bg-gray-300" />
        <StatusStatCard type="in_progress" label="In Progress" count={inProgress} total={total} accentBar="bg-orbit-amber" />
        <StatusStatCard type="complete" label="Complete" count={complete} total={total} accentBar="bg-orbit-forest" />
      </div>

      {/* Create New Action form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-orbit-forest/[0.04]">
          <h2 className="text-base font-bold text-orbit-dark">Create New Action</h2>
          <p className="text-xs text-gray-500 mt-0.5">Add a measurable step tied to your maturity assessment</p>
        </div>
        <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700 flex items-center justify-between">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
            </div>
          )}

          {/* Row 1: Title */}
          <div>
            <label className={fieldLabelCompactClass}>
              Action Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="E.g. 'Establish cross-functional communication forum'"
              className={fieldInputClass}
            />
          </div>

          {/* Row 2: Timeline + Competency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelCompactClass}>
                Timeline <span className="text-red-400">*</span>
              </label>
              <select
                value={form.timeline}
                onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                className={fieldSelectClass}
              >
                <option value="short_term">Short-Term</option>
                <option value="long_term">Long-Term</option>
              </select>
            </div>
            <div>
              <label className={fieldLabelCompactClass}>
                Linked Competency <span className="text-red-400">*</span>
              </label>
              <select
                value={form.competency}
                onChange={(e) => setForm((f) => ({ ...f, competency: e.target.value as Competency }))}
                className={fieldSelectClass}
              >
                {COMPETENCIES.map((c) => (
                  <option key={c} value={c}>{COMPETENCY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label className={fieldLabelCompactClass}>Description <span className="text-red-400">*</span></label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What will you do? Who is responsible? What is the success measure?"
              className={`${fieldTextareaClass} placeholder:text-gray-300`}
            />
          </div>

          {/* Row 4: Team + Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelCompactClass}>
                Team <span className="text-red-400">*</span>
              </label>
              {teams.length === 1 ? (
                <div className={`${fieldReadOnlyClass} text-sm`}>
                  {teams[0].name}
                </div>
              ) : (
                <select
                  value={form.teamId}
                  onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
                  className={fieldSelectClass}
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className={fieldLabelCompactClass}>Owner</label>
              <input
                type="text"
                value={form.assignedTo}
                onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                placeholder="E.g. Operations Manager"
                className={fieldInputClass}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-orbit-amber text-orbit-dark hover:bg-orbit-amber/90 disabled:opacity-60 transition-colors shadow-sm"
            >
              {creating ? <><Spinner /> Creating…</> : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Action
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Actions table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-orbit-forest/[0.04] flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-bold text-orbit-dark">
            Active Actions
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filters */}
            {teams.length > 1 && (
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className={fieldSelectCompactClass}
              >
                <option value="all">All Teams</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <select
              value={filterTimeline}
              onChange={(e) => setFilterTimeline(e.target.value)}
              className={fieldSelectCompactClass}
            >
              <option value="all">All Timelines</option>
              <option value="short_term">Short-Term</option>
              <option value="long_term">Long-Term</option>
            </select>

            {/* Seed examples button shown only when no actions */}
            {actions.length === 0 && teams.length > 0 && (
              <button
                onClick={handleSeedExamples}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                {seeding ? <Spinner /> : (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                )}
                Load example actions
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 rounded-full bg-orbit-forest/10 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-orbit-forest opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </div>
            <p className="font-semibold text-orbit-dark">No actions yet</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Use the form above to create the first action, or load examples to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orbit-forest/[0.08] border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Competency</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Owner</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Timeline</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Completion</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Comments</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((action) => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Click any <span className="font-semibold">Owner</span>, <span className="font-semibold">Completion</span>, or <span className="font-semibold">Comments</span> cell to edit it inline.
      </p>
    </div>
  );
}
