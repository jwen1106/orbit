'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface OrgOption {
  id: string;
  name: string;
  industry: string;
  teamCount?: number;
}

interface TeamOption {
  id: string;
  name: string;
  organisationId: string;
  function?: string;
  size?: number;
  manager?: { displayName: string; email: string } | null;
}

const functionLabel: Record<string, string> = {
  back: 'Back office',
  middle: 'Middle office',
  front: 'Front office',
};

type Step = 1 | 2 | 3;

export default function NewEngagementPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [title, setTitle] = useState('');
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Fetch orgs on mount
  useEffect(() => {
    fetch('/api/admin/organisations')
      .then((r) => r.json())
      .then((data) => {
        setOrgs(Array.isArray(data) ? data : []);
        setOrgsLoading(false);
      })
      .catch(() => setOrgsLoading(false));
  }, []);

  // Fetch teams when org selected
  useEffect(() => {
    if (!selectedOrg) return;
    setTeamsLoading(true);
    fetch(`/api/admin/teams?organisationId=${selectedOrg.id}`)
      .then((r) => r.json())
      .then((data) => {
        setTeams(Array.isArray(data) ? data : []);
        setTeamsLoading(false);
      })
      .catch(() => setTeamsLoading(false));
  }, [selectedOrg]);

  function pickOrg(org: OrgOption) {
    setSelectedOrg(org);
    setSelectedTeam(null);
    setTeams([]);
    setStep(2);
  }

  function pickTeam(team: TeamOption) {
    setSelectedTeam(team);
    setStep(3);
  }

  async function handleCreate() {
    if (!selectedOrg || !selectedTeam) return;
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/admin/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          organisationId: selectedOrg.id,
          title: title.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to create engagement');
      }
      const { id } = await res.json();
      router.push(`/admin/engagements/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating engagement');
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/engagements" className="text-sm text-orbit-green hover:underline">
          ← Engagements
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-2">New Engagement</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a survey engagement for a team in three steps.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {(['Select Organisation', 'Select Team', 'Confirm & Create'] as const).map((label, i) => {
          const num = (i + 1) as Step;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={label} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (isDone) setStep(num);
                }}
                disabled={!isDone}
                className="flex items-center gap-2"
              >
                <span
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                    isActive
                      ? 'bg-orbit-forest border-orbit-forest text-white'
                      : isDone
                      ? 'bg-orbit-green border-orbit-green text-white cursor-pointer'
                      : 'bg-white border-gray-300 text-gray-400',
                  ].join(' ')}
                >
                  {isDone ? '✓' : num}
                </span>
                <span
                  className={[
                    'text-sm font-semibold hidden sm:inline',
                    isActive ? 'text-orbit-dark' : isDone ? 'text-orbit-green' : 'text-gray-400',
                  ].join(' ')}
                >
                  {label}
                </span>
              </button>
              {i < 2 && (
                <div
                  className={[
                    'h-px w-8 mx-2',
                    step > num ? 'bg-orbit-green' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Select Organisation ─────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-orbit-dark">
            Which organisation is this engagement for?
          </h2>
          {orgsLoading ? (
            <div className="text-sm text-gray-400 py-8 text-center">Loading organisations…</div>
          ) : orgs.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
              <p className="text-gray-500 mb-3">No organisations yet.</p>
              <Link href="/admin/organisations/new">
                <Button>Create an organisation first</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => pickOrg(org)}
                  className="text-left rounded-xl border-2 border-gray-200 bg-white px-5 py-4 hover:border-orbit-green hover:shadow transition-all group"
                >
                  <p className="font-bold text-orbit-dark group-hover:text-orbit-forest">
                    {org.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{org.industry}</p>
                  <p className="text-xs text-orbit-green mt-2 font-semibold">
                    Select →
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Select Team ─────────────────────────────────────── */}
      {step === 2 && selectedOrg && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-orbit-dark">
              Which team within <span className="text-orbit-forest">{selectedOrg.name}</span>?
            </h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-orbit-green hover:underline"
            >
              ← Change organisation
            </button>
          </div>

          {teamsLoading ? (
            <div className="text-sm text-gray-400 py-8 text-center">Loading teams…</div>
          ) : teams.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
              <p className="text-gray-500 mb-3">No teams in this organisation yet.</p>
              <Link href={`/admin/organisations/${selectedOrg.id}/teams/new`}>
                <Button>Add a team first</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => pickTeam(team)}
                  className="text-left rounded-xl border-2 border-gray-200 bg-white px-5 py-4 hover:border-orbit-green hover:shadow transition-all group"
                >
                  <p className="font-bold text-orbit-dark group-hover:text-orbit-forest">
                    {team.name}
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {team.function && (
                      <p className="text-xs text-gray-500">
                        {functionLabel[team.function] ?? team.function}
                        {team.size ? ` · ${team.size} people` : ''}
                      </p>
                    )}
                    {team.manager && (
                      <p className="text-xs text-gray-400">
                        Manager: {team.manager.displayName}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-orbit-green mt-2 font-semibold">Select →</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Confirm & Create ────────────────────────────────── */}
      {step === 3 && selectedOrg && selectedTeam && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-orbit-dark">Confirm engagement details</h2>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-orbit-green hover:underline"
            >
              ← Change team
            </button>
          </div>

          {/* Survey title */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
            <label className="block text-sm font-semibold text-orbit-dark mb-1">
              Survey Title <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Give this survey a name to distinguish it from other engagements for the same team — e.g. &ldquo;Q1 2026 Assessment&rdquo; or &ldquo;Post-restructure Review&rdquo;.
            </p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q1 2026 Operational Assessment"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-orbit-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orbit-forest"
            />
          </div>

          {/* Summary card */}
          <div className="rounded-xl border-2 border-orbit-forest bg-white overflow-hidden">
            <div className="bg-orbit-forest px-6 py-4">
              <p className="text-sm font-bold text-white">Engagement summary</p>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Organisation</p>
                <p className="font-bold text-orbit-dark">{selectedOrg.name}</p>
                <p className="text-xs text-gray-500">{selectedOrg.industry}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Team</p>
                <p className="font-bold text-orbit-dark">{selectedTeam.name}</p>
                {selectedTeam.function && (
                  <p className="text-xs text-gray-500">
                    {functionLabel[selectedTeam.function] ?? selectedTeam.function}
                    {selectedTeam.size ? ` · ${selectedTeam.size} people` : ''}
                  </p>
                )}
              </div>
              {selectedTeam.manager && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Manager</p>
                  <p className="font-bold text-orbit-dark">{selectedTeam.manager.displayName}</p>
                  <p className="text-xs text-gray-500">{selectedTeam.manager.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* What happens next */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              What happens when you create this engagement
            </p>
            <ol className="space-y-2">
              {[
                'Unique survey tokens are generated for members and the manager',
                'The engagement is created in Draft status — the survey is not yet live',
                'You activate the survey when ready to start collecting responses',
                'You can share the member link or send individual email invitations',
                'Once responses are in, close the survey and run AI analysis',
              ].map((step, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-gray-600">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orbit-forest text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {error && (
            <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleCreate} loading={creating}>
              Create engagement
            </Button>
            <Link href="/admin/engagements">
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
