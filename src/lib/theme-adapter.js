/**
 * Adapter to provide next-themes interface for shadcn/ui components
 * This allows us to use our own ThemeProvider without modifying shadcn components
 */

import { useTheme as useAppTheme } from '@/contexts/ThemeContext';

/**
 * Adapter hook that provides next-themes compatible interface
 * Maps our theme context to what shadcn components expect
 */
export function useTheme() {
  const { theme, setTheme } = useAppTheme();

  // Return interface compatible with next-themes
  return {
    theme: theme || 'system',
    setTheme,
    systemTheme: 'light', // We could detect this if needed
    themes: ['light', 'dark', 'system'],
  };
}
