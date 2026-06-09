'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import CompletionDonut from '@/components/admin/CompletionDonut';
import InviteeAccessList from '@/components/admin/InviteeAccessList';
import type { Engagement, Respondent, Question, Competency } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

interface EngagementDetail extends Engagement {
  teamName: string;
  orgName: string;
  respondents: Respondent[];
}

const competencyBadgeColour: Record<Competency, string> = {
  people_relationships: 'bg-blue-50 text-blue-700',
  growth_impact: 'bg-emerald-50 text-emerald-700',
  purpose_alignment: 'bg-purple-50 text-purple-700',
};

export default function EngagementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EngagementDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState<'member' | 'manager' | null>(null);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/engagements/${id}`);
    if (res.ok) {
      const eng: EngagementDetail = await res.json();
      setData(eng);

      // Fetch questions and filter for this engagement's organisation
      const qRes = await fetch('/api/admin/questions');
      if (qRes.ok) {
        const allQuestions: Question[] = await qRes.json();
        const relevant = allQuestions.filter((q) => {
          if (!q.isActive) return false;
          const assigned = q.assignedOrganisationIds ?? [];
          return assigned.length === 0 || assigned.includes(eng.organisationId);
        });
        setQuestions(relevant);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(action: 'activate' | 'close' | 'analyse') {
    setActionLoading(action);
    setError('');
    try {
      const res = await fetch(`/api/admin/engagements/${id}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed');
      }
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading('');
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/engagements/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName, email: inviteEmail }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed');
      }
      setInviteEmail('');
      setInviteName('');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setInviteLoading(false);
    }
  }

  async function saveTitle() {
    setSavingTitle(true);
    try {
      await fetch(`/api/admin/engagements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleDraft.trim() || null }),
      });
      setData((prev) => prev ? { ...prev, title: titleDraft.trim() || undefined } : prev);
    } finally {
      setSavingTitle(false);
      setEditingTitle(false);
    }
  }

  function copyLink(type: 'member' | 'manager') {
    if (!data) return;
    const url = type === 'member'
      ? `${baseUrl}/survey/member?token=${data.memberShareToken}`
      : `${baseUrl}/survey/manager?token=${data.managerSurveyToken}`;
    navigator.clipboard.writeText(url);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-gray-500 py-20 text-center">Engagement not found.</div>;

  const memberSurveyUrl = `${baseUrl}/survey/member?token=${data.memberShareToken}`;
  const managerSurveyUrl = `${baseUrl}/survey/manager?token=${data.managerSurveyToken}`;

  const memberRespondents = data.respondents.filter((r) => r.role === 'member');
  const managerRespondents = data.respondents.filter((r) => r.role === 'manager');
  const memberCompleted = memberRespondents.filter((r) => r.status === 'completed').length;
  const memberInProgress = memberRespondents.filter((r) => r.status === 'in_progress').length;
  const memberNotStarted = memberRespondents.filter((r) => r.status === 'invited').length;
  const memberTotal = memberRespondents.length;
  const percentComplete = memberTotal > 0
    ? Math.round((memberCompleted / memberTotal) * 100)
    : 0;
  const managerComplete = managerRespondents.some((r) => r.status === 'completed');
  const emailInvitees = data.respondents.filter(
    (r) => r.role === 'member' && r.accessMethod === 'email_invite',
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/engagements" className="text-sm text-orbit-green hover:underline">
            ← Engagements
          </Link>
          <h1 className="text-2xl font-bold text-orbit-dark mt-1">
            {data.orgName} — {data.teamName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={data.status} />
            <span className="text-sm text-gray-500">
              {memberCompleted} of {memberTotal} anonymous member response{memberTotal !== 1 ? 's' : ''} complete
              {managerRespondents.length > 0 && (
                <> · Manager {managerComplete ? 'complete' : 'pending'}</>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {data.status === 'draft' && (
            <Button onClick={() => updateStatus('activate')} loading={actionLoading === 'activate'}>
              Activate survey
            </Button>
          )}
          {data.status === 'active' && (
            <Button variant="secondary" onClick={() => updateStatus('close')} loading={actionLoading === 'close'}>
              Close survey
            </Button>
          )}
          {data.status === 'closed' && (
            <>
              <Link href={`/admin/engagements/${id}/dashboard`}>
                <Button variant="secondary">View dashboard</Button>
              </Link>
              <Button variant="amber" onClick={() => updateStatus('analyse')} loading={actionLoading === 'analyse'}>
                {actionLoading === 'analyse' ? 'Analysing…' : 'Run AI analysis'}
              </Button>
            </>
          )}
          {data.status === 'analysed' && (
            <>
              <Link href={`/admin/engagements/${id}/dashboard`}>
                <Button>View dashboard</Button>
              </Link>
              <Link href={`/admin/engagements/${id}/actions`}>
                <Button variant="secondary">View action plan</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Survey links (3/4) + Respondents (1/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">

        {/* Survey links — 3/4 width */}
        <Card className="lg:col-span-3">
          {/* Survey title — mandatory, saved on blur/Enter */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Survey Title <span className="text-red-400">*</span>
            </label>
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  placeholder="e.g. Q1 2026 Operational Assessment"
                  className="flex-1 text-sm border border-orbit-forest rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orbit-forest text-orbit-dark"
                />
                <button onClick={saveTitle} disabled={savingTitle} className="text-xs font-semibold text-orbit-forest hover:underline whitespace-nowrap">
                  {savingTitle ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setTitleDraft(data.title ?? ''); setEditingTitle(true); }}
                className="w-full text-left rounded-lg border border-gray-200 hover:border-orbit-forest px-3 py-2 transition-colors group flex items-center justify-between"
              >
                {data.title
                  ? <span className="text-sm font-semibold text-orbit-dark">{data.title}</span>
                  : <span className="text-sm italic text-red-400">Required — click to add a survey title</span>}
                <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-orbit-forest flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>

          <h2 className="text-base font-bold text-orbit-dark mb-4">Survey links</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Member share link</p>
              <p className="text-xs text-gray-400 mb-2">
                Anonymous survey — team member names are not shown in reports.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 text-orbit-dark truncate">
                  {memberSurveyUrl}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copyLink('member')}>
                  {copied === 'member' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Manager survey link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 text-orbit-dark truncate">
                  {managerSurveyUrl}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copyLink('manager')}>
                  {copied === 'manager' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>

          {data.status === 'active' && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-orbit-dark mb-3">Send individual invitation</h3>
              <form onSubmit={sendInvite} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Team member's name"
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@org.com"
                    required
                  />
                </div>
                <Button type="submit" loading={inviteLoading} size="sm">
                  Send invite
                </Button>
              </form>
            </div>
          )}

          {data.status !== 'draft' && (
            <InviteeAccessList
              engagementId={id}
              invitees={emailInvitees}
              onUpdated={load}
              readOnly={data.status !== 'active'}
            />
          )}
        </Card>

        {/* Respondents — 1/4 width, anonymous aggregate only */}
        <Card className="lg:col-span-1 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-orbit-dark">Respondents</h2>
            <p className="text-xs text-gray-400 mt-1">Anonymous member responses</p>
          </div>
          <div className="flex-1 px-4 py-6 flex flex-col items-center justify-center gap-5">
            <CompletionDonut percent={percentComplete} label="Complete" />
            <div className="w-full space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-orbit-forest flex-shrink-0" />
                  Complete
                </span>
                <span className="font-semibold text-orbit-dark">{memberCompleted}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-orbit-amber flex-shrink-0" />
                  In progress
                </span>
                <span className="font-semibold text-orbit-dark">{memberInProgress}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                  Not started
                </span>
                <span className="font-semibold text-orbit-dark">{memberNotStarted}</span>
              </div>
            </div>
            {memberTotal === 0 ? (
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                No responses yet. Share the member link to begin collecting anonymous submissions.
              </p>
            ) : (
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                {memberTotal} anonymous submission{memberTotal !== 1 ? 's' : ''} recorded
              </p>
            )}
            {managerRespondents.length > 0 && (
              <div className="w-full pt-3 border-t border-gray-100 text-xs text-gray-500">
                Manager survey:{' '}
                <span className={managerComplete ? 'text-orbit-forest font-semibold' : 'text-amber-700 font-semibold'}>
                  {managerComplete ? 'Complete' : 'Pending'}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Questions for this engagement */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-orbit-dark">
            Survey questions
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({questions.length} question{questions.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <Link href="/admin/questions" className="text-xs text-orbit-green hover:underline font-semibold">
            Manage questions →
          </Link>
        </div>
        {questions.length === 0 ? (
          <div className="px-6 py-8 text-sm text-gray-400 text-center">
            No active questions found for this engagement.{' '}
            <Link href="/admin/questions" className="text-orbit-green hover:underline">
              Add questions →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 w-8">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Question</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Competency</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Audience</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-6 py-3 max-w-md">
                    <p className="font-semibold text-orbit-dark text-xs">{q.text}</p>
                    {q.subtext && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{q.subtext}</p>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${competencyBadgeColour[q.competency]}`}>
                      {COMPETENCY_LABELS[q.competency]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500 capitalize">{q.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
