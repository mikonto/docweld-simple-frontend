// src/components/PublicRoute.i18n.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { vi, describe, it, expect, beforeEach, MockedFunction } from 'vitest';
import { toast } from 'sonner';
import PublicRoute from './PublicRoute';
import i18n from '@/i18n/config';
import { useApp } from '@/contexts/AppContext';
import { ReactNode } from 'react';
import type { UseAuthWithFirestoreReturn } from '@/hooks/useAuthWithFirestore';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// PublicRoute doesn't use useSignOut, removing this mock

vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  auth: {},
}));

const mockUseApp = useApp as MockedFunction<typeof useApp>;
const mockToast = toast as unknown as {
  error: MockedFunction<(message: string) => void>;
  success: MockedFunction<(message: string) => void>;
};

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  );

  it('should show public content when user is authenticated but not authorized', () => {
    // Mock authenticated but unauthorized user
    mockUseApp.mockReturnValue({
      userAuth: { uid: 'test-user' },
      isAuthorized: false,
      loading: false,
    } as UseAuthWithFirestoreReturn);

    render(
      <PublicRoute>
        <div>Login Page</div>
      </PublicRoute>,
      { wrapper }
    );

    // PublicRoute doesn't handle unauthorized users - it just shows public content
    // PrivateRoute is responsible for signing out and showing error messages
    expect(screen.getByText('Login Page')).toBeInTheDocument();

    // Should NOT show any error messages (that's PrivateRoute's job)
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('should redirect authorized user without showing any messages', () => {
    // Mock authorized user
    mockUseApp.mockReturnValue({
      userAuth: { uid: 'test-user' },
      isAuthorized: true,
      loading: false,
    } as UseAuthWithFirestoreReturn);

    render(
      <PublicRoute>
        <div>Login Page</div>
      </PublicRoute>,
      { wrapper }
    );

    // Should NOT show any toast message for already authenticated users
    // Silent redirect is the correct UX pattern
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('should show public content without toasts for unauthenticated users', () => {
    // Mock unauthenticated user
    mockUseApp.mockReturnValue({
      userAuth: null,
      isAuthorized: false,
      loading: false,
    } as UseAuthWithFirestoreReturn);

    render(
      <PublicRoute>
        <div>Login Page</div>
      </PublicRoute>,
      { wrapper }
    );

    // Should not show any toast
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();

    // Should display the public content
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should show loading spinner when loading', () => {
    // Mock loading state
    mockUseApp.mockReturnValue({
      userAuth: null,
      isAuthorized: false,
      loading: true,
    } as UseAuthWithFirestoreReturn);

    const { container } = render(
      <PublicRoute>
        <div>Login Page</div>
      </PublicRoute>,
      { wrapper }
    );

    // Should show spinner
    expect(
      container.querySelector('.flex.items-center.justify-center.min-h-screen')
    ).toBeInTheDocument();

    // Should not show any toast
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });
});
