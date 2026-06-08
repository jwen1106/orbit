import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        paddingClasses[padding],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['mb-4', className].join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={['text-lg font-bold text-orbit-dark', className].join(' ')}
      {...props}
    >
      {children}
    </h3>
  );
}
