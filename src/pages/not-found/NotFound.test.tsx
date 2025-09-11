import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import NotFound from './NotFound';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display 404 page content and handle navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotFound />);

    // Check all page content
    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(
        "The page you're looking for doesn't exist or has been moved."
      )
    ).toBeInTheDocument();

    // Test navigation functionality
    const returnHomeButton = screen.getByText('Return Home');
    expect(returnHomeButton).toBeInTheDocument();

    await user.click(returnHomeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});