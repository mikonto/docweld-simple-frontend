import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import daTranslation from './locales/da/translation.json';

// Saved language preference
const savedLanguage =
  typeof window !== 'undefined' && window.localStorage
    ? localStorage.getItem('language') || 'en'
    : 'en';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      da: {
        translation: daTranslation,
      },
    },
    lng: savedLanguage, // default language
    fallbackLng: 'en', // fallback language when translation is missing

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Options for better developer experience
    debug: false, // Disable debug logs

    // React specific options
    react: {
      useSuspense: false, // Disable suspense to handle loading states manually
    },

    // Ensure nested keys work properly
    ignoreJSONStructure: false,
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('language', lng);
  }
});

export default i18n;
