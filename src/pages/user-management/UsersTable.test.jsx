import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import { UsersTable } from './UsersTable';

// Mock the data table component
vi.mock('@/components/data-table/DataTable', () => ({
  DataTable: ({
    columns,
    data,
    tabs,
    onTabChange,
    actionButtons,
    bulkActionButtons,
  }) => (
    <div data-testid="data-table">
      {/* Render tabs */}
      {tabs && (
        <div role="tablist">
          {tabs.map((tab) => (
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
        actionButtons.map((button, index) => (
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
        bulkActionButtons.map((button, index) => (
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
        columns.map((column, index) => {
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
        data.map((item, index) => (
          <div key={index} data-testid="data-row">
            {/* Render the actions column if it exists */}
            {columns &&
              columns.find((col) => col.id === 'actions') &&
              columns
                .find((col) => col.id === 'actions')
                .cell({ row: { original: item } })}
          </div>
        ))}
    </div>
  ),
}));

// Mock DataTableColumnHeader
vi.mock('@/components/data-table/DataTableColumnHeader', () => ({
  DataTableColumnHeader: ({ column, title }) => (
    <div data-testid={`column-header-${column.id}`}>{title}</div>
  ),
}));

// Mock createColumns
vi.mock('@/components/data-table/ColumnDef', () => ({
  createColumns: ({ columns, rowMenuItems }) => {
    // Add actions column with menu items
    return [
      ...columns,
      {
        id: 'actions',
        cell: () => (
          <div>
            <button aria-label="Open menu">Actions</button>
            {rowMenuItems &&
              rowMenuItems.map((item, index) => (
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
    activeTab: 'active',
    onTabChange: mockOnTabChange,
    onEdit: mockOnEdit,
    onCreateNew: mockOnCreateNew,
    onConfirmAction: mockOnConfirmAction,
  };

  const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'user',
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
      tab: 'active',
      expectedBulkActions: [
        'Promote Selected to Admin',
        'Demote Selected to User',
        'Deactivate Selected',
      ],
    },
    {
      tab: 'inactive',
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
