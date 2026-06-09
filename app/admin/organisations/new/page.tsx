'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { INDUSTRIES } from '@/types';
import { MIN_MANAGER_PASSWORD_LENGTH } from '@/lib/manager-auth';

const industryOptions = INDUSTRIES.map((i) => ({ value: i, label: i }));

const functionOptions = [
  { value: 'back', label: 'Back office' },
  { value: 'middle', label: 'Middle office' },
  { value: 'front', label: 'Front office' },
];

export default function NewOrganisationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [addFirstTeam, setAddFirstTeam] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [teamFunction, setTeamFunction] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (addFirstTeam) {
      if (!teamName.trim() || !teamFunction || !teamSize || !managerName.trim() || !managerEmail.trim()) {
        setError('Complete all first team and manager fields, or uncheck "Add first team".');
        return;
      }
      if (managerPassword.length < MIN_MANAGER_PASSWORD_LENGTH) {
        setError(`Manager password must be at least ${MIN_MANAGER_PASSWORD_LENGTH} characters.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to create organisation');
      }
      const { id } = await res.json();

      if (addFirstTeam) {
        const teamRes = await fetch('/api/admin/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organisationId: id,
            name: teamName,
            function: teamFunction,
            size: parseInt(teamSize),
            managerName,
            managerEmail,
            managerPassword,
            sendInviteEmail,
          }),
        });
        if (!teamRes.ok) {
          const d = await teamRes.json();
          throw new Error(d.error ?? 'Organisation created but failed to add first team');
        }
      }

      router.push(`/admin/organisations/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/organisations" className="text-sm text-orbit-green hover:underline">
          ← Organisations
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-2">New Organisation</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="flex flex-col gap-5">
            <Input
              label="Organisation name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Financial Services"
              required
            />
            <Select
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Select an industry"
              options={industryOptions}
              required
            />
          </div>
        </Card>

        <Card>
          <label className="flex items-start gap-2.5 cursor-pointer mb-5">
            <input
              type="checkbox"
              checked={addFirstTeam}
              onChange={(e) => setAddFirstTeam(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orbit-forest focus:ring-orbit-green cursor-pointer"
            />
            <div>
              <p className="text-sm font-bold text-orbit-dark">Add first team</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Set up the initial team and manager login when creating the organisation.
              </p>
            </div>
          </label>

          {addFirstTeam && (
            <div className="flex flex-col gap-5 pt-2 border-t border-gray-100">
              <Input
                label="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Operations Team"
                required={addFirstTeam}
              />
              <Select
                label="Office function"
                value={teamFunction}
                onChange={(e) => setTeamFunction(e.target.value)}
                placeholder="Select function"
                options={functionOptions}
                required={addFirstTeam}
              />
              <Input
                label="Team size"
                type="number"
                min="1"
                max="500"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="Number of people in the team"
                required={addFirstTeam}
              />

              <hr className="border-gray-200" />
              <h3 className="text-sm font-bold text-orbit-dark -mb-2">Team Manager</h3>
              <Input
                label="Manager's full name"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Jane Smith"
                required={addFirstTeam}
              />
              <Input
                label="Manager's email"
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="jane@organisation.com"
                required={addFirstTeam}
                hint="Used to sign in to the results dashboard."
              />
              <Input
                label="Manager's password"
                type="password"
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                placeholder="Set a login password"
                required={addFirstTeam}
                minLength={MIN_MANAGER_PASSWORD_LENGTH}
                autoComplete="new-password"
                hint={`Minimum ${MIN_MANAGER_PASSWORD_LENGTH} characters. Share this with the manager securely.`}
              />
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInviteEmail}
                  onChange={(e) => setSendInviteEmail(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orbit-forest focus:ring-orbit-green cursor-pointer"
                />
                <span className="text-sm text-gray-600 leading-snug">
                  Send dashboard access invite email (password is not included in the email)
                </span>
              </label>
            </div>
          )}
        </Card>

        {error && (
          <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {addFirstTeam ? 'Create organisation & team' : 'Create organisation'}
          </Button>
          <Link href="/admin/organisations">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
