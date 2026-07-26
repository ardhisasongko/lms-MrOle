import { memo } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-cta-500 text-white hover:bg-cta-600 focus:ring-cta-500 shadow-clay',
  secondary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-900/50',
  outline: 'border border-black/[0.08] dark:border-white/[0.12] text-gray-700 dark:text-gray-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] shadow-clay',
  ghost: 'text-gray-700 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-clay',
};

const sizes = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl',
        'transition-all duration-200 ease-spring',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        'min-h-[44px]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export default memo(Button);
