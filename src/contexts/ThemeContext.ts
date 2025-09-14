/**
 * Theme context - re-exports from next-themes
 *
 * next-themes works perfectly with Vite projects!
 * It provides:
 * - System theme detection
 * - No flash on page load
 * - localStorage persistence
 * - Cross-tab synchronization
 */

export { useTheme } from 'next-themes';

// Note: next-themes uses string type for theme, not a specific union
// This allows for custom themes beyond just 'light' | 'dark' | 'system'
