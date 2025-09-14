import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';
import * as React from 'react';
import './mocks/firebaseConfig';
import './setupI18n';

// ============== Mock next-themes ==============
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light',
    themes: ['light', 'dark', 'system'],
  }),
}));

// ============== Global Mock Setup ==============

// Mock window.matchMedia for theme support
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
(global as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
  vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

// Mock ResizeObserver
(global as unknown as { ResizeObserver: unknown }).ResizeObserver = vi.fn(
  () => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })
);

// ============== Console Suppression Setup ==============

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

/**
 * Check if an error message should be suppressed during tests
 */
function shouldSuppressError(message: string): boolean {
  const suppressedErrors = [
    'Consider adding an error boundary',
    'Error adding',
    'Error renaming',
    'Error deleting',
    'Failed to',
    'Network error',
    'Permission denied',
    'requires an index',
    'Batch operation limit exceeded',
  ];

  return suppressedErrors.some((suppressedError) =>
    message.includes(suppressedError)
  );
}

/**
 * Check if a warning or log message should be suppressed during tests
 */
function shouldSuppressI18nMessage(message: string): boolean {
  return message.includes('i18next');
}

beforeAll(() => {
  // Suppress specific error messages that are expected in tests
  console.error = (...args: unknown[]) => {
    const errorMessage = typeof args[0] === 'string' ? args[0] : '';

    if (shouldSuppressError(errorMessage)) {
      return;
    }
    originalError.call(console, ...args);
  };

  // Suppress i18next logs
  console.warn = (...args: unknown[]) => {
    const warnMessage = typeof args[0] === 'string' ? args[0] : '';
    if (shouldSuppressI18nMessage(warnMessage)) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.log = (...args: unknown[]) => {
    const logMessage = typeof args[0] === 'string' ? args[0] : '';
    if (shouldSuppressI18nMessage(logMessage)) {
      return;
    }
    originalLog.call(console, ...args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});
