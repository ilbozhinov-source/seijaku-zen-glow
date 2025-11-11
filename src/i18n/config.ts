import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import bg from './locales/bg.json';
import en from './locales/en.json';
import el from './locales/el.json';
import ro from './locales/ro.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      bg: { translation: bg },
      en: { translation: en },
      el: { translation: el },
      ro: { translation: ro }
    },
    fallbackLng: 'bg',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
