import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { FirestoreError } from 'firebase/firestore';
import UserManagement from './index';
import { renderWithProviders } from '@/test/utils/testUtils';
import {
  useUsers,
  useUserOperations,
  type UserWithName,
} from '@/hooks/useUsers';
import { createMockTimestamp } from '@/test/utils/mockTimestamp';

// Mock hooks
vi.mock('@/hooks/useUsers');
vi.mock('@/hooks/useFormDialog', () => ({
  useFormDialog: () => ({
    isOpen: false,
    entity: null,
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('@/hooks/useConfirmationDialog', () => ({
  useConfirmationDialog: () => ({
    dialog: { isOpen: false, type: null, isBulk: false, data: null },
    open: vi.fn(),
    close: vi.fn(),
    handleConfirm: vi.fn(),
  }),
}));

vi.mock('@/utils/confirmationContent', () => ({
  getConfirmationContent: () => ({
    title: 'Promote User',
    description: 'Are you sure?',
    actionLabel: 'Promote',
    actionVariant: 'default' as const,
  }),
}));

// Mock child components
vi.mock('./UserFormDialog', () => ({
  UserFormDialog: () => <div data-testid="user-form-dialog" />,
}));

vi.mock('./UsersTable', () => ({
  UsersTable: ({
    users,
    activeTab,
    onTabChange,
    onCreateNew,
  }: {
    users: unknown[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    onCreateNew: () => void;
  }) => (
    <div data-testid="users-table">
      <div>Active Tab: {activeTab}</div>
      <div>Users Count: {users.length}</div>
      <button onClick={() => onTabChange('inactive')}>
        Switch to Inactive
      </button>
      <button onClick={onCreateNew}>Add User</button>
    </div>
  ),
}));

describe('UserManagement', () => {
  const mockTimestamp = createMockTimestamp();
  const mockUsers: UserWithName[] = [
    {
      id: '1',
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    },
    {
      id: '2',
      displayName: 'Jane Admin',
      firstName: 'Jane',
      lastName: 'Admin',
      name: 'Jane Admin',
      email: 'jane@example.com',
      role: 'admin',
      status: 'active',
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    },
  ];

  const mockUserOperations = {
    createUser: vi.fn(),
    updateUser: vi.fn(),
    promoteToAdmin: vi.fn(),
    demoteToUser: vi.fn(),
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserOperations).mockReturnValue(mockUserOperations);
  });

  // Basic rendering and data flow
  it('should display page title and users table', () => {
    vi.mocked(useUsers).mockReturnValue([mockUsers, false, undefined]);

    renderWithProviders(<UserManagement />);

    expect(
      screen.getByRole('heading', { name: 'User Management' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('users-table')).toBeInTheDocument();
    expect(screen.getByText('Users Count: 2')).toBeInTheDocument();
  });

  // Loading state
  it('should show loading state', () => {
    vi.mocked(useUsers).mockReturnValue([[], true, undefined]);

    renderWithProviders(<UserManagement />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Error state
  it('should display error when loading fails', () => {
    const firestoreError: FirestoreError = {
      code: 'permission-denied',
      message: 'Failed to load users',
      name: 'FirestoreError',
    };
    vi.mocked(useUsers).mockReturnValue([[], false, firestoreError]);

    renderWithProviders(<UserManagement />);

    expect(
      screen.getByText(/Error loading user management/i)
    ).toBeInTheDocument();
  });

  // Basic user interactions
  it('should handle tab switching', () => {
    vi.mocked(useUsers).mockReturnValue([mockUsers, false, undefined]);

    renderWithProviders(<UserManagement />);

    fireEvent.click(screen.getByText('Switch to Inactive'));
    expect(screen.getByText('Active Tab: inactive')).toBeInTheDocument();
  });

  it('should handle add user action', () => {
    vi.mocked(useUsers).mockReturnValue([mockUsers, false, undefined]);

    renderWithProviders(<UserManagement />);

    fireEvent.click(screen.getByText('Add User'));
    // Action triggers through mocked CRUD operations
  });
});
