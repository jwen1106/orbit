'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { MIN_MANAGER_PASSWORD_LENGTH } from '@/lib/manager-auth';

const functionOptions = [
  { value: 'back', label: 'Back office' },
  { value: 'middle', label: 'Middle office' },
  { value: 'front', label: 'Front office' },
];

export default function NewTeamPage() {
  const router = useRouter();
  const { id: orgId } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [func, setFunc] = useState('');
  const [size, setSize] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (managerPassword.length < MIN_MANAGER_PASSWORD_LENGTH) {
      setError(`Manager password must be at least ${MIN_MANAGER_PASSWORD_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisationId: orgId,
          name,
          function: func,
          size: parseInt(size),
          managerName,
          managerEmail,
          managerPassword,
          sendInviteEmail,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to create team');
      }
      router.push(`/admin/organisations/${orgId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href={`/admin/organisations/${orgId}`}
          className="text-sm text-orbit-green hover:underline"
        >
          ← Back to organisation
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-2">Add Team</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Operations Team"
            required
          />
          <Select
            label="Office function"
            value={func}
            onChange={(e) => setFunc(e.target.value)}
            placeholder="Select function"
            options={functionOptions}
            required
          />
          <Input
            label="Team size"
            type="number"
            min="1"
            max="500"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Number of people in the team"
            required
          />

          <hr className="border-gray-200" />
          <h3 className="text-sm font-bold text-orbit-dark -mb-2">Team Manager</h3>
          <Input
            label="Manager's full name"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="e.g. Jane Smith"
            required
          />
          <Input
            label="Manager's email"
            type="email"
            value={managerEmail}
            onChange={(e) => setManagerEmail(e.target.value)}
            placeholder="jane@organisation.com"
            required
            hint="Used to sign in to the results dashboard."
          />
          <Input
            label="Manager's password"
            type="password"
            value={managerPassword}
            onChange={(e) => setManagerPassword(e.target.value)}
            placeholder="Set a login password"
            required
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

          {error && (
            <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Create team
            </Button>
            <Link href={`/admin/organisations/${orgId}`}>
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
