// Import the configured i18n instance
import i18n from '@/i18n/config';

// Ensure i18n is initialized for tests
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});
