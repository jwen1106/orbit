import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import Card from '@/components/ui/Card';
import type { Engagement, Team } from '@/types';

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  active: 1,
  closed: 2,
  analysed: 3,
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Engagement created',
  active: 'Survey launched',
  closed: 'Survey closed',
  analysed: 'Analysis complete',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-600',
  active: 'bg-orbit-amber text-white',
  closed: 'bg-blue-100 text-blue-700',
  analysed: 'bg-orbit-forest text-white',
};

const STATUS_ICON: Record<string, string> = {
  draft: '📋',
  active: '📨',
  closed: '🔒',
  analysed: '✅',
};

interface TimelineEvent {
  label: string;
  date: Date | null;
  status: string;
  reached: boolean;
}

function buildTimeline(engagement: Engagement): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      label: 'Engagement created',
      date: engagement.createdAt?.toDate?.() ?? null,
      status: 'draft',
      reached: true,
    },
    {
      label: 'Survey launched',
      date: engagement.activatedAt?.toDate?.() ?? null,
      status: 'active',
      reached: STATUS_ORDER[engagement.status] >= STATUS_ORDER.active,
    },
    {
      label: 'Survey closed',
      date: engagement.closedAt?.toDate?.() ?? null,
      status: 'closed',
      reached: STATUS_ORDER[engagement.status] >= STATUS_ORDER.closed,
    },
    {
      label: 'AI analysis complete',
      date: engagement.analysedAt?.toDate?.() ?? null,
      status: 'analysed',
      reached: engagement.status === 'analysed',
    },
  ];
  return events;
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function durationBetween(from: Date | null, to: Date | null): string | null {
  if (!from || !to) return null;
  const diffMs = to.getTime() - from.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'same day';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`;
  return `${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`;
}

async function getTimelineData(uid: string) {
  const teamsSnap = await adminDb.collection('teams').where('managerId', '==', uid).limit(1).get();
  if (teamsSnap.empty) return null;
  const team = { id: teamsSnap.docs[0].id, ...teamsSnap.docs[0].data() } as Team;

  const engagementsSnap = await adminDb
    .collection('engagements')
    .where('teamId', '==', team.id)
    .orderBy('createdAt', 'desc')
    .get();

  const engagements = engagementsSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() } as Engagement),
  );

  const respondentCounts: Record<string, { total: number; completed: number }> = {};
  await Promise.all(
    engagements.map(async (eng) => {
      const snap = await adminDb
        .collection('engagements')
        .doc(eng.id)
        .collection('respondents')
        .get();
      respondentCounts[eng.id] = {
        total: snap.size,
        completed: snap.docs.filter((d) => d.data().status === 'completed').length,
      };
    }),
  );

  return { team, engagements, respondentCounts };
}

export default async function TimelinePage() {
  const session = await verifySession();
  if (!session) redirect('/');

  const data = await getTimelineData(session.uid);

  if (!data || data.engagements.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-orbit-dark">Timeline</h1>
        <Card>
          <div className="text-center py-12 text-gray-500">
            No engagements found. Your timeline will appear here once an engagement has been created.
          </div>
        </Card>
      </div>
    );
  }

  const { team, engagements, respondentCounts } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-orbit-dark">Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          {team.name} · {engagements.length} engagement{engagements.length !== 1 ? 's' : ''} to date
        </p>
      </div>

      {/* Engagement history */}
      <div className="space-y-6">
        {engagements.map((eng, engIdx) => {
          const timeline = buildTimeline(eng);
          const counts = respondentCounts[eng.id] ?? { total: 0, completed: 0 };
          const currentStepIndex = timeline.filter((e) => e.reached).length - 1;

          const launchDate = eng.activatedAt?.toDate?.() ?? null;
          const closeDate = eng.closedAt?.toDate?.() ?? null;
          const duration = durationBetween(launchDate, closeDate);

          return (
            <div key={eng.id} className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              {/* Engagement header */}
              <div className="bg-orbit-forest px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">
                    Engagement {engagements.length - engIdx}
                    {engIdx === 0 && (
                      <span className="ml-2 text-xs font-normal bg-orbit-amber text-white px-2 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </p>
                  <p className="text-green-300 text-xs mt-0.5">
                    Created {formatDate(eng.createdAt?.toDate?.() ?? null)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[eng.status] ?? 'bg-gray-200 text-gray-600'}`}
                  >
                    {eng.status.charAt(0).toUpperCase() + eng.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Timeline steps */}
                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute left-[18px] top-5 bottom-5 w-0.5 bg-gray-200" />

                  <ol className="space-y-5">
                    {timeline.map((event, stepIdx) => {
                      const isCurrent = stepIdx === currentStepIndex;
                      const isPast = stepIdx < currentStepIndex;
                      const isFuture = stepIdx > currentStepIndex;

                      return (
                        <li key={event.status} className="relative flex items-start gap-4">
                          {/* Step dot */}
                          <div
                            className={[
                              'relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm border-2',
                              isFuture
                                ? 'bg-white border-gray-200 text-gray-300'
                                : isCurrent
                                ? 'bg-orbit-amber border-orbit-amber text-white shadow-md'
                                : 'bg-orbit-forest border-orbit-forest text-white',
                            ].join(' ')}
                          >
                            {event.status === 'analysed' && isPast ? '✓' : STATUS_ICON[event.status]}
                          </div>

                          {/* Step content */}
                          <div className="flex-1 min-w-0 pt-1.5">
                            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                              <p
                                className={[
                                  'text-sm font-semibold',
                                  isFuture ? 'text-gray-400' : 'text-orbit-dark',
                                ].join(' ')}
                              >
                                {event.label}
                                {isCurrent && (
                                  <span className="ml-2 text-xs font-normal text-orbit-amber">
                                    (current)
                                  </span>
                                )}
                              </p>
                              <p
                                className={[
                                  'text-xs flex-shrink-0',
                                  isFuture ? 'text-gray-300' : 'text-gray-500',
                                ].join(' ')}
                              >
                                {event.reached ? formatDate(event.date) : 'Pending'}
                              </p>
                            </div>

                            {/* Extra context per step */}
                            {event.status === 'active' && event.reached && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {counts.completed}/{counts.total} responses received
                              </p>
                            )}
                            {event.status === 'closed' && event.reached && duration && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Survey ran for {duration}
                              </p>
                            )}
                            {event.status === 'analysed' && event.reached && (
                              <div className="flex items-center gap-3 mt-1.5">
                                <Link
                                  href="/dashboard"
                                  className="text-xs text-orbit-green font-semibold hover:underline"
                                >
                                  View dashboard →
                                </Link>
                                <Link
                                  href="/dashboard/analysis"
                                  className="text-xs text-orbit-green font-semibold hover:underline"
                                >
                                  View analysis →
                                </Link>
                              </div>
                            )}
                            {event.status === 'active' && isCurrent && (
                              <p className="text-xs text-orbit-amber font-semibold mt-0.5">
                                Survey is live
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-400">Respondents</p>
                    <p className="text-lg font-bold text-orbit-forest">{counts.completed}</p>
                    <p className="text-xs text-gray-400">completed</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Invited</p>
                    <p className="text-lg font-bold text-orbit-dark">{counts.total}</p>
                    <p className="text-xs text-gray-400">total</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Response rate</p>
                    <p className="text-lg font-bold text-orbit-dark">
                      {counts.total > 0
                        ? `${Math.round((counts.completed / counts.total) * 100)}%`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context note */}
      <Card padding="md" className="bg-green-50 border-orbit-green/20">
        <p className="text-sm text-orbit-dark">
          <strong className="text-orbit-forest">Multiple engagements:</strong>{' '}
          As you run repeat assessments over time, each engagement will appear here — letting you track
          how your team&apos;s maturity scores evolve across the three core competencies.
        </p>
      </Card>
    </div>
  );
}
