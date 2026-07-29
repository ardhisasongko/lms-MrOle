import { memo } from 'react';
import { WarningCircle, ArrowsClockwise } from '@phosphor-icons/react';
import Button from '../common/Button';

const ErrorState = memo(function ErrorState({ title = 'Terjadi Kesalahan', message = 'Silakan coba lagi.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <WarningCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <ArrowsClockwise className="w-4 h-4 mr-2" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
});

export default ErrorState;
