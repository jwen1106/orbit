import { adminDb } from '@/lib/firebase-admin';
import Card from '@/components/ui/Card';
import Link from 'next/link';

async function getStats() {
  const [orgsSnap, teamsSnap, engagementsSnap] = await Promise.all([
    adminDb.collection('organisations').count().get(),
    adminDb.collection('teams').count().get(),
    adminDb.collection('engagements').get(),
  ]);

  const engagements = engagementsSnap.docs.map((d) => d.data());
  return {
    organisations: orgsSnap.data().count,
    teams: teamsSnap.data().count,
    active: engagements.filter((e) => e.status === 'active').length,
    analysed: engagements.filter((e) => e.status === 'analysed').length,
    total: engagements.length,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const quickLinks = [
    { href: '/admin/organisations/new', label: 'New Organisation', icon: '🏢' },
    { href: '/admin/engagements/new', label: 'New Engagement', icon: '📋' },
    { href: '/admin/portfolio', label: 'Portfolio View', icon: '📊' },
    { href: '/admin/questions', label: 'Question Bank', icon: '❓' },
    { href: '/admin/benchmarks', label: 'Benchmarks', icon: '📈' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Orbit platform management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Organisations', value: stats.organisations, color: 'text-orbit-forest' },
          { label: 'Teams', value: stats.teams, color: 'text-orbit-forest' },
          { label: 'Active surveys', value: stats.active, color: 'text-orbit-amber' },
          { label: 'Analysed', value: stats.analysed, color: 'text-orbit-green' },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-base font-bold text-orbit-dark mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="orbit-card p-4 flex flex-col items-center gap-2 hover:border-orbit-green hover:shadow transition-all text-center group"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-sm font-semibold text-orbit-dark group-hover:text-orbit-forest">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
