import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { SiteHeader } from './SiteHeader';
import { renderWithProviders } from '@/test/utils/testUtils';
import { useApp } from '@/contexts/AppContext';
import { useLocation, useParams } from 'react-router-dom';

// Mock hooks
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: vi.fn(() => ({
      t: (key) => key,
      i18n: {
        language: 'en',
        changeLanguage: vi.fn(),
      },
    })),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    useParams: vi.fn(),
  };
});

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
  auth: {},
}));

// Mock useProject hook
vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(() => [null, false, null]),
}));

// Mock theme hook
vi.mock('@/hooks/useTheme', () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

// Mock sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Menu</button>,
}));

describe('SiteHeader', () => {
  const mockUser = {
    uid: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue({ loggedInUser: mockUser });
    vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
    vi.mocked(useParams).mockReturnValue({});
  });

  describe('Basic Structure', () => {
    it('should render logo with link to home', () => {
      renderWithProviders(<SiteHeader />);

      const logo = screen.getByRole('link', { name: /docweld/i });
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('href', '/');
    });

    it('should render user avatar with dropdown menu', () => {
      renderWithProviders(<SiteHeader />);

      const avatar = screen.getByRole('button', { name: /test user/i });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('should show user initials in avatar', () => {
      renderWithProviders(<SiteHeader />);

      expect(screen.getByText('TU')).toBeInTheDocument();
    });
  });

  describe('User States', () => {
    it('should handle missing user gracefully', () => {
      vi.mocked(useApp).mockReturnValue({ loggedInUser: null });

      renderWithProviders(<SiteHeader />);

      // Should still render logo without crashing
      expect(
        screen.getByRole('link', { name: /docweld/i })
      ).toBeInTheDocument();
      // No user menu
      expect(
        screen.queryByRole('button', { name: /user/i })
      ).not.toBeInTheDocument();
    });

    it('should render user menu for logged in users', () => {
      renderWithProviders(<SiteHeader />);

      const userMenuButton = screen.getByRole('button', { name: /test user/i });
      expect(userMenuButton).toBeInTheDocument();
    });
  });

  describe('Component Behavior', () => {
    it('should not render sidebar toggle button', () => {
      renderWithProviders(<SiteHeader />);

      expect(
        screen.queryByRole('button', { name: /toggle menu/i })
      ).not.toBeInTheDocument();
    });

    it('should not have language switcher in header', () => {
      renderWithProviders(<SiteHeader />);

      // Language switcher moved to user menu
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });
});
