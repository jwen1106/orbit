'use client';

import { useState } from 'react';
import type { Respondent } from '@/types';

interface Props {
  engagementId: string;
  respondents: Respondent[];
  onUpdated: () => void;
}

function formatDate(ts: Respondent['completedAt']): string {
  if (!ts) return '—';
  const d = (ts as { toDate?: () => Date }).toDate?.();
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SurveyResponsesList({ engagementId, respondents, onUpdated }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function deleteResponse(respondent: Respondent) {
    const label = respondent.name || (respondent.role === 'manager' ? 'the manager' : 'this respondent');
    if (!confirm(`Delete the response from ${label}? This cannot be undone.`)) return;
    setDeletingId(respondent.id);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/engagements/${engagementId}/respondents/${respondent.id}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to delete');
      }
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting response');
    } finally {
      setDeletingId(null);
    }
  }

  const displayed = respondents.filter((r) => r.status === 'completed' || r.status === 'in_progress');

  return (
    <div className="mt-5 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-orbit-dark">Survey completed by</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {displayed.filter((r) => r.status === 'completed').length} completed
            {displayed.filter((r) => r.status === 'in_progress').length > 0 &&
              ` · ${displayed.filter((r) => r.status === 'in_progress').length} in progress`}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-3">
          {error}
        </div>
      )}

      {displayed.length === 0 ? (
        <p className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-lg">
          No responses yet — share the survey link to begin collecting submissions.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Role</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Date completed</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-orbit-dark">
                    {r.name || <span className="italic text-gray-400">Anonymous</span>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">{r.email || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.role === 'manager'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {r.role === 'manager' ? 'Team Manager' : 'Team Member'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">
                    {r.status === 'completed'
                      ? formatDate(r.completedAt)
                      : <span className="italic text-amber-600">In progress</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => deleteResponse(r)}
                      disabled={deletingId === r.id}
                      className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      title="Delete response"
                    >
                      {deletingId === r.id ? (
                        <span className="text-xs">Deleting…</span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
