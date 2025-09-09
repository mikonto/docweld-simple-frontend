import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MaterialsTable } from './MaterialsTable';
import { renderWithProviders } from '@/test/utils/testUtils';

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
        <div>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              data-testid={`tab-${tab.value}`}
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
          }
          return null;
        })}

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
    <span data-testid={`column-header-${column.id}`}>{title}</span>
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
        cell: ({ row }) => (
          <div>
            {rowMenuItems &&
              rowMenuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => item.action(row.original)}
                  data-testid={`action-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </button>
              ))}
          </div>
        ),
      },
    ];
  },
}));

describe('MaterialsTable', () => {
  const mockMaterials = [
    {
      id: '1',
      type: 'Pipe',
      dimensions: '100x50',
      thickness: '5mm',
      alloyMaterial: 'Steel',
      name: 'Test Material',
    },
  ];

  const defaultProps = {
    materials: mockMaterials,
    loading: false,
    activeTab: 'parent',
    onTabChange: vi.fn(),
    onEdit: vi.fn(),
    onCreateNew: vi.fn(),
    onConfirmAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display material type tabs and handle navigation', () => {
    renderWithProviders(<MaterialsTable {...defaultProps} />);

    // Verify all tabs are present with correct labels
    expect(screen.getByTestId('tab-parent')).toHaveTextContent(
      'Parent Material'
    );
    expect(screen.getByTestId('tab-filler')).toHaveTextContent(
      'Filler Materials'
    );
    expect(screen.getByTestId('tab-alloy')).toHaveTextContent(
      'Alloy Materials'
    );

    // Test tab navigation
    fireEvent.click(screen.getByTestId('tab-filler'));
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('filler');
  });

  // Test different tab configurations using data-driven approach
  const tabTestCases = [
    {
      tab: 'parent',
      expectedColumns: ['Type', 'Dimensions', 'Thickness', 'Alloy Material'],
      expectedButton: 'Add Parent Material',
    },
    {
      tab: 'filler',
      expectedColumns: ['Filler Material'],
      expectedButton: 'Add Filler Material',
    },
    {
      tab: 'alloy',
      expectedColumns: ['Alloy Material'],
      expectedButton: 'Add Alloy Material',
    },
  ];

  tabTestCases.forEach(({ tab, expectedColumns, expectedButton }) => {
    it(`should display correct content for ${tab} material tab`, () => {
      renderWithProviders(<MaterialsTable {...defaultProps} activeTab={tab} />);

      // Check column headers
      expectedColumns.forEach((column) => {
        const columnKey =
          column === 'Filler Material'
            ? 'name'
            : column === 'Alloy Material'
              ? tab === 'parent'
                ? 'alloyMaterial'
                : 'name'
              : column.toLowerCase().replace(' ', '');
        expect(
          screen.getByTestId(`column-header-${columnKey}`)
        ).toHaveTextContent(column);
      });

      // Check action button
      expect(screen.getByTestId('action-button')).toHaveTextContent(
        expectedButton
      );
    });
  });

  it('should handle row actions and bulk operations', () => {
    renderWithProviders(<MaterialsTable {...defaultProps} />);

    // Test row actions
    expect(screen.getByTestId('action-edit')).toHaveTextContent('Edit');
    expect(screen.getByTestId('action-delete')).toHaveTextContent('Delete');

    // Test edit action
    fireEvent.click(screen.getByTestId('action-edit'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockMaterials[0]);

    // Test delete action
    fireEvent.click(screen.getByTestId('action-delete'));
    expect(defaultProps.onConfirmAction).toHaveBeenCalledWith(
      'delete',
      mockMaterials[0]
    );

    // Test bulk delete
    const bulkDeleteButton = screen.getByTestId('bulk-action-button');
    expect(bulkDeleteButton).toHaveTextContent('Delete Selected');

    fireEvent.click(bulkDeleteButton);
    expect(defaultProps.onConfirmAction).toHaveBeenCalledWith(
      'delete',
      [],
      true
    );
  });

  it('should handle create new material action', () => {
    renderWithProviders(<MaterialsTable {...defaultProps} />);

    fireEvent.click(screen.getByTestId('action-button'));
    expect(defaultProps.onCreateNew).toHaveBeenCalled();
  });
});
