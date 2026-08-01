import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const languages = ['id', 'en'];

const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'id';

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="flex rounded-xl bg-black/[0.04] ring-1 ring-black/[0.04] dark:bg-white/[0.06] dark:ring-white/[0.06]"
    >
      {languages.map((language) => {
        const active = currentLanguage === language;
        return (
          <button
            key={language}
            type="button"
            onClick={() => i18n.changeLanguage(language)}
            aria-label={t(`nav.language.${language}`)}
            aria-pressed={active}
            className={`h-11 min-h-[44px] min-w-[44px] rounded-xl px-2 text-xs font-semibold transition-all duration-150 ease-spring focus-visible:ring-2 focus-visible:ring-primary-500 ${
              active
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {language.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
});

export default LanguageSwitcher;
