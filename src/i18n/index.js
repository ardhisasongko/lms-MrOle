import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from '../locales/id.json';
import en from '../locales/en.json';

const STORAGE_KEY = 'mr-ole-lang';
const saved = localStorage.getItem(STORAGE_KEY);
const initialLanguage = saved === 'en' ? 'en' : 'id';

i18n.use(initReactI18next).init({
  resources: { id: { translation: id }, en: { translation: en } },
  lng: initialLanguage,
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
});

const syncLanguage = (language) => {
  const normalized = language?.startsWith('en') ? 'en' : 'id';
  document.documentElement.lang = normalized;
  localStorage.setItem(STORAGE_KEY, normalized);
};

syncLanguage(i18n.language);
i18n.on('languageChanged', syncLanguage);

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY && (event.newValue === 'id' || event.newValue === 'en')) {
    i18n.changeLanguage(event.newValue);
  }
});

export default i18n;
