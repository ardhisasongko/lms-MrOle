import { Link } from 'react-router-dom';
import { House, ArrowsClockwise } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export default function ErrorPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('error.title')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        {t('error.text')}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm min-h-[44px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
        >
          <ArrowsClockwise className="w-4 h-4" />
          {t('error.reload')}
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cta-500 text-white hover:bg-cta-600 rounded-2xl font-medium text-sm min-h-[44px] shadow-clay transition-all duration-150"
        >
          <House className="w-4 h-4" />
          {t('error.home')}
        </Link>
      </div>
    </div>
  );
}
