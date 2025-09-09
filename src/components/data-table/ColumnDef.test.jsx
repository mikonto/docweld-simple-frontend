import React from 'react';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createColumns } from './ColumnDef';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

const renderWithI18n = (component) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

// Mock component that renders the actions column
const ActionsColumnRenderer = ({ columns }) => {
  const actionsColumn = columns.find((col) => col.id === 'actions');
  if (!actionsColumn) return null;

  // Simulate a row with minimal data
  const row = { original: { id: 1 } };
  return <>{actionsColumn.cell({ row })}</>;
};

describe('createColumns', () => {
  it('should not show Actions label in dropdown menu', async () => {
    const user = userEvent.setup();

    const columns = createColumns({
      enableRowActions: true,
      rowMenuItems: [
        { label: 'Edit', action: vi.fn() },
        { label: 'Delete', action: vi.fn() },
      ],
      columns: [],
    });

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
