import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import PageHeader from './PageHeader';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  };
});

// Mock Breadcrumbs component
vi.mock('@/components/Breadcrumbs', () => ({
  Breadcrumbs: () => null,
}));

// Helper to render with router
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('PageHeader', () => {
  it('should render title and subtitle', () => {
    renderWithRouter(
      <PageHeader title="Test Title" subtitle="Test Subtitle" />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should render without subtitle', () => {
    renderWithRouter(<PageHeader title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should handle breadcrumbs layout properly', () => {
    renderWithRouter(<PageHeader title="Projects" />);

    const container = screen.getByText('Projects').parentElement;
    expect(container).toHaveClass(
      'flex',
      'flex-col',
      'sm:flex-row',
      'sm:items-baseline',
      'sm:gap-3'
    );
  });
});