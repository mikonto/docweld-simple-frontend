import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Mock dependencies
vi.mock('@/config/firebase', () => ({
  auth: {},
}));

vi.mock('react-firebase-hooks/auth', () => ({
  useSignInWithEmailAndPassword: vi.fn(),
}));

vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Import mocked modules
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

describe('Login', () => {
  const mockSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    useSignInWithEmailAndPassword.mockReturnValue([
      mockSignIn,
      null, // user
      false, // loading
      null, // error
    ]);

    useApp.mockReturnValue({
      loading: false,
      isAuthorized: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('should render login form with email and password inputs', () => {
    renderLogin();

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should handle form submission with email and password', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should show loading state while signing in', () => {
    useSignInWithEmailAndPassword.mockReturnValue([
      mockSignIn,
      null,
      true, // loading
      null,
    ]);

    renderLogin();

    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });

  it('should show loading state while checking auth', () => {
    useApp.mockReturnValue({
      loading: true,
      isAuthorized: false,
    });

    renderLogin();

    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });

  it('should display error message on authentication failure', async () => {
    const error = new Error('Invalid credentials');

    useSignInWithEmailAndPassword.mockReturnValue([
      mockSignIn,
      null,
      false,
      error,
    ]);

    renderLogin();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password', {
        id: 'login-error',
      });
    });
  });

  it('should redirect to home when user is authenticated', () => {
    useApp.mockReturnValue({
      loading: false,
      userAuth: { uid: 'test-user' }, // User is authenticated
    });

    renderLogin();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should disable submit button while loading', () => {
    useSignInWithEmailAndPassword.mockReturnValue([
      mockSignIn,
      null,
      true, // loading
      null,
    ]);

    renderLogin();

    // When loading, it shows the spinner instead of the form
    expect(
      screen.queryByRole('button', { name: 'Sign In' })
    ).not.toBeInTheDocument();
  });

  it('should have proper autocomplete attributes for accessibility', () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
  });

  it('should require email and password fields', () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('should have email type for email input', () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should have password type for password input', () => {
    renderLogin();

    const passwordInput = screen.getByPlaceholderText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
