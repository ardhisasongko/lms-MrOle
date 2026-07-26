import { Link } from 'react-router-dom';
import { Envelope, ArrowLeft } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export default function Verify() {
  const { t } = useTranslation();
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto">
        <Envelope className="w-8 h-8 text-primary-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('auth.verify.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('auth.verify.text')}
        </p>
      </div>
      <Link
        to="/login"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm min-h-[44px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
      >
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </Link>
    </div>
  );
}
