import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import { UsersTable } from './UsersTable';
import type { User } from '@/types';
import type { Timestamp } from 'firebase/firestore';

// Mock the data table component
vi.mock('@/components/data-table/DataTable', () => ({
  DataTable: ({
    columns,
    data,
    tabs,
    onTabChange,
    actionButtons,
    bulkActionButtons,
  }: any) => (
    <div data-testid="data-table">
      {/* Render tabs */}
      {tabs && (
        <div role="tablist">
          {tabs.map((tab: any) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              data-testid={`tab-${tab.value}`}
              role="tab"
              aria-selected={tab.value === 'active'}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Render action buttons */}
      {actionButtons &&
        actionButtons.map((button: any, index: number) => (
          <button
            key={index}
            onClick={button.onClick}
            data-testid="action-button"
            aria-label={button.label}
          >
            {button.label}
          </button>
        ))}

      {/* Render bulk action buttons */}
      {bulkActionButtons &&
        bulkActionButtons.map((button: any, index: number) => (
          <button
            key={index}
            onClick={() => button.onClick([])}
            data-testid="bulk-action-button"
            aria-label={button.label}
          >
            {button.label}
          </button>
        ))}

      {/* Render column headers */}
      {columns &&
        columns.map((column: any, index: number) => {
          if (column.header && typeof column.header === 'function') {
            const Header = column.header;
            return (
              <div key={index}>
                <Header column={{ id: column.accessorKey }} />
              </div>
            );
          } else if (column.header) {
            return <div key={index}>{column.header}</div>;
          }
          return null;
        })}

      {/* Render selection checkbox */}
      <input
        type="checkbox"
        aria-label="Select all"
        data-testid="select-all-checkbox"
      />

      {/* Render data */}
      {data &&
        data.map((item: any, index: number) => (
          <div key={index} data-testid="data-row">
            {/* Render the actions column if it exists */}
            {columns &&
              columns.find((col: any) => col.id === 'actions') &&
              columns
                .find((col: any) => col.id === 'actions')
                .cell({ row: { original: item } })}
          </div>
        ))}
    </div>
  ),
}));

// Mock DataTableColumnHeader
vi.mock('@/components/data-table/DataTableColumnHeader', () => ({
  DataTableColumnHeader: ({ column, title }: any) => (
    <div data-testid={`column-header-${column.id}`}>{title}</div>
  ),
}));

// Mock createColumns
vi.mock('@/components/data-table/ColumnDef', () => ({
  createColumns: ({ columns, rowMenuItems }: any) => {
    // Add actions column with menu items
    return [
      ...columns,
      {
        id: 'actions',
        cell: () => (
          <div>
            <button aria-label="Open menu">Actions</button>
            {rowMenuItems &&
              rowMenuItems.map((item: any, index: number) => (
                <div key={index} style={{ display: 'none' }}>
                  {item.label}
                </div>
              ))}
          </div>
        ),
      },
    ];
  },
}));

describe('UsersTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnCreateNew = vi.fn();
  const mockOnConfirmAction = vi.fn();
  const mockOnTabChange = vi.fn();

  const defaultProps = {
    users: [],
    loading: false,
    activeTab: 'active' as const,
    onTabChange: mockOnTabChange,
    onEdit: mockOnEdit,
    onCreateNew: mockOnCreateNew,
    onConfirmAction: mockOnConfirmAction,
  };

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'john@example.com',
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
      createdAt: { seconds: 1234567890, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1234567890, nanoseconds: 0 } as Timestamp,
      isActive: true,
    },
    {
      id: '2',
      email: 'jane@example.com',
      displayName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'user',
      createdAt: { seconds: 1234567890, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1234567890, nanoseconds: 0 } as Timestamp,
      isActive: true,
    },
  ];

  it('should display table structure with translations', () => {
    render(<UsersTable {...defaultProps} users={mockUsers} />);

    // Column headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();

    // Tab labels
    expect(screen.getByRole('tab', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Inactive' })).toBeInTheDocument();

    // Add button
    expect(
      screen.getByRole('button', { name: /Add User/i })
    ).toBeInTheDocument();

    // Check that data rows are rendered
    const dataRows = screen.getAllByTestId('data-row');
    expect(dataRows).toHaveLength(2);
  });

  // Test different tab contexts using data-driven approach
  const tabContextTestCases = [
    {
      tab: 'active' as const,
      expectedBulkActions: [
        'Promote Selected to Admin',
        'Demote Selected to User',
        'Deactivate Selected',
      ],
    },
    {
      tab: 'inactive' as const,
      expectedBulkActions: [
        'Promote Selected to Admin',
        'Demote Selected to User',
        'Activate Selected',
      ],
    },
  ];

  tabContextTestCases.forEach(({ tab, expectedBulkActions }) => {
    it(`should show correct actions for ${tab} tab`, async () => {
      render(
        <UsersTable {...defaultProps} activeTab={tab} users={mockUsers} />
      );

      // Test that action menu button exists
      const actionButtons = screen.getAllByRole('button', {
        name: /open menu/i,
      });
      expect(actionButtons.length).toBeGreaterThan(0);

      // Test bulk actions (need to select rows first)
      const selectAllCheckbox = screen.getByRole('checkbox', {
        name: /select all/i,
      });
      await userEvent.click(selectAllCheckbox);

      expectedBulkActions.forEach((action) => {
        expect(
          screen.getByRole('button', { name: new RegExp(action, 'i') })
        ).toBeInTheDocument();
      });
    });
  });
});