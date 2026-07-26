import { memo } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-black/[0.04] text-gray-700 dark:bg-white/[0.08] dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
  success: 'bg-cta-100 text-cta-700 dark:bg-cta-900/30 dark:text-cta-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const sizes = {
  sm: 'px-3 py-0.5 text-[11px] uppercase tracking-[0.05em]',
  md: 'px-3.5 py-1 text-xs uppercase tracking-[0.05em]',
};

function Badge({ children, variant = 'default', size = 'sm', className }) {
  return (
    <span className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

export default memo(Badge);
