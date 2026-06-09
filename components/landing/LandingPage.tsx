'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { clearPlatformSession } from '@/lib/auth-client';
import OrbitLogo from '@/components/layout/OrbitLogo';

function safeRedirectPath(from: string | null, role: string): string {
  if (from && from.startsWith('/') && !from.startsWith('//')) {
    if (role === 'oaklin_admin' && from.startsWith('/admin')) return from;
    if (role === 'team_manager' && from.startsWith('/dashboard')) return from;
  }
  if (role === 'oaklin_admin') return '/admin';
  if (role === 'team_manager') return '/dashboard';
  return '/';
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingContent />
    </Suspense>
  );
}

function LandingContent() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-orbit-dark tracking-tight leading-tight">
            Operational maturity, measured
          </h1>
          <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto">
            Complete your team assessment or sign in to review results and recommendations.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SurveyCard />
            <ManagerCard />
          </div>
        </div>
      </main>

      <AdminAccess />

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Orbit by Oaklin
      </footer>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="bg-orbit-dark px-6 sm:px-10 py-5">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <OrbitLogo size="sm" onDark />
        <a
          href="mailto:info@oaklin.com"
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          Contact
        </a>
      </div>
    </header>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-orbit-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orbit-forest/20 focus:border-orbit-forest/30 transition-colors';

/* ── Survey card (left — team member) ─────────────────────────────── */
function SurveyCard() {
  const router = useRouter();
  const params = useSearchParams();
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
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-orbit-forest/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div className="text-left">
          <h2 className="text-lg font-bold text-orbit-dark">Complete survey</h2>
          <p className="text-sm text-gray-500">For team members</p>
        </div>
      </div>

      <form onSubmit={handleBegin} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. alex.johnson@example.com"
            className={inputClass}
          />
        </div>

        {!urlCode && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Survey code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste the code from your invitation"
              className={`${inputClass} font-mono`}
              required
            />
            <p className="text-xs text-gray-400 mt-1.5">Provided by your Oaklin consultant.</p>
          </div>
        )}

        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex gap-3">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your responses are anonymised. Personal details are stored separately and only
            aggregate data is shared with leadership.
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orbit-forest focus:ring-orbit-forest/30 cursor-pointer"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            I understand my responses will be anonymised and agree to participate.
          </span>
        </label>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full bg-orbit-dark text-white font-semibold rounded-xl py-3 text-sm hover:bg-orbit-forest transition-colors mt-1"
        >
          Begin survey
        </button>
      </form>
    </div>
  );
}

/* ── Manager card (right — team manager dashboard login) ──────────── */
function ManagerCard() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await clearPlatformSession();
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
      router.push(safeRedirectPath(from, role));
      router.refresh();
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
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-orbit-forest/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-orbit-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="text-left">
          <h2 className="text-lg font-bold text-orbit-dark">View results</h2>
          <p className="text-sm text-gray-500">For team managers</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@organisation.com"
            className={inputClass}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orbit-dark text-white font-semibold rounded-xl py-3 text-sm hover:bg-orbit-forest transition-colors mt-1 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          Access dashboard
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-6">
        Access is by invitation only.{' '}
        <a href="mailto:info@oaklin.com" className="text-orbit-forest hover:underline">
          Contact Oaklin
        </a>
      </p>
    </div>
  );
}

/* ── Hidden Oaklin admin sign-in ──────────────────────────────────── */
function AdminAccess() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from');
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
      await clearPlatformSession();
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
      router.push(safeRedirectPath(from, role));
      router.refresh();
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
    <div className="flex flex-col items-center pb-6">
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
        <div className="mt-4 w-full max-w-sm rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <p className="text-sm font-semibold text-orbit-dark mb-1">Oaklin admin</p>
          <p className="text-xs text-gray-400 mb-4">Platform administrator access only.</p>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@oaklin.com"
              className={inputClass}
              required
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              required
              autoComplete="current-password"
            />
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orbit-dark text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-orbit-forest transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              Sign in
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
