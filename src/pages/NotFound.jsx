import { Link } from 'react-router-dom';
import { House } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('notFound.title')}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        {t('notFound.text')}
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cta-500 text-white hover:bg-cta-600 rounded-2xl font-medium text-sm min-h-[44px] shadow-clay transition-all duration-150"
      >
        <House className="w-4 h-4" />
        {t('notFound.home')}
      </Link>
    </div>
  );
}
