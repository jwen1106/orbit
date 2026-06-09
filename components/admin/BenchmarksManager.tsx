'use client';

import { useState, useTransition } from 'react';
import type { Benchmark, BenchmarkEntry, Competency, OfficeFunction } from '@/types';
import { COMPETENCY_LABELS } from '@/types';
import {
  fieldInputCompactClass,
  fieldSelectCompactClass,
} from '@/lib/field-styles';

const COMPETENCIES: Competency[] = ['people_relationships', 'growth_impact', 'purpose_alignment'];
const FUNCTIONS: OfficeFunction[] = ['front', 'middle', 'back'];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function newId(industry: string, func: string, sizeRange: string) {
  return `${slugify(industry)}__${func}__${slugify(sizeRange)}`;
}

type EditState = {
  industry: string;
  function: OfficeFunction;
  sizeRange: string;
  scores: Record<Competency, { industryAverage: string; bestInClass: string }>;
};

function defaultEditState(bm?: Benchmark): EditState {
  return {
    industry: bm?.industry ?? '',
    function: bm?.function ?? 'front',
    sizeRange: bm?.sizeRange ?? '',
    scores: {
      people_relationships: {
        industryAverage: bm?.competencyScores?.people_relationships?.industryAverage?.toString() ?? '',
        bestInClass: bm?.competencyScores?.people_relationships?.bestInClass?.toString() ?? '',
      },
      growth_impact: {
        industryAverage: bm?.competencyScores?.growth_impact?.industryAverage?.toString() ?? '',
        bestInClass: bm?.competencyScores?.growth_impact?.bestInClass?.toString() ?? '',
      },
      purpose_alignment: {
        industryAverage: bm?.competencyScores?.purpose_alignment?.industryAverage?.toString() ?? '',
        bestInClass: bm?.competencyScores?.purpose_alignment?.bestInClass?.toString() ?? '',
      },
    },
  };
}

function parseScores(
  scores: EditState['scores'],
): Record<Competency, BenchmarkEntry> {
  const result = {} as Record<Competency, BenchmarkEntry>;
  for (const c of COMPETENCIES) {
    result[c] = {
      industryAverage: parseFloat(scores[c].industryAverage) || 0,
      bestInClass: parseFloat(scores[c].bestInClass) || 0,
    };
  }
  return result;
}

function ScoreInputPair({
  value,
  onChange,
}: {
  value: { industryAverage: string; bestInClass: string };
  onChange: (v: { industryAverage: string; bestInClass: string }) => void;
}) {
  return (
    <div className="flex items-center gap-1 justify-center">
      <input
        type="number"
        min="0"
        max="5"
        step="0.1"
        placeholder="Avg"
        value={value.industryAverage}
        onChange={(e) => onChange({ ...value, industryAverage: e.target.value })}
        className={`${fieldInputCompactClass} w-14 px-1 py-0.5`}
      />
      <span className="text-gray-300">/</span>
      <input
        type="number"
        min="0"
        max="5"
        step="0.1"
        placeholder="Best"
        value={value.bestInClass}
        onChange={(e) => onChange({ ...value, bestInClass: e.target.value })}
        className={`${fieldInputCompactClass} w-14 px-1 py-0.5`}
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function BenchmarksManager({ initialBenchmarks }: { initialBenchmarks: Benchmark[] }) {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>(initialBenchmarks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditState>(defaultEditState());
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<EditState>(defaultEditState());
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSavingNew, startSavingNew] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startEdit(bm: Benchmark) {
    setEditingId(bm.id);
    setEditData(defaultEditState(bm));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveEdit(bm: Benchmark) {
    setSavingId(bm.id);
    setError(null);
    try {
      const payload = {
        industry: editData.industry.trim(),
        function: editData.function,
        sizeRange: editData.sizeRange.trim(),
        competencyScores: parseScores(editData.scores),
        source: 'oaklin_authored' as const,
      };
      const res = await fetch(`/api/admin/benchmarks/${bm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setBenchmarks((prev) =>
        prev.map((b) =>
          b.id === bm.id
            ? { ...b, ...payload, competencyScores: parseScores(editData.scores) }
            : b,
        ),
      );
      setEditingId(null);
    } catch (e) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(bm: Benchmark) {
    if (!confirm(`Delete benchmark for "${bm.industry} / ${bm.function} / ${bm.sizeRange}"?`)) return;
    setDeletingId(bm.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/benchmarks/${bm.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setBenchmarks((prev) => prev.filter((b) => b.id !== bm.id));
      if (editingId === bm.id) setEditingId(null);
    } catch {
      setError('Failed to delete row. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  async function generateScores(bm: Benchmark) {
    setGeneratingId(bm.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/benchmarks/${bm.id}/generate`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const { competencyScores } = await res.json();
      setBenchmarks((prev) =>
        prev.map((b) =>
          b.id === bm.id
            ? { ...b, competencyScores, source: 'ai_supplemented' as const }
            : b,
        ),
      );
      if (editingId === bm.id) {
        setEditData((prev) => ({
          ...prev,
          scores: {
            people_relationships: {
              industryAverage: competencyScores.people_relationships.industryAverage.toString(),
              bestInClass: competencyScores.people_relationships.bestInClass.toString(),
            },
            growth_impact: {
              industryAverage: competencyScores.growth_impact.industryAverage.toString(),
              bestInClass: competencyScores.growth_impact.bestInClass.toString(),
            },
            purpose_alignment: {
              industryAverage: competencyScores.purpose_alignment.industryAverage.toString(),
              bestInClass: competencyScores.purpose_alignment.bestInClass.toString(),
            },
          },
        }));
      }
    } catch {
      setError('AI generation failed. Please check the industry/function/size and try again.');
    } finally {
      setGeneratingId(null);
    }
  }

  async function saveNewRow() {
    setError(null);
    if (!newData.industry.trim() || !newData.sizeRange.trim()) {
      setError('Industry and Size Range are required.');
      return;
    }
    const id = newId(newData.industry, newData.function, newData.sizeRange);
    const payload = {
      industry: newData.industry.trim(),
      function: newData.function,
      sizeRange: newData.sizeRange.trim(),
      competencyScores: parseScores(newData.scores),
    };
    try {
      const res = await fetch('/api/admin/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setBenchmarks((prev) =>
        [...prev, { ...payload, id: created.id ?? id, source: 'oaklin_authored' as const, updatedAt: null as never, updatedBy: 'admin' }]
          .sort((a, b) => a.industry.localeCompare(b.industry)),
      );
      setIsAdding(false);
      setNewData(defaultEditState());
    } catch {
      setError('Failed to create benchmark. It may already exist with that ID.');
    }
  }

  async function generateScoresForNew() {
    if (!newData.industry.trim() || !newData.sizeRange.trim()) {
      setError('Fill in Industry, Function and Size Range before generating scores.');
      return;
    }
    setError(null);
    const id = newId(newData.industry, newData.function, newData.sizeRange);
    const placeholder = {
      industry: newData.industry.trim(),
      function: newData.function,
      sizeRange: newData.sizeRange.trim(),
      competencyScores: parseScores(newData.scores),
      source: 'oaklin_authored' as const,
      id,
      updatedAt: null as never,
      updatedBy: 'admin',
    };
    try {
      const createRes = await fetch('/api/admin/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: placeholder.industry,
          function: placeholder.function,
          sizeRange: placeholder.sizeRange,
          competencyScores: parseScores(newData.scores),
        }),
      });
      if (!createRes.ok) throw new Error(await createRes.text());
      const createdId = (await createRes.json()).id ?? id;

      setGeneratingId(createdId);
      setBenchmarks((prev) =>
        [...prev, { ...placeholder, id: createdId }].sort((a, b) => a.industry.localeCompare(b.industry)),
      );
      setIsAdding(false);
      setNewData(defaultEditState());

      const genRes = await fetch(`/api/admin/benchmarks/${createdId}/generate`, { method: 'POST' });
      if (!genRes.ok) throw new Error(await genRes.text());
      const { competencyScores } = await genRes.json();
      setBenchmarks((prev) =>
        prev.map((b) =>
          b.id === createdId
            ? { ...b, competencyScores, source: 'ai_supplemented' as const }
            : b,
        ),
      );
    } catch {
      setError('AI generation failed. Row was saved — you can edit scores manually.');
    } finally {
      setGeneratingId(null);
    }
  }

  const isEditRow = (id: string) => editingId === id;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Industry</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Function</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Size</th>
              {COMPETENCIES.map((c) => (
                <th key={c} className="px-3 py-3 text-center font-semibold text-gray-600 text-xs leading-tight">
                  {COMPETENCY_LABELS[c]}
                  <br />
                  <span className="text-gray-400 font-normal">Avg / Best</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Source</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* New row form */}
            {isAdding && (
              <tr className="border-b border-orbit-forest/20 bg-green-50/40">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    placeholder="e.g. Financial Services"
                    value={newData.industry}
                    onChange={(e) => setNewData((d) => ({ ...d, industry: e.target.value }))}
                    className={fieldInputCompactClass}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={newData.function}
                    onChange={(e) => setNewData((d) => ({ ...d, function: e.target.value as OfficeFunction }))}
                    className={`${fieldSelectCompactClass} w-full capitalize`}
                  >
                    {FUNCTIONS.map((f) => (
                      <option key={f} value={f} className="capitalize">{f} office</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    placeholder="e.g. 11-25"
                    value={newData.sizeRange}
                    onChange={(e) => setNewData((d) => ({ ...d, sizeRange: e.target.value }))}
                    className={fieldInputCompactClass}
                  />
                </td>
                {COMPETENCIES.map((c) => (
                  <td key={c} className="px-2 py-2">
                    <ScoreInputPair
                      value={newData.scores[c]}
                      onChange={(v) => setNewData((d) => ({ ...d, scores: { ...d.scores, [c]: v } }))}
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-center">
                  <span className="text-xs text-gray-400 italic">new</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={generateScoresForNew}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                      title="Generate scores with AI"
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                      </svg>
                      AI
                    </button>
                    <button
                      onClick={saveNewRow}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-orbit-forest text-white hover:bg-orbit-green transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setIsAdding(false); setNewData(defaultEditState()); setError(null); }}
                      className="text-xs font-medium px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {benchmarks.length === 0 && !isAdding && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  No benchmarks yet. Click &ldquo;Add Row&rdquo; to create one.
                </td>
              </tr>
            )}

            {benchmarks.map((bm) => {
              const isGenerating = generatingId === bm.id;
              const isSaving = savingId === bm.id;
              const isDeleting = deletingId === bm.id;
              const editing = isEditRow(bm.id);

              return (
                <tr
                  key={bm.id}
                  className={[
                    'border-b border-gray-100 transition-colors',
                    editing ? 'bg-green-50/40' : 'hover:bg-gray-50/60',
                  ].join(' ')}
                >
                  {editing ? (
                    <>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={editData.industry}
                          onChange={(e) => setEditData((d) => ({ ...d, industry: e.target.value }))}
                          className={fieldInputCompactClass}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={editData.function}
                          onChange={(e) => setEditData((d) => ({ ...d, function: e.target.value as OfficeFunction }))}
                          className={`${fieldSelectCompactClass} w-full capitalize`}
                        >
                          {FUNCTIONS.map((f) => (
                            <option key={f} value={f} className="capitalize">{f} office</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={editData.sizeRange}
                          onChange={(e) => setEditData((d) => ({ ...d, sizeRange: e.target.value }))}
                          className={fieldInputCompactClass}
                        />
                      </td>
                      {COMPETENCIES.map((c) => (
                        <td key={c} className="px-2 py-2">
                          <ScoreInputPair
                            value={editData.scores[c]}
                            onChange={(v) => setEditData((d) => ({ ...d, scores: { ...d.scores, [c]: v } }))}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 text-center">
                        <span
                          className={[
                            'text-xs font-semibold px-2 py-0.5 rounded',
                            bm.source === 'ai_supplemented'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-orbit-forest',
                          ].join(' ')}
                        >
                          {bm.source === 'ai_supplemented' ? 'AI' : 'Oaklin'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => generateScores(bm)}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 transition-colors"
                            title="Re-generate scores with AI"
                          >
                            {isGenerating ? <Spinner /> : (
                              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                              </svg>
                            )}
                            AI
                          </button>
                          <button
                            onClick={() => saveEdit(bm)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-orbit-forest text-white hover:bg-orbit-green disabled:opacity-50 transition-colors"
                          >
                            {isSaving ? <Spinner /> : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs font-medium px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium text-orbit-dark">{bm.industry}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{bm.function} office</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{bm.sizeRange}</td>
                      {COMPETENCIES.map((c) => {
                        const scores = bm.competencyScores?.[c];
                        return (
                          <td key={c} className="px-3 py-3 text-center text-xs text-gray-700">
                            {isGenerating ? (
                              <span className="inline-flex justify-center text-amber-600"><Spinner /></span>
                            ) : scores ? (
                              `${scores.industryAverage} / ${scores.bestInClass}`
                            ) : '—'}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={[
                            'text-xs font-semibold px-2 py-0.5 rounded',
                            bm.source === 'ai_supplemented'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-orbit-forest',
                          ].join(' ')}
                        >
                          {bm.source === 'ai_supplemented' ? 'AI' : 'Oaklin'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(bm)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRow(bm)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            {isDeleting ? <Spinner /> : (
                              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add row button */}
      {!isAdding && (
        <button
          onClick={() => { setIsAdding(true); setNewData(defaultEditState()); setError(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-orbit-forest text-white hover:bg-orbit-green transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Row
        </button>
      )}
    </div>
  );
}
