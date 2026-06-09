'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingContent />
    </Suspense>
  );
}

function LandingContent() {
  return (
    <div className="min-h-screen bg-orbit-offwhite flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-orbit-forest flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-orbit-dark">Maturity Diagnostic</p>
            <p className="text-2xs text-gray-400">Honest operational insights</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center px-6 pt-12 pb-8">
        <h1 className="text-3xl font-bold text-orbit-dark">
          Operational Maturity Assessment
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Choose your path to engage with the diagnostic tool
        </p>
      </div>

      {/* Two-column cards */}
      <div className="flex-1 flex items-start justify-center px-6 pb-6">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <SurveyCard />
          <ManagerCard />
        </div>
      </div>

      {/* Hidden Oaklin admin access */}
      <AdminAccess />

      <footer className="text-center pb-6 text-xs text-gray-400">
        Orbit by Oaklin · Confidential diagnostic platform
      </footer>
    </div>
  );
}

/* ── Survey card (left — team member) ─────────────────────────────── */
function SurveyCard() {
  const router = useRouter();
  const params = useSearchParams();
  // Token may arrive embedded in the invitation link (?code= or ?token=)
  const urlCode = params.get('code') ?? params.get('token') ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(urlCode);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  function handleBegin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!code.trim()) { setError('Please enter your survey code.'); return; }
    if (!agreed) { setError('Please confirm you agree to participate.'); return; }

    const qp = new URLSearchParams({ token: code.trim() });
    if (name.trim()) qp.set('preName', name.trim());
    if (email.trim()) qp.set('preEmail', email.trim());
    router.push(`/survey/member?${qp.toString()}`);
  }

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="bg-gradient-to-r from-orbit-forest to-orbit-green px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white">Complete Survey</h2>
      </div>

      <div className="bg-white flex-1 px-6 py-6">
        <p className="text-sm text-gray-500 mb-5">
          Share your honest assessment of your team&apos;s operational maturity.
          Your responses will be anonymised and aggregated with other assessments.
        </p>

        <form onSubmit={handleBegin} className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-orbit-dark -mb-1">Your Details</p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orbit-green"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.johnson@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orbit-green"
            />
          </div>

          {/* Survey code — only shown when not embedded in the invitation link */}
          {!urlCode && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Survey Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste the code from your invitation"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orbit-green font-mono"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Your Oaklin consultant provided this code.</p>
            </div>
          )}

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

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full bg-orbit-forest text-white font-semibold rounded-md py-2.5 text-sm hover:bg-orbit-green transition-colors mt-1"
          >
            Begin Survey →
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Manager card (right — team manager dashboard login) ──────────── */
function ManagerCard() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Login failed');
      }
      const { role } = await res.json();
      if (role === 'oaklin_admin') router.push('/admin');
      else if (role === 'team_manager') router.push('/dashboard');
      else router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Incorrect email or password.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="bg-gradient-to-r from-orbit-green to-orbit-forest px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white">View Results</h2>
      </div>

      <div className="bg-white flex-1 px-6 py-6">
        <p className="text-sm text-gray-500 mb-5">
          Access the diagnostic analysis dashboard. Team managers and leaders can review
          aggregated assessment results and improvement recommendations.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-orbit-dark -mb-1">Manager Access</p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organisation.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orbit-green"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orbit-green"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orbit-green text-white font-semibold rounded-md py-2.5 text-sm hover:bg-orbit-forest transition-colors mt-1 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            Access Dashboard →
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Access is by invitation only.{' '}
          <a href="mailto:info@oaklin.com" className="text-orbit-green hover:underline">
            Contact Oaklin
          </a>
        </p>
      </div>
    </div>
  );
}

/* ── Hidden Oaklin admin sign-in ──────────────────────────────────── */
function AdminAccess() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Login failed');
      }
      const { role } = await res.json();
      if (role === 'oaklin_admin') router.push('/admin');
      else if (role === 'team_manager') router.push('/dashboard');
      else router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Incorrect email or password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center pb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-gray-400 hover:text-orbit-forest transition-colors inline-flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Oaklin staff sign-in
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 w-full max-w-xs rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <p className="text-sm font-semibold text-orbit-dark mb-1">Oaklin Admin</p>
          <p className="text-xs text-gray-400 mb-4">Platform administrator access only.</p>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@oaklin.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orbit-green"
              required
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-orbit-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orbit-green"
              required
              autoComplete="current-password"
            />
            {error && (
              <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orbit-dark text-white font-semibold rounded-md py-2 text-sm hover:bg-orbit-forest transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              Sign in as Admin
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
