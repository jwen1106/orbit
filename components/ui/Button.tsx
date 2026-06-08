import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-orbit-forest text-white hover:bg-orbit-green disabled:opacity-50 border border-transparent',
  secondary:
    'bg-white text-orbit-forest border border-orbit-forest hover:bg-green-50 disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 border border-transparent',
  ghost:
    'bg-transparent text-orbit-forest hover:bg-green-50 border border-transparent disabled:opacity-50',
  amber:
    'bg-orbit-amber text-white hover:bg-amber-500 disabled:opacity-50 border border-transparent',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orbit-green focus:ring-offset-1',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
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
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
