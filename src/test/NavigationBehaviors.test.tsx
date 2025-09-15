import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { useParams, useLocation } from 'react-router-dom';
import type { UseAuthWithFirestoreReturn } from '@/hooks/useAuthWithFirestore';
import type { MockedFunction } from '@/types/test-utils';
import type { Location } from 'react-router-dom';
import { mockTimestamp } from '@/test/utils/mockTimestamp';

// ============== Type Definitions ==============

// @unused - mock return type
// interface MockUseAppReturn {
//   loggedInUser: LoggedInUser | null;
// }

interface MockLocationReturn {
  pathname: string;
}

// @unused - mock params return type
// interface MockParamsReturn {
//   projectId?: string;
//   [key: string]: string | undefined;
// }

// ============== Mock Setup ==============

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
    const location = (
      vi.mocked(useLocation) as MockedFunction<typeof useLocation>
    ).mock.results[0]?.value as MockLocationReturn | undefined;
    if (
      location?.pathname.includes('/projects/') &&
      location?.pathname !== '/projects'
    ) {
      return <nav aria-label="Breadcrumb">Project Breadcrumbs</nav>;
    }
    return null;
  },
}));

// ============== Helper Functions ==============

const createMockUser = (
  role: 'admin' | 'user' | 'viewer',
  uid = 'test-uid',
  email = 'test@example.com'
): UseAuthWithFirestoreReturn => ({
  loggedInUser: {
    // Firebase Auth properties
    uid,
    email,
    emailVerified: true,
    phoneNumber: null,
    photoURL: null,
    providerId: 'password',
    // Firestore User properties
    id: uid,
    displayName: `Test ${role}`,
    role,
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
    status: 'active',
  },
  userAuth: null,
  userDb: null,
  userStatus: null,
  isAuthorized: true,
  loading: false,
  error: undefined,
});

const mockUseApp = vi.mocked(useApp) as MockedFunction<typeof useApp>;
const mockUseLocation = vi.mocked(useLocation) as MockedFunction<
  typeof useLocation
>;
const mockUseParams = vi.mocked(useParams) as MockedFunction<typeof useParams>;

// ============== Test Suites ==============

describe('Navigation Behaviors for Different User Types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin User Navigation', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(
        createMockUser('admin', 'admin123', 'admin@example.com')
      );
    });

    it('should NOT show project navigation on projects list page', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/',
        state: null,
        key: 'default',
        search: '',
        hash: '',
      } as Location);
      mockUseParams.mockReturnValue({});

      renderWithProviders(<AppLayout />);

      // Project navigation items should NOT be visible on app-level pages
      expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Weld Logs')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Project')).not.toBeInTheDocument();
    });

    it('should show project navigation when inside a project', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/projects/123/weld-logs',
        state: null,
        key: 'default',
        search: '',
        hash: '',
      } as Location);
      mockUseParams.mockReturnValue({ projectId: '123' });

      renderWithProviders(<AppLayout />);

      // Project navigation should be visible
      expect(screen.getByText('Select Project')).toBeInTheDocument();
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
      expect(screen.getByText('Weld Logs')).toBeInTheDocument();

      // Main content area should exist
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should NOT show project navigation on top-level admin pages', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/user-management',
        state: null,
        key: 'default',
        search: '',
        hash: '',
      } as Location);
      mockUseParams.mockReturnValue({});

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
      mockUseApp.mockReturnValue(
        createMockUser('user', 'user123', 'user@example.com')
      );
    });

    it('should NOT show project navigation on projects list page', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/',
        state: null,
        key: 'default',
        search: '',
        hash: '',
      } as Location);
      mockUseParams.mockReturnValue({});

      renderWithProviders(<AppLayout />);

      // Project navigation should NOT be visible on app-level pages
      expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Project')).not.toBeInTheDocument();
    });

    it('should show project navigation when inside a project', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/projects/123/project-overview',
        state: null,
        key: 'default',
        search: '',
        hash: '',
      } as Location);
      mockUseParams.mockReturnValue({ projectId: '123' });

      renderWithProviders(<AppLayout />);

      // Project navigation should be visible
      expect(screen.getByText('Select Project')).toBeInTheDocument();
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
      // Basic users might have limited navigation items
    });

    it('should show project navigation for document pages', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/projects/123/documents',
        state: null,
        key: 'default',
        search: '',
        hash: '',
      } as Location);
      mockUseParams.mockReturnValue({ projectId: '123' });

      renderWithProviders(<AppLayout />);

      // Project navigation should be visible
      expect(screen.getByText('Select Project')).toBeInTheDocument();
      expect(screen.getByText('Project Documents')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Site Header Visibility', () => {
    it('should always show site header with logo', () => {
      mockUseApp.mockReturnValue(
        createMockUser('user', 'user123', 'user@example.com')
      );
      mockUseLocation.mockReturnValue({
        pathname: '/',
        state: null,
        key: 'default',
        search: '',
        hash: '',
      } as Location);
      mockUseParams.mockReturnValue({});

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
