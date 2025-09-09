import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from '@/contexts/ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component that uses the theme hook
function TestComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.classList.remove('dark');
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove('dark');
  });

  it('provides default theme as light', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('loads theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('updates theme and persists to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Set Dark'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  it('manages dark class on documentElement', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Set Dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByText('Set Light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('throws error when useTheme is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  it('handles invalid localStorage values gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('handles localStorage errors gracefully when loading', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Error is handled silently now - no console.warn
    // Should fallback to default theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('handles localStorage errors gracefully when saving', async () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage full');
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Set Dark'));

    await waitFor(() => {
      // Error is handled silently now - no console.warn
      // Theme should still update in state even if localStorage fails
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });
});
