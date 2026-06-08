import { forwardRef, type SelectHTMLAttributes } from 'react';

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
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold text-orbit-dark"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            'w-full rounded-md border px-3 py-2 text-sm text-orbit-dark bg-white',
            'focus:outline-none focus:ring-2 focus:ring-orbit-green focus:border-orbit-green',
            'disabled:bg-gray-50 disabled:opacity-60',
            error ? 'border-red-400' : 'border-gray-300',
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
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
