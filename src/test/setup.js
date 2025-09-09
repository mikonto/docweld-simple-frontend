import '@testing-library/jest-dom';
import { vi } from 'vitest';
import './mocks/firebaseConfig';
import './setupI18n';

// Mock window.matchMedia for theme support
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console errors during tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  // Suppress specific error messages that are expected in tests
  console.error = (...args) => {
    const errorMessage = typeof args[0] === 'string' ? args[0] : '';

    // Suppress expected test errors
    if (
      errorMessage.includes('Consider adding an error boundary') ||
      errorMessage.includes('Error adding') ||
      errorMessage.includes('Error renaming') ||
      errorMessage.includes('Error deleting') ||
      errorMessage.includes('Failed to') ||
      errorMessage.includes('Network error') ||
      errorMessage.includes('Permission denied') ||
      errorMessage.includes('requires an index') ||
      errorMessage.includes('Batch operation limit exceeded')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  // Suppress i18next logs
  console.warn = (...args) => {
    const warnMessage = typeof args[0] === 'string' ? args[0] : '';
    if (warnMessage.includes('i18next')) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.log = (...args) => {
    const logMessage = typeof args[0] === 'string' ? args[0] : '';
    if (logMessage.includes('i18next')) {
      return;
    }
    originalLog.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});
