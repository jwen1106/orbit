import { forwardRef, type TextareaHTMLAttributes } from 'react';
import {
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  fieldTextareaClass,
} from '@/lib/field-styles';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={fieldLabelClass}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={[
            fieldTextareaClass,
            error ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {hint && !error && <p className={fieldHintClass}>{hint}</p>}
        {error && <p className={fieldErrorClass}>{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
export default Textarea;
