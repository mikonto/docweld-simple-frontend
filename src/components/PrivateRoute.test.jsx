// src/components/PrivateRoute.i18n.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { vi } from 'vitest';
import { toast } from 'sonner';
import PrivateRoute from './PrivateRoute';
import i18n from '@/i18n/config';
import { useSignOut } from 'react-firebase-hooks/auth';
import { useApp } from '@/contexts/AppContext';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('react-firebase-hooks/auth', () => ({
  useSignOut: vi.fn(),
}));

vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  auth: {},
}));

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock for useSignOut
    const mockSignOut = vi.fn().mockResolvedValue(true);
    useSignOut.mockReturnValue([mockSignOut, false, null]);
  });

  const wrapper = ({ children }) => (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  );

  it('should store error message in sessionStorage when user is authenticated but not authorized', async () => {
    // Mock the signOut function
    const mockSignOut = vi.fn().mockResolvedValue(true);
    useSignOut.mockReturnValue([mockSignOut, false, null]);

    // Mock authenticated but unauthorized user (no userDb means unauthorized)
    useApp.mockReturnValue({
      userAuth: { uid: 'test-user' },
      isAuthorized: false,
      loading: false,
      userDb: null, // This triggers the unauthorized flow
    });

    // Clear sessionStorage before test
    sessionStorage.clear();

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
      { wrapper }
    );

    // Wait for useEffect to run
    await waitFor(() => {
      // Should sign out the user
      expect(mockSignOut).toHaveBeenCalled();
    });

    // Should store error message in sessionStorage (not show toast directly)
    // PrivateRoute stores the message, Login component shows the toast
    const storedError = sessionStorage.getItem('authError');
    expect(storedError).toMatch(
      /not authorized to access|ikke autoriseret til at få adgang/
    );
  });

  it('should not show error message when user is not authenticated', () => {
    // Mock the signOut function
    const mockSignOut = vi.fn();
    useSignOut.mockReturnValue([mockSignOut, false, null]);

    // Mock unauthenticated user
    useApp.mockReturnValue({
      userAuth: null,
      isAuthorized: false,
      loading: false,
    });

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
      { wrapper }
    );

    // Should not sign out
    expect(mockSignOut).not.toHaveBeenCalled();

    // Should not show error message
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should show loading spinner when loading', () => {
    // Mock loading state
    useApp.mockReturnValue({
      userAuth: null,
      isAuthorized: false,
      loading: true,
    });

    const { container } = render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
      { wrapper }
    );

    // Should show spinner (look for the loading wrapper instead)
    expect(
      container.querySelector('.min-h-screen.flex.items-center.justify-center')
    ).toBeInTheDocument();

    // Should not show error
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should render children when user is authorized', () => {
    // Mock the signOut function
    const mockSignOut = vi.fn();
    useSignOut.mockReturnValue([mockSignOut, false, null]);

    // Mock authorized user with active status
    useApp.mockReturnValue({
      userAuth: { uid: 'test-user' },
      userDb: { status: 'active' }, // Need userDb for authorized user
      isAuthorized: true,
      loading: false,
      error: null,
    });

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
      { wrapper }
    );

    // Should render protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();

    // Should not sign out or show error
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
