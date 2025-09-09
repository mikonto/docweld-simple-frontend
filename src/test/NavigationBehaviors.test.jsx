import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { useParams, useLocation } from 'react-router-dom';

// Mock hooks
vi.mock('@/contexts/AppContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useLocation: vi.fn(),
    Outlet: () => <div>Page Content</div>,
  };
});

// Mock useProjects hooks
vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(() => [null, false, null]),
  useProjects: vi.fn(() => [[], false, null]),
}));

// Mock Breadcrumbs component that returns breadcrumbs on project pages
vi.mock('@/components/Breadcrumbs', () => ({
  Breadcrumbs: () => {
    const location = vi.mocked(useLocation).mock.results[0]?.value;
    if (
      location?.pathname.includes('/projects/') &&
      location?.pathname !== '/projects'
    ) {
      return <nav aria-label="Breadcrumb">Project Breadcrumbs</nav>;
    }
    return null;
  },
}));

describe('Navigation Behaviors for Different User Types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin User Navigation', () => {
    beforeEach(() => {
      vi.mocked(useApp).mockReturnValue({
        loggedInUser: {
          uid: 'admin123',
          email: 'admin@example.com',
          role: 'admin',
        },
      });
    });

    it('should NOT show project navigation on projects list page', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
      vi.mocked(useParams).mockReturnValue({});

      renderWithProviders(<AppLayout />);

      // Project navigation items should NOT be visible on app-level pages
      expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Weld Logs')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Project')).not.toBeInTheDocument();
    });

    it('should show project navigation when inside a project', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/projects/123/weld-logs',
      });
      vi.mocked(useParams).mockReturnValue({ projectId: '123' });

      renderWithProviders(<AppLayout />);

      // Project navigation should be visible
      expect(screen.getByText('Select Project')).toBeInTheDocument();
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
      expect(screen.getByText('Weld Logs')).toBeInTheDocument();

      // Main content area should exist
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should NOT show project navigation on top-level admin pages', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/user-management' });
      vi.mocked(useParams).mockReturnValue({});

      renderWithProviders(<AppLayout />);

      // Project navigation should NOT be visible on app-level pages
      expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Project')).not.toBeInTheDocument();

      // Main content area should exist
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Basic User Navigation', () => {
    beforeEach(() => {
      vi.mocked(useApp).mockReturnValue({
        loggedInUser: {
          uid: 'user123',
          email: 'user@example.com',
          role: 'user',
        },
      });
    });

    it('should NOT show project navigation on projects list page', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
      vi.mocked(useParams).mockReturnValue({});

      renderWithProviders(<AppLayout />);

      // Project navigation should NOT be visible on app-level pages
      expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Project')).not.toBeInTheDocument();
    });

    it('should show project navigation when inside a project', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/projects/123/project-overview',
      });
      vi.mocked(useParams).mockReturnValue({ projectId: '123' });

      renderWithProviders(<AppLayout />);

      // Project navigation should be visible
      expect(screen.getByText('Select Project')).toBeInTheDocument();
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
      // Basic users might have limited navigation items
    });

    it('should show project navigation for document pages', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/projects/123/documents',
      });
      vi.mocked(useParams).mockReturnValue({ projectId: '123' });

      renderWithProviders(<AppLayout />);

      // Project navigation should be visible
      expect(screen.getByText('Select Project')).toBeInTheDocument();
      expect(screen.getByText('Project Documents')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Site Header Visibility', () => {
    it('should always show site header with logo', () => {
      vi.mocked(useApp).mockReturnValue({
        loggedInUser: {
          uid: 'user123',
          email: 'user@example.com',
          role: 'user',
        },
      });
      vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
      vi.mocked(useParams).mockReturnValue({});

      renderWithProviders(<AppLayout />);

      // Site header should always be visible
      expect(screen.getByRole('banner')).toBeInTheDocument();
      // Logo should be visible
      expect(
        screen.getByRole('link', { name: /docweld/i })
      ).toBeInTheDocument();
    });
  });
});
