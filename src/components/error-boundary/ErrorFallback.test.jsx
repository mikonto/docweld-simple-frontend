import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ErrorFallback from './ErrorFallback';

// Component that throws an error for testing
function ThrowError({ shouldThrow = false }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorFallback', () => {
  const mockReset = vi.fn();
  const testError = new Error('Test error message');

  beforeEach(() => {
    mockReset.mockClear();
  });

  it('renders error UI with message', () => {
    render(<ErrorFallback error={testError} resetErrorBoundary={mockReset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/We apologize for this unexpected error/)
    ).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    render(<ErrorFallback error={testError} resetErrorBoundary={mockReset} />);

    expect(
      screen.getByText('Error: Error: Test error message')
    ).toBeInTheDocument();
    expect(screen.getByText('Technical Details')).toBeInTheDocument();
  });

  it('hides error details in production mode', () => {
    const originalDev = import.meta.env.DEV;
    import.meta.env.DEV = false;

    render(<ErrorFallback error={testError} resetErrorBoundary={mockReset} />);

    expect(
      screen.queryByText('Error: Error: Test error message')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Stack Trace')).not.toBeInTheDocument();

    import.meta.env.DEV = originalDev;
  });

  it('calls resetErrorBoundary when Try Again is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorFallback error={testError} resetErrorBoundary={mockReset} />);

    await user.click(screen.getByText('Try Again'));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders all UI elements correctly', () => {
    render(<ErrorFallback error={testError} resetErrorBoundary={mockReset} />);

    const heading = screen.getByText('Something went wrong');
    const iconContainer = heading
      .closest('.text-center')
      .querySelector('.text-red-500');
    expect(iconContainer).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/If this problem persists/)).toBeInTheDocument();
  });

  // Integration tests
  it('works with ErrorBoundary - renders children when no error', () => {
    const { ErrorBoundary } = require('react-error-boundary');

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('works with ErrorBoundary - renders fallback when error occurs', () => {
    const { ErrorBoundary } = require('react-error-boundary');

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/We apologize for this unexpected error/)
    ).toBeInTheDocument();
  });

  it('works with ErrorBoundary - resets when Try Again is clicked', () => {
    const { ErrorBoundary } = require('react-error-boundary');
    let shouldThrow = true;

    function ToggleError() {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    }

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ToggleError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
