import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { AppSidebar } from './AppSidebar';
import { renderWithProviders } from '@/test/utils/testUtils';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';

// Mock hooks
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

vi.mock('@/hooks/useProjects', () => ({
  useProjects: vi.fn(),
  useProject: vi.fn(),
}));

// Mock dropdown menu components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, open }) => <div data-open={open}>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children);
    }
    return <button>{children}</button>;
  },
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }) => (
    <div onClick={() => onSelect && onSelect()}>{children}</div>
  ),
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

// Mock command components
vi.mock('@/components/ui/command', () => ({
  Command: ({ children }) => <div>{children}</div>,
  CommandInput: ({ placeholder }) => <input placeholder={placeholder} />,
  CommandList: ({ children }) => <div>{children}</div>,
  CommandEmpty: ({ children }) => <div>{children}</div>,
  CommandGroup: ({ children }) => <div>{children}</div>,
  CommandItem: ({ children, onSelect, value }) => (
    <div onClick={() => onSelect && onSelect(value)}>{children}</div>
  ),
}));

// Mock sidebar UI components
vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }) => (
    <aside role="complementary" {...props}>
      {children}
    </aside>
  ),
  SidebarContent: ({ children }) => <div>{children}</div>,
  SidebarHeader: ({ children }) => <header>{children}</header>,
  SidebarGroup: ({ children }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }) => <h3>{children}</h3>,
  SidebarGroupContent: ({ children }) => <div>{children}</div>,
  SidebarSeparator: () => <hr />,
  SidebarFooter: ({ children }) => <footer>{children}</footer>,
  SidebarMenu: ({ children }) => <nav>{children}</nav>,
  SidebarMenuItem: ({ children }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, asChild, ...props }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, props);
    }
    return <button {...props}>{children}</button>;
  },
  SidebarRail: () => <div data-testid="sidebar-rail" />,
}));

describe('AppSidebar', () => {
  const mockNavigate = vi.fn();
  const mockProjects = [
    { id: '123', projectName: 'Test Project', status: 'active' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useParams).mockReturnValue({});
    vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
    vi.mocked(useApp).mockReturnValue({
      loggedInUser: {
        email: 'test@example.com',
        role: 'admin',
      },
    });
    vi.mocked(useProjects).mockReturnValue([mockProjects, false, null]);
  });

  describe('Navigation Structure', () => {
    it('should always show Back to Projects link', () => {
      renderWithProviders(<AppSidebar />);

      // Back to Projects is always shown
      expect(
        screen.getByRole('link', { name: /back to projects/i })
      ).toBeInTheDocument();

      // System navigation is in the header dropdown, not the sidebar
      expect(
        screen.queryByRole('link', { name: /material management/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /document library/i })
      ).not.toBeInTheDocument();
    });

    it('should only show project navigation when in project context', () => {
      // Set up project context
      vi.mocked(useParams).mockReturnValue({ projectId: '123' });

      renderWithProviders(<AppSidebar />);

      // Should show project navigation items
      expect(
        screen.getByRole('link', { name: /project overview/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /weld logs/i })
      ).toBeInTheDocument();
    });
  });

  describe('Project Context', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ projectId: '123' });
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/projects/123/overview',
      });
    });

    it('should always show project selector', () => {
      renderWithProviders(<AppSidebar />);

      // Project selector shows the project name (there may be multiple due to dropdown)
      const projectNameElements = screen.getAllByText('Test Project');
      expect(projectNameElements.length).toBeGreaterThan(0);
      expect(
        screen.getByRole('link', { name: /project overview/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /weld logs/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /project documents/i })
      ).toBeInTheDocument();
    });

    it('should show back to projects button', () => {
      renderWithProviders(<AppSidebar />);

      expect(
        screen.getByRole('link', { name: /back to projects/i })
      ).toBeInTheDocument();
    });

    it('should hide admin sections for basic users in project context', () => {
      vi.mocked(useApp).mockReturnValue({
        loggedInUser: {
          email: 'basic@example.com',
          role: 'user',
        },
      });

      renderWithProviders(<AppSidebar />);

      // Should show project navigation
      expect(
        screen.getByRole('link', { name: /project overview/i })
      ).toBeInTheDocument();

      // Should NOT show admin sections
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /^Projects$/ })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /material management/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should not show logo (moved to SiteHeader)', () => {
      renderWithProviders(<AppSidebar />);

      expect(
        screen.queryByRole('link', { name: /docweld/i })
      ).not.toBeInTheDocument();
    });

    it('should not show user profile (moved to SiteHeader)', () => {
      renderWithProviders(<AppSidebar />);

      expect(
        screen.queryByRole('button', { name: /test@example.com/i })
      ).not.toBeInTheDocument();
    });
  });
});
