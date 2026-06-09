'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { Question } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

const competencyOptions = [
  { value: 'all', label: 'All competencies' },
  { value: 'people_relationships', label: 'People & Relationships' },
  { value: 'growth_impact', label: 'Growth & Impact' },
  { value: 'purpose_alignment', label: 'Purpose & Alignment' },
];

const roleOptions = [
  { value: 'all', label: 'All roles' },
  { value: 'both', label: 'Both' },
  { value: 'manager', label: 'Manager only' },
  { value: 'member', label: 'Member only' },
];

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterComp, setFilterComp] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  function load() {
    fetch('/api/admin/questions')
      .then((r) => r.json())
      .then((data) => { setQuestions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, isActive: !current } : q)),
    );
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  const filtered = questions.filter((q) => {
    if (filterComp !== 'all' && q.competency !== filterComp) return false;
    if (filterRole !== 'all' && q.role !== filterRole) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orbit-dark">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · version v1
          </p>
        </div>
        <Link href="/admin/questions/new">
          <Button>+ New Question</Button>
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={filterComp}
          onChange={(e) => setFilterComp(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark focus:outline-none focus:ring-2 focus:ring-orbit-green"
        >
          {competencyOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark focus:outline-none focus:ring-2 focus:ring-orbit-green"
        >
          {roleOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 self-center ml-1">
          {filtered.length} shown
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading questions…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-500">
            <p className="mb-4">No questions yet.</p>
            <Link href="/admin/questions/new">
              <Button>Add your first question</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-600 w-10">#</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Question</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Competency</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Role</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-600">Active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-b border-gray-100 table-row-hover">
                  <td className="px-5 py-3 text-gray-400 text-xs">{q.order}</td>
                  <td className="px-5 py-3 text-orbit-dark max-w-sm">
                    <p className="font-semibold">{q.text}</p>
                    {q.subtext && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{q.subtext}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {COMPETENCY_LABELS[q.competency]}
                  </td>
                  <td className="px-5 py-3 text-gray-600 capitalize text-xs whitespace-nowrap">
                    {q.role}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => toggleActive(q.id, q.isActive)}
                      title={q.isActive ? 'Deactivate' : 'Activate'}
                      className={[
                        'relative inline-flex h-5 w-9 rounded-full transition-colors',
                        q.isActive ? 'bg-orbit-green' : 'bg-gray-300',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5',
                          q.isActive ? 'translate-x-4 ml-0.5' : 'translate-x-0.5',
                        ].join(' ')}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/questions/${q.id}/edit`}
                        className="text-orbit-green hover:underline text-xs font-semibold"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
