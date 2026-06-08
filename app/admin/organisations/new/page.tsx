'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { INDUSTRIES } from '@/types';

const industryOptions = INDUSTRIES.map((i) => ({ value: i, label: i }));

export default function NewOrganisationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to create organisation');
      }
      const { id } = await res.json();
      router.push(`/admin/organisations/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/organisations" className="text-sm text-orbit-green hover:underline">
          ← Organisations
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-2">New Organisation</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Organisation name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Financial Services"
            required
          />
          <Select
            label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Select an industry"
            options={industryOptions}
            required
          />
          {error && (
            <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Create organisation
            </Button>
            <Link href="/admin/organisations">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
