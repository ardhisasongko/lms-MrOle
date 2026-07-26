import { memo } from 'react';
import { cn } from '../../utils/cn';

function Input({
  label,
  error,
  className,
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'block w-full rounded-xl border px-4 py-2.5 text-sm',
          'bg-white dark:bg-gray-800',
          'border-black/[0.08] dark:border-white/[0.12]',
          'text-gray-900 dark:text-gray-100',
          'placeholder-gray-400 dark:placeholder-gray-500',
          'focus:border-primary-300 focus:ring-2 focus:ring-primary-300/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200 ease-spring',
          'shadow-[inset_0_1px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default memo(Input);
