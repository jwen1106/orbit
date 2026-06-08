interface BadgeProps {
  variant:
    | 'short_term'
    | 'long_term'
    | 'not_started'
    | 'in_progress'
    | 'complete'
    | 'draft'
    | 'active'
    | 'closed'
    | 'analysed'
    | 'people'
    | 'growth'
    | 'purpose';
  label?: string;
  className?: string;
}

const styles: Record<BadgeProps['variant'], string> = {
  short_term: 'bg-orbit-amber text-white',
  long_term: 'bg-orbit-forest text-white',
  not_started: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-amber-100 text-amber-800 border border-orbit-amber',
  complete: 'bg-green-100 text-orbit-forest border border-orbit-green',
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-orbit-forest',
  closed: 'bg-amber-100 text-amber-800',
  analysed: 'bg-orbit-forest text-white',
  people: 'bg-green-100 text-orbit-forest',
  growth: 'bg-amber-50 text-amber-800 border border-orbit-amber',
  purpose: 'bg-blue-50 text-blue-800',
};

const labels: Record<BadgeProps['variant'], string> = {
  short_term: 'SHORT-TERM',
  long_term: 'LONG-TERM',
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
  draft: 'Draft',
  active: 'Active',
  closed: 'Closed',
  analysed: 'Analysed',
  people: 'People & Relationships',
  growth: 'Growth & Impact',
  purpose: 'Purpose & Alignment',
};

export default function Badge({ variant, label, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
        styles[variant],
        className,
      ].join(' ')}
    >
      {label ?? labels[variant]}
    </span>
  );
}
