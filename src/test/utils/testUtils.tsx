import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import type { RenderWithProvidersOptions } from '@/types/test-utils';
import { AppContext } from '@/contexts/AppContext';
import type { UseAuthWithFirestoreReturn } from '@/hooks/useAuthWithFirestore';

// Mock i18n to return keys as values in test environment
if (process.env.NODE_ENV === 'test') {
  i18n.options.returnEmptyString = false;
  i18n.options.fallbackLng = false;
  i18n.options.react = { useSuspense: false };
}

// ============== Provider Wrapper Component ==============

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// Minimal test fallback - only provides enough to prevent useApp() from throwing.
// Integration tests should use real AppProvider with mocked Firebase services.
// This fallback is for unit tests that don't directly test auth/Firestore behavior.
const defaultAppContextValue: UseAuthWithFirestoreReturn = {
  loggedInUser: null,
  userAuth: null,
  userDb: null,
  userStatus: null,
  isAuthorized: false,
  loading: false,
  error: undefined,
};

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <AppContext.Provider value={defaultAppContextValue}>
        <ThemeProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ThemeProvider>
      </AppContext.Provider>
    </I18nextProvider>
  );
};

// ============== Custom Render Function ==============

/**
 * Custom render function that includes all providers
 * This ensures all components have access to:
 * - React Router (for navigation)
 * - Theme Provider (for styling)
 * - i18n Provider (for translations)
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// ============== Re-exports ==============

// Re-export everything from testing library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

// Export our custom render as the default render
export { renderWithProviders as render };
