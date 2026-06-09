'use client';

import { useState } from 'react';
import { fieldLabelCompactClass, fieldSelectClass } from '@/lib/field-styles';

interface OrgOption { id: string; name: string }
interface TeamOption { id: string; name: string; orgId: string }

interface AdminCsvExportProps {
  orgs: OrgOption[];
  teams: TeamOption[];
}

export default function AdminCsvExport({ orgs, teams }: AdminCsvExportProps) {
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const filteredTeams = selectedOrg
    ? teams.filter((t) => t.orgId === selectedOrg)
    : teams;

  function handleOrgChange(id: string) {
    setSelectedOrg(id);
    setSelectedTeam('');
  }

  function buildExportUrl() {
    const params = new URLSearchParams();
    if (selectedOrg) params.set('orgId', selectedOrg);
    if (selectedTeam) params.set('teamId', selectedTeam);
    const qs = params.toString();
    return `/api/admin/export${qs ? `?${qs}` : ''}`;
  }

  const exportLabel = selectedTeam
    ? `Export team CSV`
    : selectedOrg
    ? `Export organisation CSV`
    : `Export all (CSV)`;

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-6 py-5">
      <h2 className="text-sm font-bold text-orbit-dark mb-4">Export to CSV</h2>
      <div className="flex flex-wrap items-end gap-3">
        {/* Organisation filter */}
        <div>
          <label htmlFor="export-org" className={fieldLabelCompactClass}>
            Filter by organisation
          </label>
          <select
            id="export-org"
            value={selectedOrg}
            onChange={(e) => handleOrgChange(e.target.value)}
            className={`${fieldSelectClass} min-w-[200px]`}
          >
            <option value="">All organisations</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {/* Team filter */}
        <div>
          <label htmlFor="export-team" className={fieldLabelCompactClass}>
            Filter by team
          </label>
          <select
            id="export-team"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            disabled={filteredTeams.length === 0}
            className={`${fieldSelectClass} min-w-[180px]`}
          >
            <option value="">All teams</option>
            {filteredTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Export button */}
        <a
          href={buildExportUrl()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-orbit-forest text-white hover:bg-orbit-green transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exportLabel}
        </a>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Exports engagement summary including competency scores. Use the per-row CSV links in the table below for full respondent-level data.
      </p>
    </div>
  );
}
