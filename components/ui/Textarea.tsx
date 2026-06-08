import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-orbit-dark">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={[
            'w-full rounded-md border px-3 py-2 text-sm text-orbit-dark placeholder-gray-400 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-orbit-green focus:border-orbit-green',
            'disabled:bg-gray-50 disabled:opacity-60',
            error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300',
            className,
          ].join(' ')}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
export default Textarea;
