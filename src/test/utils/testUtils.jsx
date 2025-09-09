import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import PropTypes from 'prop-types';

// Mock i18n to return keys as values in test environment
if (process.env.NODE_ENV === 'test') {
  i18n.options.returnEmptyString = false;
  i18n.options.fallbackLng = false;
  i18n.options.react = { useSuspense: false };
}

// Custom render function that includes all providers
export function renderWithProviders(ui, options = {}) {
  const AllTheProviders = ({ children }) => {
    return (
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ThemeProvider>
      </I18nextProvider>
    );
  };

  AllTheProviders.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from testing library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { renderWithProviders as render };
