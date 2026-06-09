import { forwardRef, type InputHTMLAttributes } from 'react';
import {
  fieldErrorClass,
  fieldHintClass,
  fieldInputClass,
  fieldLabelClass,
} from '@/lib/field-styles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={fieldLabelClass}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            fieldInputClass,
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

Input.displayName = 'Input';
export default Input;
