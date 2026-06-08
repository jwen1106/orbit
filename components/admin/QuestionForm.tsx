'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import type { Question, Organisation } from '@/types';

const competencyOptions = [
  { value: 'people_relationships', label: 'People & Relationships' },
  { value: 'growth_impact', label: 'Growth & Impact' },
  { value: 'purpose_alignment', label: 'Purpose & Alignment' },
];

const roleOptions = [
  { value: 'both', label: 'Both (manager and member see this question)' },
  { value: 'manager', label: 'Manager only' },
  { value: 'member', label: 'Member only' },
];

interface QuestionFormProps {
  initial?: Partial<Question>;
  mode: 'create' | 'edit';
}

export default function QuestionForm({ initial, mode }: QuestionFormProps) {
  const router = useRouter();

  const [text, setText] = useState(initial?.text ?? '');
  const [subtext, setSubtext] = useState(initial?.subtext ?? '');
  const [competency, setCompetency] = useState<string>(initial?.competency ?? 'people_relationships');
  const [role, setRole] = useState<string>(initial?.role ?? 'both');
  const [order, setOrder] = useState<string>(String(initial?.order ?? 1));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [criteria, setCriteria] = useState<Record<string, string>>({
    '1': initial?.criteria?.['1'] ?? '',
    '2': initial?.criteria?.['2'] ?? '',
    '3': initial?.criteria?.['3'] ?? '',
    '4': initial?.criteria?.['4'] ?? '',
    '5': initial?.criteria?.['5'] ?? '',
  });
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>(
    initial?.assignedOrganisationIds ?? [],
  );
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/organisations')
      .then((r) => r.json())
      .then((data) => {
        setOrganisations(Array.isArray(data) ? data : []);
        setOrgsLoading(false);
      })
      .catch(() => setOrgsLoading(false));
  }, []);

  function updateCriteria(score: string, value: string) {
    setCriteria((prev) => ({ ...prev, [score]: value }));
  }

  function toggleOrg(orgId: string) {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId],
    );
  }

  function selectAllOrgs() {
    setSelectedOrgIds([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!text.trim()) { setError('Question title is required.'); return; }
    if (!criteria['1'] || !criteria['5']) {
      setError('At least the score 1 and score 5 criteria descriptions are required.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        version: 'v1',
        text: text.trim(),
        subtext: subtext.trim() || undefined,
        competency,
        role,
        order: parseInt(order) || 1,
        isActive,
        criteria,
        assignedOrganisationIds: selectedOrgIds,
      };

      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/admin/questions/${initial?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to save question');
      }
      router.push('/admin/questions');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving question');
    } finally {
      setLoading(false);
    }
  }

  const criteriaLabels: Record<string, string> = {
    '1': '1 — Not present / Just beginning',
    '2': '2 — Emerging / Inconsistent',
    '3': '3 — Developing / Partial',
    '4': '4 — Established / Consistent',
    '5': '5 — Optimised / Exemplary',
  };

  const isGlobal = selectedOrgIds.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic details */}
      <Card padding="md">
        <h2 className="text-base font-bold text-orbit-dark mb-5">Question details</h2>
        <div className="space-y-4">
          <Input
            label="Question title"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Communication & Collaboration"
            hint="The short heading shown as the question label in the survey."
            required
          />
          <Textarea
            label="Question description"
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            placeholder="e.g. How effectively do team members communicate and share information across the team?"
            hint="The full question shown below the title. Supports 1–2 sentences."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Competency"
              value={competency}
              onChange={(e) => setCompetency(e.target.value)}
              options={competencyOptions}
              hint="Which pillar does this question measure?"
            />
            <Select
              label="Who answers this?"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={roleOptions}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 items-start">
            <Input
              label="Display order"
              type="number"
              min="1"
              max="99"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              hint="Lower numbers appear first within the same competency."
            />
            <div className="flex flex-col gap-1 pt-1">
              <label className="text-sm font-semibold text-orbit-dark">Active</label>
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  className={[
                    'relative inline-flex h-6 w-10 rounded-full transition-colors flex-shrink-0',
                    isActive ? 'bg-orbit-green' : 'bg-gray-300',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5',
                      isActive ? 'translate-x-4 ml-0.5' : 'translate-x-0.5',
                    ].join(' ')}
                  />
                </button>
                <span className="text-sm text-gray-600">
                  {isActive ? 'Included in surveys' : 'Hidden from surveys'}
                </span>
              </label>
              <p className="text-xs text-gray-400">Inactive questions are excluded from new engagements.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Organisation assignment */}
      <Card padding="md">
        <h2 className="text-base font-bold text-orbit-dark mb-1">Organisation assignment</h2>
        <p className="text-sm text-gray-500 mb-4">
          Choose which organisations will see this question in their surveys.
          Leave set to <span className="font-semibold">All organisations</span> to include it globally.
        </p>

        {orgsLoading ? (
          <p className="text-sm text-gray-400">Loading organisations…</p>
        ) : (
          <div className="space-y-2">
            {/* Global option */}
            <label className={[
              'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors',
              isGlobal
                ? 'border-orbit-green bg-green-50'
                : 'border-gray-200 hover:border-gray-300',
            ].join(' ')}>
              <input
                type="radio"
                checked={isGlobal}
                onChange={selectAllOrgs}
                className="h-4 w-4 text-orbit-green accent-orbit-green"
              />
              <div>
                <p className="text-sm font-semibold text-orbit-dark">All organisations (global)</p>
                <p className="text-xs text-gray-500">This question appears in every organisation's surveys</p>
              </div>
            </label>

            {/* Divider */}
            {organisations.length > 0 && (
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">or select specific organisations</span>
                </div>
              </div>
            )}

            {/* Per-org checkboxes */}
            {organisations.length === 0 ? (
              <p className="text-sm text-gray-400 px-1">
                No organisations exist yet. Create one first in the Organisations section.
              </p>
            ) : (
              organisations.map((org) => (
                <label
                  key={org.id}
                  className={[
                    'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors',
                    selectedOrgIds.includes(org.id)
                      ? 'border-orbit-forest bg-green-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrgIds.includes(org.id)}
                    onChange={() => toggleOrg(org.id)}
                    className="h-4 w-4 rounded text-orbit-forest accent-orbit-forest"
                  />
                  <div>
                    <p className="text-sm font-semibold text-orbit-dark">{org.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{org.industry}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Scoring criteria */}
      <Card padding="md">
        <h2 className="text-base font-bold text-orbit-dark mb-1">Score criteria</h2>
        <p className="text-sm text-gray-500 mb-5">
          Describe what each score looks like in practice. Respondents see these descriptions
          when selecting their answer. Score 1 and 5 are required; 2–4 can be left blank.
        </p>
        <div className="space-y-4">
          {['1', '2', '3', '4', '5'].map((score) => (
            <Textarea
              key={score}
              label={criteriaLabels[score]}
              value={criteria[score]}
              onChange={(e) => updateCriteria(score, e.target.value)}
              placeholder={`Describe what score ${score} looks like for this question…`}
              rows={2}
            />
          ))}
        </div>
      </Card>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {mode === 'create' ? 'Create question' : 'Save changes'}
        </Button>
        <Link href="/admin/questions">
          <Button variant="ghost" type="button">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
