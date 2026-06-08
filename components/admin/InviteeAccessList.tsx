'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Respondent } from '@/types';

interface InviteeAccessListProps {
  engagementId: string;
  invitees: Respondent[];
  onUpdated: () => void;
  readOnly?: boolean;
}

export default function InviteeAccessList({
  engagementId,
  invitees,
  onUpdated,
  readOnly = false,
}: InviteeAccessListProps) {
  const [open, setOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [action, setAction] = useState<'save' | 'resend' | 'delete' | null>(null);
  const [error, setError] = useState('');

  function startEdit(invitee: Respondent) {
    setEditingId(invitee.id);
    setEditEmail(invitee.email ?? '');
    setEditName(invitee.name ?? '');
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditEmail('');
    setEditName('');
  }

  async function saveEdit(respondentId: string) {
    if (!editEmail.trim()) {
      setError('Email is required.');
      return;
    }
    setLoadingId(respondentId);
    setAction('save');
    setError('');
    try {
      const res = await fetch(
        `/api/admin/engagements/${engagementId}/respondents/${respondentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: editEmail.trim(), name: editName.trim() }),
        },
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to update');
      }
      cancelEdit();
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving');
    } finally {
      setLoadingId(null);
      setAction(null);
    }
  }

  async function resendInvite(respondentId: string) {
    setLoadingId(respondentId);
    setAction('resend');
    setError('');
    try {
      const res = await fetch(
        `/api/admin/engagements/${engagementId}/respondents/${respondentId}/resend`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to resend');
      }
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error resending');
    } finally {
      setLoadingId(null);
      setAction(null);
    }
  }

  async function removeInvite(respondentId: string, name: string) {
    if (!confirm(`Remove ${name || 'this person'} from the survey access list?`)) return;
    setLoadingId(respondentId);
    setAction('delete');
    setError('');
    try {
      const res = await fetch(
        `/api/admin/engagements/${engagementId}/respondents/${respondentId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to remove');
      }
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error removing');
    } finally {
      setLoadingId(null);
      setAction(null);
    }
  }

  return (
    <div className="mt-5 pt-4 border-t border-gray-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left group"
      >
        <div>
          <h3 className="text-sm font-bold text-orbit-dark">
            Survey access list
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {invitees.length} individual{invitees.length !== 1 ? 's' : ''} invited by email
          </p>
        </div>
        <span className="text-gray-400 text-sm group-hover:text-orbit-green transition-colors">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="mt-4">
          {error && (
            <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-3">
              {error}
            </div>
          )}

          {invitees.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
              {readOnly
                ? 'No individual invitations were sent for this engagement.'
                : 'No individual invitations sent yet. Use the form above to invite team members.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {invitees.map((invitee) => {
                const isEditing = editingId === invitee.id;
                const isLoading = loadingId === invitee.id;

                return (
                  <li
                    key={invitee.id}
                    className="border-b border-gray-100 last:border-0 py-3 first:pt-0"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <Input
                            label="Email"
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            loading={isLoading && action === 'save'}
                            onClick={() => saveEdit(invitee.id)}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" type="button" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-orbit-dark truncate">
                            {invitee.name || 'Unnamed'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{invitee.email}</p>
                        </div>
                        {!readOnly && (
                          <div className="flex flex-wrap items-center gap-3 sm:flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => startEdit(invitee)}
                              disabled={isLoading}
                              className="text-xs font-semibold text-orbit-green hover:underline disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => resendInvite(invitee.id)}
                              disabled={isLoading}
                              className="text-xs font-semibold text-orbit-forest hover:underline disabled:opacity-50"
                            >
                              {isLoading && action === 'resend' ? 'Sending…' : 'Resend'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeInvite(invitee.id, invitee.name)}
                              disabled={isLoading || invitee.status === 'completed'}
                              title={
                                invitee.status === 'completed'
                                  ? 'Cannot remove completed responses'
                                  : 'Remove from access list'
                              }
                              className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-40 disabled:no-underline"
                            >
                              {isLoading && action === 'delete' ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
