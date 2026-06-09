'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteOrganisationRowButton({
  orgId,
  orgName,
  teamId,
  teamName,
}: {
  orgId: string;
  orgName: string;
  teamId?: string;
  teamName?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const isTeamDelete = Boolean(teamId);
  const label = teamName && teamName !== '—' ? teamName : orgName;
  const confirmMessage = isTeamDelete
    ? `Delete the team "${label}" and all related engagements, survey responses, and action items? This cannot be undone.`
    : `Delete "${orgName}"? This organisation has no teams and will be removed entirely. This cannot be undone.`;

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      const url = isTeamDelete
        ? `/api/admin/teams/${teamId}`
        : `/api/admin/organisations/${orgId}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to delete');
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center justify-center gap-1.5 border border-red-200 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors w-full max-w-[130px] disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
      </svg>
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  );
}
