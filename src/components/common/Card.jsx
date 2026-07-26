import { memo } from 'react';
import { cn } from '../../utils/cn';

function Card({ children, className, hover = true, ...props }) {
  return (
    <div className="relative p-[1px] rounded-[1.5rem]">
      <div
        className={cn(
          'bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-[1.5rem]',
          'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
          'shadow-clay',
          hover && 'hover:shadow-clay-lg transition-all duration-300 ease-spring',
          className
        )}
        {...props}
      >
        <div className="bg-white dark:bg-gray-800 rounded-[calc(1.5rem-0.375rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function CardHeader({ children, className }) {
  return (
    <div className={cn('px-5 sm:px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.06]', className)}>
      {children}
    </div>
  );
}

function CardContent({ children, className }) {
  return (
    <div className={cn('px-5 sm:px-6 py-5', className)}>
      {children}
    </div>
  );
}

export default memo(Card);
export { CardHeader, CardContent };
