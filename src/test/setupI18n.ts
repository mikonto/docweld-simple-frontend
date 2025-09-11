// Import the configured i18n instance
import i18n from '@/i18n/config';

// ============== i18n Test Configuration ==============

/**
 * Initialize i18n for test environment
 * 
 * Configuration ensures:
 * - English as default language
 * - No suspense (for synchronous testing)
 * - No debug output to reduce noise
 * - Fallback disabled for cleaner test assertions
 */
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Disable suspense for tests
  },
});