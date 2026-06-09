'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OrbitLogo from '@/components/layout/OrbitLogo';
import Button from '@/components/ui/Button';
import type { Question } from '@/types';
import { COMPETENCY_LABELS } from '@/types';
import {
  fieldInputClass,
  fieldLabelCompactClass,
  fieldReadOnlyClass,
} from '@/lib/field-styles';

interface SurveyFlowProps {
  engagementId: string;
  respondentId: string | null;
  token: string;
  accessMethod: 'email_invite' | 'shared_link';
  role: 'manager' | 'member';
  questions: Question[];
  preName?: string;
  preEmail?: string;
}

interface Answers {
  [questionId: string]: number;
}

export default function SurveyFlow({
  engagementId,
  respondentId,
  token,
  accessMethod,
  role,
  questions,
  preName = '',
  preEmail = '',
}: SurveyFlowProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [name, setName] = useState(preName);
  const [email, setEmail] = useState(preEmail);
  const [agreed, setAgreed] = useState(false);
  // Track the respondent id; for shared-link users the server creates it on the first
  // answer and returns it, so we must capture and reuse it for subsequent saves.
  const [currentRespondentId, setCurrentRespondentId] = useState<string | null>(respondentId);
  // Skip name capture only if name was pre-filled from landing page
  const [nameSubmitted, setNameSubmitted] = useState(!!(preName));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const current = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  const competencies = [
    ...new Set(questions.map((q) => q.competency)),
  ] as (keyof typeof COMPETENCY_LABELS)[];

  function handleScore(score: number) {
    setAnswers((prev) => ({ ...prev, [current.id]: score }));
  }

  async function handleNext() {
    if (!answers[current.id]) {
      setError('Please select a score to continue.');
      return;
    }
    setError('');
    const isFirst = currentIndex === 0;

    // Save answer to server. On the first question the server may create the
    // respondent and return its id — capture it so later saves use the same record.
    let respId = currentRespondentId;
    try {
      const res = await fetch('/api/survey/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId,
          respondentId: currentRespondentId,
          token,
          accessMethod,
          role,
          name: isFirst && name.trim() ? name.trim() : undefined,
          email: isFirst && email.trim() ? email.trim() : undefined,
          questionId: current.id,
          score: answers[current.id],
          isFirst,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.respondentId) {
        respId = data.respondentId;
        if (data.respondentId !== currentRespondentId) {
          setCurrentRespondentId(data.respondentId);
        }
      }
    } catch {
      // Don't block on save errors — continue
    }

    if (isLast) {
      setSubmitting(true);
      try {
        const res = await fetch('/api/survey/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ engagementId, respondentId: respId, token, role }),
        });
        if (res.ok) router.push('/survey/complete');
        else setError('Error saving your responses. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleBack() {
    setError('');
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  // Details capture screen — shown before the survey begins
  if (!nameSubmitted) {
    const surveyUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/survey/${role === 'manager' ? 'manager' : 'member'}?token=${token}`
      : `…/survey/${role === 'manager' ? 'manager' : 'member'}?token=${token}`;

    function handleBegin(e: React.FormEvent) {
      e.preventDefault();
      if (!name.trim()) return;
      if (!agreed) return;
      setNameSubmitted(true);
    }

    return (
      <div className="min-h-screen bg-orbit-offwhite flex flex-col">
        <SurveyHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg">
            {/* Card matching landing page Complete Survey card */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-orbit-forest to-orbit-green px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {role === 'manager' ? 'Manager Assessment' : 'Complete Survey'}
                  </h2>
                  <p className="text-xs text-white/70 mt-0.5">Operational Maturity Diagnostic</p>
                </div>
              </div>

              {/* Form body */}
              <div className="bg-white px-6 py-6">
                <p className="text-sm text-gray-500 mb-5">
                  {role === 'manager'
                    ? 'Share your perspective on your team\'s operational maturity. Your responses inform the leadership view of the diagnostic.'
                    : 'Share your honest assessment of your team\'s operational maturity. Your responses will be anonymised and aggregated with other assessments.'}
                </p>

                <form onSubmit={handleBegin} className="flex flex-col gap-4">
                  <p className="text-sm font-semibold text-orbit-dark -mb-1">Your Details</p>

                  <div>
                    <label className={fieldLabelCompactClass}>Full Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className={fieldInputClass}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className={fieldLabelCompactClass}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex.johnson@example.com"
                      className={fieldInputClass}
                    />
                  </div>

                  {/* Pre-populated survey link (read-only) */}
                  <div>
                    <label className={fieldLabelCompactClass}>Survey Link</label>
                    <input
                      type="text"
                      readOnly
                      value={surveyUrl}
                      className={fieldReadOnlyClass}
                    />
                  </div>

                  {/* Privacy notice */}
                  <div className="rounded-md bg-amber-50 border border-amber-100 px-4 py-3 flex gap-2.5">
                    <svg className="w-4 h-4 text-orbit-amber flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-semibold text-orbit-dark">Data Privacy &amp; Anonymity:</span>{' '}
                      Your personal details will be stored securely and separately from your assessment
                      responses. Your responses will be anonymised in all reports and analysis. Only
                      aggregate data will be shared with leadership.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orbit-forest focus:ring-orbit-green cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      I confirm that I understand my responses will be anonymised and agree to participate
                      in this assessment.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={!name.trim() || !agreed}
                    className="w-full bg-orbit-forest text-white font-semibold rounded-md py-2.5 text-sm hover:bg-orbit-green transition-colors mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Begin Survey →
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orbit-offwhite flex flex-col">
      <SurveyHeader />

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-1 bg-orbit-forest transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Question counter and competency */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold text-orbit-green uppercase tracking-wide">
              {COMPETENCY_LABELS[current.competency]}
            </span>
            <span className="text-xs text-gray-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-orbit-dark mb-1">{current.text}</h2>
            {current.subtext && (
              <p className="text-sm text-gray-500 mb-6">{current.subtext}</p>
            )}
            {!current.subtext && <div className="mb-6" />}

            {/* Score options */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((score) => {
                const criteria = current.criteria?.[score.toString()];
                const isSelected = answers[current.id] === score;
                return (
                  <button
                    key={score}
                    onClick={() => handleScore(score)}
                    className={[
                      'w-full text-left rounded-lg border-2 px-4 py-3 transition-all',
                      isSelected
                        ? 'border-orbit-forest bg-green-50'
                        : 'border-gray-200 hover:border-orbit-green hover:bg-green-50/40',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          'flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5',
                          isSelected
                            ? 'border-orbit-forest bg-orbit-forest text-white'
                            : 'border-gray-300 text-gray-400',
                        ].join(' ')}
                      >
                        {score}
                      </div>
                      <p className={['text-sm', isSelected ? 'text-orbit-dark font-medium' : 'text-gray-600'].join(' ')}>
                        {criteria}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-red-600 mt-3">{error}</p>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentIndex === 0}
              >
                ← Back
              </Button>
              <Button
                onClick={handleNext}
                loading={submitting}
                disabled={!answers[current.id]}
              >
                {isLast ? 'Submit survey' : 'Next →'}
              </Button>
            </div>
          </div>

          {/* Competency progress indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {competencies.map((c) => {
              const qs = questions.filter((q) => q.competency === c);
              const answered = qs.filter((q) => answers[q.id]).length;
              const total = qs.length;
              return (
                <div key={c} className="text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    {COMPETENCY_LABELS[c as keyof typeof COMPETENCY_LABELS].split(' & ')[0]}
                  </div>
                  <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-orbit-forest rounded-full transition-all"
                      style={{ width: `${(answered / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SurveyHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <OrbitLogo size="sm" />
    </header>
  );
}
