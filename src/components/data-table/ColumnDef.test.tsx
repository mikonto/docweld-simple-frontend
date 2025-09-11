import React from 'react';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createColumns, CreateColumnsOptions } from './ColumnDef';
import { RowMenuItem } from './ActionsCell';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { ColumnDef, Row } from '@tanstack/react-table';

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

interface TestData {
  id: number;
}

interface ActionsColumnRendererProps {
  columns: ColumnDef<TestData, any>[];
}

// Mock component that renders the actions column
const ActionsColumnRenderer: React.FC<ActionsColumnRendererProps> = ({ columns }) => {
  const actionsColumn = columns.find((col) => col.id === 'actions');
  if (!actionsColumn) return null;

  // Simulate a row with minimal data
  const row = { original: { id: 1 } } as Row<TestData>;
  const cellProps = { row } as any;
  return <>{typeof actionsColumn.cell === 'function' ? actionsColumn.cell(cellProps) : null}</>;
};

describe('createColumns', () => {
  it('should not show Actions label in dropdown menu', async () => {
    const user = userEvent.setup();

    const rowMenuItems: RowMenuItem<TestData>[] = [
      { label: 'Edit', action: vi.fn() },
      { label: 'Delete', action: vi.fn() },
    ];

    const options: CreateColumnsOptions<TestData> = {
      enableRowActions: true,
      rowMenuItems,
      columns: [],
    };

    const columns = createColumns(options);

    renderWithI18n(<ActionsColumnRenderer columns={columns} />);

    // Click the actions button to open dropdown
    const actionsButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(actionsButton);

    // The Actions label should no longer be visible
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    // But the menu items should still be visible
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});