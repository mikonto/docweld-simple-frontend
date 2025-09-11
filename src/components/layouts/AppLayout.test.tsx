import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { AppLayout } from './AppLayout';
import { useApp } from '@/contexts/AppContext';
import { useParams, useLocation } from 'react-router-dom';

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    loggedInUser: {
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    },
  })),
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: '/' })),
  };
});

vi.mock('@/hooks/useProjects', () => ({
  useProjects: vi.fn(() => [
    [{ id: '123', projectName: 'Test Project', status: 'active' }],
    false,
    null,
  ]),
  useProject: vi.fn(() => [
    { id: '123', projectName: 'Test Project', status: 'active' },
    false,
    null,
  ]),
}));

// Mock theme and sidebar components
vi.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Menu</button>,
  Sidebar: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div data-testid="sidebar" {...props}>
      {children}
    </div>
  ),
  SidebarContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-group">{children}</div>
  ),
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-group-label">{children}</div>
  ),
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-group-content">{children}</div>
  ),
}));

// Mock child components
vi.mock('./AppSidebar', () => ({
  AppSidebar: () => (
    <div data-testid="app-sidebar" role="complementary">
      Sidebar
    </div>
  ),
}));

vi.mock('@/components/Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

vi.mock('./SiteHeader', () => ({
  SiteHeader: () => (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full items-center border-b bg-background bg-card dark:bg-card border-border"
    >
      Site Header
    </header>
  ),
}));

// Helper to render with router
interface RenderWithRouterOptions {
  initialEntries?: string[];
}

function renderWithRouter(ui: React.ReactElement, { initialEntries = ['/'] }: RenderWithRouterOptions = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={ui}>
          <Route index element={<div>Home Page</div>} />
          <Route
            path="projects/:projectId/*"
            element={<div>Project Page</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    // Reset mocks to default values
    vi.mocked(useParams).mockReturnValue({});
    vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
    vi.mocked(useApp).mockReturnValue({
      loggedInUser: {
        displayName: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      },
    });
  });

  describe('Basic Layout Structure', () => {
    it('should render with proper layout providers', () => {
      renderWithRouter(<AppLayout />);

      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render site header with proper styling', () => {
      renderWithRouter(<AppLayout />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('sticky', 'top-0', 'bg-card', 'border-border');
    });

    it('should have proper flex layout structure', () => {
      renderWithRouter(<AppLayout />);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1', 'bg-main-background');

      // Check that main is in a flex container
      const container = main.parentElement;
      expect(container).toHaveClass('flex');
    });

    it('should render outlet content', () => {
      renderWithRouter(<AppLayout />);

      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  describe('Sidebar Visibility', () => {
    it('should NOT render sidebar on app-level pages', () => {
      renderWithRouter(<AppLayout />);

      expect(screen.queryByTestId('app-sidebar')).not.toBeInTheDocument();
    });

    it('should render sidebar in project context', () => {
      // Set project route
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/projects/123/overview',
      });
      vi.mocked(useParams).mockReturnValue({ projectId: '123' });

      renderWithRouter(<AppLayout />, {
        initialEntries: ['/projects/123/overview'],
      });

      const sidebar = screen.getByTestId('app-sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('should not render sidebar for basic users on app-level pages', () => {
      // Mock basic user
      vi.mocked(useApp).mockReturnValue({
        loggedInUser: {
          displayName: 'Basic User',
          email: 'basic@example.com',
          role: 'user',
        },
      });

      renderWithRouter(<AppLayout />);

      expect(screen.queryByTestId('app-sidebar')).not.toBeInTheDocument();
    });
  });

  describe('Routing', () => {
    it('should handle project routes', () => {
      renderWithRouter(<AppLayout />, {
        initialEntries: ['/projects/123/overview'],
      });

      expect(screen.getByText('Project Page')).toBeInTheDocument();
    });
  });
});