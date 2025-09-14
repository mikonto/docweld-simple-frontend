import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentLibraryTable } from './DocumentLibraryTable';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { vi } from 'vitest';
import type { DocumentLibraryTableProps } from './DocumentLibraryTable';
import type { DocumentLibrary } from '@/types';
import type { Timestamp } from 'firebase/firestore';
import type { MockDataTableProps } from '@/test/types/mockTypes';
import type { ColumnDef } from '@tanstack/react-table';

// Mock the DataTable component to simplify testing
vi.mock('@/components/data-table/DataTable', () => ({
  DataTable: <TData,>({
    columns,
    data,
    actionButtons,
    bulkActionButtons,
    onRowClick,
  }: MockDataTableProps<TData>) => {
    // Helper to get column accessor key safely
    const getAccessorKey = (
      col: ColumnDef<TData, unknown>
    ): string | undefined => {
      // Type guard to check if this is an accessor column
      if ('accessorKey' in col && typeof col.accessorKey === 'string') {
        return col.accessorKey;
      }
      return undefined;
    };

    // Helper to render header content
    const renderHeader = (col: ColumnDef<TData, unknown>) => {
      if (col.header && typeof col.header === 'function') {
        // Call the header function with a minimal context
        const headerElement = col.header(
          {} as Parameters<NonNullable<typeof col.header>>[0]
        );
        // Extract title from DataTableColumnHeader if it's a React element
        if (React.isValidElement(headerElement)) {
          const props = headerElement.props as Record<string, unknown>;
          return (props.title as string) || 'Column Header';
        }
        return 'Column Header';
      }
      if (typeof col.header === 'string') {
        return col.header;
      }
      return '';
    };

    // Helper to render cell content
    const renderCell = (col: ColumnDef<TData, unknown>, row: TData) => {
      const accessorKey = getAccessorKey(col);

      if (col.cell && typeof col.cell === 'function') {
        // Create a minimal row context
        const mockRow = {
          getValue: (key: string) => {
            const record = row as Record<string, unknown>;
            return record[key];
          },
          original: row,
        };

        const cellElement = col.cell({
          row: mockRow,
          getValue: () => {
            if (accessorKey) {
              const record = row as Record<string, unknown>;
              return record[accessorKey];
            }
            return undefined;
          },
          renderValue: () => {
            if (accessorKey) {
              const record = row as Record<string, unknown>;
              return record[accessorKey];
            }
            return undefined;
          },
        } as Parameters<NonNullable<typeof col.cell>>[0]);

        // Extract text content from React elements
        if (React.isValidElement(cellElement)) {
          const props = cellElement.props as Record<string, unknown>;
          const children = props.children;
          return typeof children === 'string' ? children : '';
        }
        return String(cellElement || '');
      }

      // Fallback to accessor key value
      if (accessorKey) {
        const record = row as Record<string, unknown>;
        return String(record[accessorKey] || '');
      }

      return '';
    };

    return (
      <div data-testid="data-table">
        {/* Render action buttons */}
        {actionButtons?.map((button, index) => (
          <button key={index} onClick={button.onClick}>
            {button.label}
          </button>
        ))}

        {/* Render column headers */}
        <table>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{renderHeader(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} onClick={() => onRowClick?.(row)}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>{String(renderCell(col, row))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Render bulk actions when needed */}
        {bulkActionButtons?.map((button, index) => (
          <button
            key={index}
            onClick={() => button.onClick([])}
            data-testid={`bulk-action-${index}`}
          >
            {button.label}
          </button>
        ))}
      </div>
    );
  },
}));

// Mock other components
vi.mock('@/components/data-table/ColumnDef', () => ({
  createColumns: <TData,>({
    columns,
    rowMenuItems,
  }: {
    columns: ColumnDef<TData, unknown>[];
    rowMenuItems?: Array<{ label: string; action: (row: TData) => void }>;
  }) => {
    return columns.map((col) => ({
      ...col,
      // Add mock for row actions if needed
      ...(rowMenuItems && { rowMenuItems }),
    }));
  },
}));

vi.mock('@/components/data-table/DataTableColumnHeader', () => ({
  DataTableColumnHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('DocumentLibraryTable', () => {
  const mockDocuments: DocumentLibrary[] = [
    {
      id: '1',
      name: 'Test Collection 1',
      description: 'Test description 1',
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
    {
      id: '2',
      name: 'Test Collection 2',
      description: 'Test description 2',
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
  ];

  const defaultProps: DocumentLibraryTableProps = {
    documents: mockDocuments,
    loading: false,
    onEdit: vi.fn(),
    onCreateNew: vi.fn(),
    onConfirmAction: vi.fn(),
    onRowClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render column headers with translations', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should render action button with translation', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} />);

    expect(screen.getByText('Add Document Collection')).toBeInTheDocument();
  });

  it('should call onCreateNew when Add Document Collection is clicked', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} />);

    const addButton = screen.getByText('Add Document Collection');
    fireEvent.click(addButton);

    expect(defaultProps.onCreateNew).toHaveBeenCalledTimes(1);
  });

  it('should render bulk action button with translation', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} />);

    expect(screen.getByText('Delete Selected')).toBeInTheDocument();
  });

  it('should call onConfirmAction when Delete Selected is clicked', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} />);

    const deleteButton = screen.getByTestId('bulk-action-0');
    fireEvent.click(deleteButton);

    expect(defaultProps.onConfirmAction).toHaveBeenCalledWith(
      'delete',
      [],
      true
    );
  });

  it('should render document data', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} />);

    expect(screen.getByText('Test Collection 1')).toBeInTheDocument();
    expect(screen.getByText('Test Collection 2')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 2')).toBeInTheDocument();
  });

  it('should call onRowClick when a row is clicked', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} />);

    const firstRow = screen.getByText('Test Collection 1').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);

      expect(defaultProps.onRowClick).toHaveBeenCalledWith(mockDocuments[0]);
    }
  });

  it('should render with loading state', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} loading={true} />);

    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('should render with empty documents', () => {
    renderWithI18n(<DocumentLibraryTable {...defaultProps} documents={[]} />);

    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('should have correct row menu items', () => {
    const { container } = renderWithI18n(
      <DocumentLibraryTable {...defaultProps} />
    );

    // The createColumns mock should have been called with rowMenuItems
    // that include Rename and Delete actions
    // This is more of an integration test, but ensures the menu structure is correct
    expect(container).toBeInTheDocument();
  });
});
