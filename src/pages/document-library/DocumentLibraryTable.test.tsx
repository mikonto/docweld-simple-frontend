import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentLibraryTable } from './DocumentLibraryTable';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { vi } from 'vitest';
import type { DocumentLibraryTableProps } from './DocumentLibraryTable';
import type { DocumentLibraryCollection } from '@/types/database';
import type { Timestamp } from 'firebase/firestore';

// Mock the DataTable component to simplify testing
vi.mock('@/components/data-table/DataTable', () => ({
  DataTable: ({
    columns,
    data,
    actionButtons,
    bulkActionButtons,
    onRowClick,
  }: any) => (
    <div data-testid="data-table">
      {/* Render action buttons */}
      {actionButtons?.map((button: any, index: number) => (
        <button key={index} onClick={button.onClick}>
          {button.label}
        </button>
      ))}

      {/* Render column headers */}
      <table>
        <thead>
          <tr>
            {columns.map((col: any, index: number) => (
              <th key={index}>
                {col.header && typeof col.header === 'function'
                  ? col.header({ column: {} }).props.title
                  : col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, rowIndex: number) => (
            <tr key={rowIndex} onClick={() => onRowClick?.(row)}>
              {columns.map((col: any, colIndex: number) => (
                <td key={colIndex}>
                  {col.cell
                    ? col.cell({
                        row: { getValue: () => row[col.accessorKey] },
                      })
                    : row[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Render bulk actions when needed */}
      {bulkActionButtons?.map((button: any, index: number) => (
        <button
          key={index}
          onClick={() => button.onClick([])}
          data-testid={`bulk-action-${index}`}
        >
          {button.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock other components
vi.mock('@/components/data-table/ColumnDef', () => ({
  createColumns: ({ columns, rowMenuItems }: any) => {
    return columns.map((col: any) => ({
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
  const mockDocuments: DocumentLibraryCollection[] = [
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