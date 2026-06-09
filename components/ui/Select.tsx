import { forwardRef, type SelectHTMLAttributes } from 'react';
import {
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  fieldSelectClass,
} from '@/lib/field-styles';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, placeholder, options, className = '', id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className={fieldLabelClass}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            fieldSelectClass,
            error ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : '',
            className,
          ].join(' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && <p className={fieldHintClass}>{hint}</p>}
        {error && <p className={fieldErrorClass}>{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
