import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Translate } from '@phosphor-icons/react';

const LanguageSwitcher = memo(function LanguageSwitcher({ isMobile }) {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === 'id' ? 'en' : 'id';
    i18n.changeLanguage(next);
    localStorage.setItem('mr-ole-lang', next);
  };

  const base = 'flex items-center gap-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900';

  if (isMobile) {
    return (
      <button onClick={toggle} className={`${base} w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300`}>
        <Translate className="w-4 h-4" />
        {i18n.language === 'id' ? 'English' : 'Indonesia'}
      </button>
    );
  }

  return (
    <button onClick={toggle} className={`${base} px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300`}>
      <Translate className="w-3.5 h-3.5" />
      {i18n.language === 'id' ? 'EN' : 'ID'}
    </button>
  );
});

export default LanguageSwitcher;
