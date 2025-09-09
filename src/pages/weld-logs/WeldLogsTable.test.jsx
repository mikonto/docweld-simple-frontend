import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { WeldLogsTable } from './WeldLogsTable';

vi.mock('@/components/data-table/DataTable', () => ({
  DataTable: ({
    columns,
    data,
    actionButtons,
    bulkActionButtons,
    onRowClick,
  }) => (
    <div data-testid="data-table">
      {actionButtons?.map((button, idx) => (
        <button key={idx} onClick={button.onClick}>
          {button.label}
        </button>
      ))}
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header?.({ column: col })}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} onClick={() => onRowClick?.(row)}>
              {columns.map((col, colIdx) => (
                <td key={colIdx}>
                  {col.cell
                    ? col.cell({
                        row: {
                          getValue: () => row[col.accessorKey],
                          original: row,
                        },
                      })
                    : row[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {bulkActionButtons?.map((button, idx) => (
        <button
          key={idx}
          onClick={() => button.onClick([])}
          data-testid="bulk-delete-selected"
        >
          {button.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/components/data-table/DataTableColumnHeader', () => ({
  DataTableColumnHeader: ({ title }) => <span>{title}</span>,
}));

vi.mock('@/components/data-table/ColumnDef', () => ({
  createColumns: ({ columns, rowMenuItems }) => {
    const actionsColumn = rowMenuItems
      ? {
          id: 'actions',
          header: () => 'Actions',
          cell: ({ row }) => (
            <div>
              {(typeof rowMenuItems === 'function'
                ? rowMenuItems()
                : rowMenuItems || []
              ).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => item.action(row.original || row)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ),
        }
      : null;

    return [...columns, ...(actionsColumn ? [actionsColumn] : [])];
  },
}));

const renderWithI18n = (component) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('WeldLogsTable', () => {
  const mockWeldLogs = [
    { id: '1', name: 'WL-001', description: 'Main pipeline welds' },
    { id: '2', name: 'WL-002', description: 'Secondary connections' },
  ];

  const defaultProps = {
    weldLogs: mockWeldLogs,
    loading: false,
    onEdit: vi.fn(),
    onCreateNew: vi.fn(),
    onConfirmAction: vi.fn(),
    onRowClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Internationalization', () => {
    it('should display translated column headers', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should display translated action button', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      expect(screen.getByText('Add Weld Log')).toBeInTheDocument();
    });

    it('should display translated row action menu items', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');

      expect(editButtons).toHaveLength(mockWeldLogs.length);
      expect(deleteButtons).toHaveLength(mockWeldLogs.length);
    });

    it('should display translated bulk action button', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      expect(screen.getByTestId('bulk-delete-selected')).toHaveTextContent(
        'Delete Selected'
      );
    });
  });

  describe('Functionality', () => {
    it('should render weld log data', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      expect(screen.getByText('WL-001')).toBeInTheDocument();
      expect(screen.getByText('Main pipeline welds')).toBeInTheDocument();
      expect(screen.getByText('WL-002')).toBeInTheDocument();
      expect(screen.getByText('Secondary connections')).toBeInTheDocument();
    });

    it('should call onCreateNew when add button is clicked', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Weld Log'));
      expect(defaultProps.onCreateNew).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when edit action is clicked', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockWeldLogs[0]);
    });

    it('should call onConfirmAction when delete action is clicked', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(defaultProps.onConfirmAction).toHaveBeenCalledWith(
        'delete',
        mockWeldLogs[0]
      );
    });

    it('should call onConfirmAction for bulk delete', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      fireEvent.click(screen.getByTestId('bulk-delete-selected'));

      expect(defaultProps.onConfirmAction).toHaveBeenCalledWith(
        'delete',
        [],
        true
      );
    });

    it('should call onRowClick when row is clicked', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} />);

      fireEvent.click(screen.getByText('WL-001'));
      expect(defaultProps.onRowClick).toHaveBeenCalledWith(mockWeldLogs[0]);
    });

    it('should handle loading state', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} loading={true} />);

      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    it('should handle empty data', () => {
      renderWithI18n(<WeldLogsTable {...defaultProps} weldLogs={[]} />);

      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.queryByText('WL-001')).not.toBeInTheDocument();
    });
  });
});
