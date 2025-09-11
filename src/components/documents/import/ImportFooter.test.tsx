import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import ImportFooter from './ImportFooter';

describe('ImportFooter', () => {
  const mockOnClearSelection = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnSubmit = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with selected items count', () => {
    renderWithProviders(
      <ImportFooter
        selectedItems={[{ id: '1' } as any, { id: '2' } as any]}
        onClearSelection={mockOnClearSelection}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
      />
    );

    // Check for count in text
    expect(
      screen.getByText((content) => content.includes('2'))
    ).toBeInTheDocument();
    // Check for clear button
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('does not show selection count when no items selected', () => {
    renderWithProviders(
      <ImportFooter
        selectedItems={[]}
        onClearSelection={mockOnClearSelection}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
      />
    );

    // Should not find clear button when no items selected
    expect(
      screen.queryByRole('button', { name: /clear/i })
    ).not.toBeInTheDocument();
  });

  it('calls onClearSelection when clear button is clicked', () => {
    renderWithProviders(
      <ImportFooter
        selectedItems={[{ id: '1' } as any]}
        onClearSelection={mockOnClearSelection}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithProviders(
      <ImportFooter
        selectedItems={[]}
        onClearSelection={mockOnClearSelection}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onSubmit when import button is clicked with selected items', () => {
    renderWithProviders(
      <ImportFooter
        selectedItems={[{ id: '1' } as any]}
        onClearSelection={mockOnClearSelection}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
      />
    );

    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('disables import button when no items selected', () => {
    renderWithProviders(
      <ImportFooter
        selectedItems={[]}
        onClearSelection={mockOnClearSelection}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
      />
    );

    const importButton = screen.getByRole('button', { name: /import/i });
    expect(importButton).toBeDisabled();
  });

  it('enables import button when items are selected', () => {
    renderWithProviders(
      <ImportFooter
        selectedItems={[{ id: '1' } as any]}
        onClearSelection={mockOnClearSelection}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
      />
    );

    const importButton = screen.getByRole('button', { name: /import/i });
    expect(importButton).not.toBeDisabled();
  });
});