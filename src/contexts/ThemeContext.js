import { createContext, useContext } from 'react';

// Create the theme context with default value
export const ThemeContext = createContext(null);

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
