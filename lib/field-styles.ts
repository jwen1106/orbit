/** Shared form field styles — use across Input, Textarea, Select and raw inputs. */

export const fieldLabelClass =
  'block text-sm font-semibold text-orbit-dark text-left mb-1.5';

export const fieldLabelCompactClass =
  'block text-xs font-semibold text-gray-600 text-left mb-1.5';

export const fieldHintClass = 'text-xs text-gray-500 text-left mt-1.5';

export const fieldErrorClass = 'text-xs text-red-600 text-left mt-1.5';

const fieldBase =
  'w-full rounded-xl border border-gray-200 bg-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orbit-forest/25 focus:border-orbit-forest/40 disabled:bg-gray-50 disabled:opacity-60';

export const fieldInputClass = [
  fieldBase,
  'px-4 py-2.5 text-sm text-orbit-dark text-center placeholder:text-gray-400 placeholder:text-center',
].join(' ');

export const fieldTextareaClass = [
  fieldBase,
  'px-4 py-2.5 text-sm text-orbit-dark placeholder:text-gray-400 resize-y min-h-[5rem]',
].join(' ');

export const fieldSelectClass = [
  fieldBase,
  'px-4 py-2.5 text-sm text-orbit-dark text-left',
].join(' ');

export const fieldInputCompactClass =
  'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-orbit-dark text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-orbit-forest/25 focus:border-orbit-forest/40';

export const fieldSelectCompactClass =
  'rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-orbit-dark text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-orbit-forest/25 focus:border-orbit-forest/40';

export const fieldReadOnlyClass = [
  fieldBase,
  'px-4 py-2.5 text-xs text-gray-500 font-mono text-center bg-gray-50 cursor-default select-all',
].join(' ');

/** @deprecated Use fieldInputClass — kept for landing page imports */
export const inputClass = fieldInputClass;
