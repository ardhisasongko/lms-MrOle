import { cn } from '../../utils/cn';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-gray-400 dark:text-gray-500" weight="regular" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
