'use client';

import { useState, useEffect } from 'react';
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

interface ManagerInfo {
  uid: string;
  displayName: string;
  email: string;
}

export default function EditTeamPage() {
  const router = useRouter();
  const { id: orgId, teamId } = useParams<{ id: string; teamId: string }>();

  const [name, setName] = useState('');
  const [func, setFunc] = useState('');
  const [size, setSize] = useState('');
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  useEffect(() => {
    fetch(`/api/admin/teams/${teamId}`)
      .then((r) => r.json())
      .then((data) => {
        setName(data.name ?? '');
        setFunc(data.function ?? '');
        setSize(data.size ? String(data.size) : '');
        setManager(data.manager ?? null);
        setManagerName(data.manager?.displayName ?? '');
        setManagerEmail(data.manager?.email ?? '');
        setLoadingData(false);
      })
      .catch(() => {
        setError('Failed to load team data.');
        setLoadingData(false);
      });
  }, [teamId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (managerPassword && managerPassword.length < MIN_MANAGER_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_MANAGER_PASSWORD_LENGTH} characters.`);
      }

      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          function: func || undefined,
          size: size || undefined,
          managerName: managerName || undefined,
          managerEmail: managerEmail || undefined,
          managerPassword: managerPassword || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to save');
      }
      router.push(`/admin/organisations/${orgId}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving team');
    } finally {
      setSaving(false);
    }
  }

  async function handleInviteManager() {
    setInviteStatus('idle');
    setError('');
    setInviting(true);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/invite`, {
        method: 'POST',
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to send invite');
      }
      setInviteStatus('sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending invite');
      setInviteStatus('error');
    } finally {
      setInviting(false);
    }
  }

  if (loadingData) {
    return <div className="text-center py-16 text-gray-400">Loading…</div>;
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
        <h1 className="text-2xl font-bold text-orbit-dark mt-2">Edit Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          All fields are optional — only filled fields will be updated.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Team details */}
        <Card padding="md">
          <h2 className="text-base font-bold text-orbit-dark mb-5">Team details</h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Operations Team"
            />
            <Select
              label="Office function"
              value={func}
              onChange={(e) => setFunc(e.target.value)}
              placeholder="Select function (optional)"
              options={functionOptions}
            />
            <Input
              label="Team size"
              type="number"
              min="1"
              max="500"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Number of people in the team"
            />
          </div>
        </Card>

        {/* Manager section */}
        <Card padding="md">
          <h2 className="text-base font-bold text-orbit-dark mb-5">Team Manager</h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Manager's full name"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="e.g. Jane Smith"
              hint="Updating this changes the manager's display name."
            />
            <Input
              label="Manager's email address"
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              placeholder="jane@organisation.com"
              hint="Updating this changes the login email used by the manager."
            />
            <Input
              label="New password"
              type="password"
              value={managerPassword}
              onChange={(e) => setManagerPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              minLength={MIN_MANAGER_PASSWORD_LENGTH}
              autoComplete="new-password"
              hint={`Optional. Minimum ${MIN_MANAGER_PASSWORD_LENGTH} characters if changing.`}
            />
          </div>

          {manager && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3">
                Re-send the dashboard access invite to the manager's email address.
              </p>
              {inviteStatus === 'sent' && (
                <div className="rounded bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700 mb-3">
                  ✓ Invite sent to {managerEmail || manager.email}
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={inviting}
                onClick={handleInviteManager}
              >
                {inviting ? 'Sending…' : 'Invite Manager'}
              </Button>
            </div>
          )}
        </Card>

        {error && (
          <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
          <Link href={`/admin/organisations/${orgId}`}>
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
