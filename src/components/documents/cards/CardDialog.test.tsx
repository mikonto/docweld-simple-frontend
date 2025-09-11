import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CardDialog } from './CardDialog';
import { renderWithProviders } from '@/test/utils/testUtils';

describe('CardDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with custom dialog title', () => {
    renderWithProviders(
      <CardDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        dialogTitle="Custom Title"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should populate form with document title when document is provided', () => {
    const document = { id: '1', title: 'Test Document' };

    renderWithProviders(
      <CardDialog
        document={document}
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument();
  });

  it('should populate form with title prop when provided', () => {
    renderWithProviders(
      <CardDialog
        title="Initial Title"
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
  });

  it('should show document-specific validation error when form is submitted with empty title', async () => {
    renderWithProviders(
      <CardDialog open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Document title is required')
      ).toBeInTheDocument();
    });
  });

  it('should call onSubmit with document title when form is submitted', async () => {
    renderWithProviders(
      <CardDialog open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const input = screen.getByLabelText('Document Title');
    fireEvent.change(input, { target: { value: 'New Document Title' } });

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('New Document Title');
    });
  });

  it('should disable Save Changes button while submitting', async () => {
    const slowSubmit = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

    renderWithProviders(
      <CardDialog open={true} onClose={mockOnClose} onSubmit={slowSubmit} />
    );

    const input = screen.getByLabelText('Document Title');
    fireEvent.change(input, { target: { value: 'New Title' } });

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });
});