import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from '../locales/id.json';
import en from '../locales/en.json';

const saved = localStorage.getItem('mr-ole-lang');

i18n.use(initReactI18next).init({
  resources: { id: { translation: id }, en: { translation: en } },
  lng: saved || 'id',
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
});

export default i18n;
