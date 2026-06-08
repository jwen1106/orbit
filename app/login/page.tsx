'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import OrbitLogo from '@/components/layout/OrbitLogo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-orbit-offwhite flex items-center justify-center">
      <div className="w-full max-w-md animate-pulse">
        <div className="h-12 w-32 bg-gray-200 rounded mx-auto mb-8" />
        <div className="bg-white rounded-xl border border-gray-200 h-64" />
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
        const data = await res.json();
        throw new Error(data.error ?? 'Login failed');
      }

      const { role } = await res.json();

      if (from && !from.includes('login')) {
        router.push(from);
      } else if (role === 'oaklin_admin') {
        router.push('/admin');
      } else if (role === 'team_manager') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An error occurred';
      if (
        message.includes('user-not-found') ||
        message.includes('wrong-password') ||
        message.includes('invalid-credential')
      ) {
        setError('Incorrect email or password. Please try again.');
      } else if (message.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-orbit-offwhite flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <OrbitLogo size="lg" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-orbit-dark mb-1">Log in to Orbit</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your credentials to access the platform.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organisation.com"
              required
              autoComplete="email"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Log in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Access is by invitation only.{' '}
          <a
            href="mailto:info@oaklin.com"
            className="text-orbit-green hover:underline"
          >
            Contact Oaklin
          </a>{' '}
          to request access.
        </p>
      </div>
    </div>
  );
}
