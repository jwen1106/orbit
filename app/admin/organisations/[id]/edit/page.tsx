'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { INDUSTRIES } from '@/types';

const industryOptions = INDUSTRIES.map((i) => ({ value: i, label: i }));

export default function EditOrganisationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/organisations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setName(data.name ?? '');
        setIndustry(data.industry ?? '');
        setLoadingData(false);
      })
      .catch(() => {
        setError('Failed to load organisation data.');
        setLoadingData(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !industry) {
      setError('Name and industry are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), industry }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to save');
      }
      router.push(`/admin/organisations/${id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving organisation');
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="text-center py-16 text-gray-400">Loading…</div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href={`/admin/organisations/${id}`} className="text-sm text-orbit-green hover:underline">
          ← Back to organisation
        </Link>
        <h1 className="text-2xl font-bold text-orbit-dark mt-2">Edit Organisation</h1>
        <p className="text-sm text-gray-500 mt-1">Update the organisation's name or industry.</p>
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
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
            <Link href={`/admin/organisations/${id}`}>
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
