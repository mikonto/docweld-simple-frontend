import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, act, waitFor } from '@/test/utils/testUtils';
import { DataTable } from './DataTable';

// Sample test data
const mockData = [
  { id: 1, name: 'Project Alpha', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: 'Project Beta', status: 'archived', createdAt: '2024-01-02' },
  { id: 3, name: 'Project Gamma', status: 'active', createdAt: '2024-01-03' },
];

// Sample columns configuration
const mockColumns = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        aria-label={`Select row ${row.index + 1}`}
      />
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
  },
];

describe('DataTable Component', () => {
  it('should render table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    // Check if column headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created At')).toBeInTheDocument();

    // Check if data rows are rendered
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
    expect(screen.getByText('Project Gamma')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    render(<DataTable data={[]} columns={mockColumns} />);
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(<DataTable data={[]} columns={mockColumns} isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });

  it('should display error state', () => {
    const error = { message: 'Failed to load data' };
    render(<DataTable data={[]} columns={mockColumns} error={error} />);
    expect(screen.getByText('Error loading table data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('should handle row click callback', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onRowClick={onRowClick}
      />
    );

    await user.click(screen.getByText('Project Alpha'));

    expect(onRowClick).toHaveBeenCalledWith({
      id: 1,
      name: 'Project Alpha',
      status: 'active',
      createdAt: '2024-01-01',
    });
  });

  it('should display and handle action buttons', async () => {
    const user = userEvent.setup();
    const mockActionClick = vi.fn();
    const mockActionButtons = [
      {
        label: 'Add New',
        onClick: mockActionClick,
        variant: 'default',
      },
    ];

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        actionButtons={mockActionButtons}
      />
    );

    const addButton = screen.getByText('Add New');
    expect(addButton).toBeInTheDocument();

    await user.click(addButton);
    expect(mockActionClick).toHaveBeenCalled();
  });

  it('should display and handle bulk action buttons when rows are selected', async () => {
    const user = userEvent.setup();
    const mockBulkAction = vi.fn();
    const mockBulkActionButtons = [
      {
        label: 'Delete Selected',
        onClick: mockBulkAction,
        variant: 'destructive',
      },
    ];

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        bulkActionButtons={mockBulkActionButtons}
      />
    );

    // Initially, bulk actions should not be visible
    expect(screen.queryByText('Delete Selected')).not.toBeInTheDocument();

    // Select a row using checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // First row checkbox

    // Now bulk action should be visible
    const deleteButton = screen.getByText('Delete Selected');
    expect(deleteButton).toBeInTheDocument();

    // Click bulk action
    await user.click(deleteButton);
    expect(mockBulkAction).toHaveBeenCalledWith([mockData[0]]);
  });

  it('should filter data based on search input', async () => {
    const user = userEvent.setup();
    render(<DataTable data={mockData} columns={mockColumns} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    await act(async () => {
      await user.type(searchInput, 'Alpha');
    });

    // Wait for filtering to apply
    await waitFor(
      () => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
        expect(screen.queryByText('Project Gamma')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should show pagination with large datasets', () => {
    // Create more data to trigger pagination
    const largeData = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Project ${i + 1}`,
      status: i % 2 === 0 ? 'active' : 'archived',
      createdAt: `2024-01-${String(i + 1).padStart(2, '0')}`,
    }));

    render(<DataTable data={largeData} columns={mockColumns} />);

    // Should show pagination info and limited results
    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.queryByText('Project 15')).not.toBeInTheDocument();
  });
});
