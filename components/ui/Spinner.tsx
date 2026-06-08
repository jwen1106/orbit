interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <svg
      className={['animate-spin text-orbit-forest', sizeClasses[size], className].join(' ')}
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-orbit-offwhite">
      <Spinner size="lg" />
    </div>
  );
}
