'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OrbitLogo from '@/components/layout/OrbitLogo';
import Button from '@/components/ui/Button';
import type { Question } from '@/types';
import { COMPETENCY_LABELS } from '@/types';

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
  // Skip name capture if name was pre-filled from landing page, or if manager/individual invite
  const [nameSubmitted, setNameSubmitted] = useState(
    !!(preName) || role === 'manager' || accessMethod === 'email_invite',
  );
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

    // Save answer to server
    try {
      await fetch('/api/survey/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId,
          respondentId,
          token,
          accessMethod,
          role,
          name: nameSubmitted ? undefined : name,
          questionId: current.id,
          score: answers[current.id],
          isFirst: currentIndex === 0,
        }),
      });
    } catch {
      // Don't block on save errors — continue
    }

    if (isLast) {
      setSubmitting(true);
      try {
        const res = await fetch('/api/survey/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ engagementId, respondentId, token, role }),
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

  // Name capture screen for shared-link members
  if (!nameSubmitted) {
    return (
      <div className="min-h-screen bg-orbit-offwhite flex flex-col">
        <SurveyHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <h1 className="text-xl font-bold text-orbit-dark mb-2">Welcome to Orbit</h1>
              <p className="text-sm text-gray-500 mb-6">
                Before you begin, please enter your name. Your responses will remain anonymous in the aggregated results.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orbit-green"
              />
              <Button
                className="w-full"
                onClick={() => { if (name.trim()) setNameSubmitted(true); }}
                disabled={!name.trim()}
              >
                Begin survey →
              </Button>
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
