import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UserManagement from './index';
import { renderWithProviders } from '@/test/utils/testUtils';
import { useUsers, useUserOperations } from '@/hooks/useUsers';

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
    actionVariant: 'default',
  }),
}));

// Mock child components
vi.mock('./UserFormDialog', () => ({
  UserFormDialog: () => <div data-testid="user-form-dialog" />,
}));

vi.mock('./UsersTable', () => ({
  UsersTable: ({ users, activeTab, onTabChange, onCreateNew }) => (
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
  const mockUsers = [
    { id: '1', name: 'John Doe', role: 'User', active: true },
    { id: '2', name: 'Jane Admin', role: 'Administrator', active: true },
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
    useUserOperations.mockReturnValue(mockUserOperations);
  });

  // Basic rendering and data flow
  it('should display page title and users table', () => {
    useUsers.mockReturnValue([mockUsers, false, null]);

    renderWithProviders(<UserManagement />);

    expect(
      screen.getByRole('heading', { name: 'User Management' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('users-table')).toBeInTheDocument();
    expect(screen.getByText('Users Count: 2')).toBeInTheDocument();
  });

  // Loading state
  it('should show loading state', () => {
    useUsers.mockReturnValue([[], true, null]);

    renderWithProviders(<UserManagement />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Error state
  it('should display error when loading fails', () => {
    useUsers.mockReturnValue([[], false, new Error('Failed to load users')]);

    renderWithProviders(<UserManagement />);

    expect(
      screen.getByText(/Error loading user management/i)
    ).toBeInTheDocument();
  });

  // Basic user interactions
  it('should handle tab switching', () => {
    useUsers.mockReturnValue([mockUsers, false, null]);

    renderWithProviders(<UserManagement />);

    fireEvent.click(screen.getByText('Switch to Inactive'));
    expect(screen.getByText('Active Tab: inactive')).toBeInTheDocument();
  });

  it('should handle add user action', () => {
    useUsers.mockReturnValue([mockUsers, false, null]);

    renderWithProviders(<UserManagement />);

    fireEvent.click(screen.getByText('Add User'));
    // Action triggers through mocked CRUD operations
  });
});
