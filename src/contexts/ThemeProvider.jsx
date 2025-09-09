import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from '@/contexts/ThemeContext';

const THEME_STORAGE_KEY = 'theme';
const VALID_THEMES = ['light', 'dark'];
const DEFAULT_THEME = 'light';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage with error handling
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (VALID_THEMES.includes(savedTheme)) {
        return savedTheme;
      }
    } catch {
      // localStorage might be unavailable (private browsing, permissions, etc.)
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    // Persist theme to localStorage with error handling
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage might be unavailable or full
    }

    // Apply theme to document
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
