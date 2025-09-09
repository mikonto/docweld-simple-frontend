// src/components/documents/multiple-sections/components/dialogs/DocumentSectionDialog.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { SectionDialog } from './SectionDialog';
import { renderWithProviders } from '@/test/utils/testUtils';

describe('SectionDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Add Mode', () => {
    it('should display correct title and form elements for add mode', () => {
      renderWithProviders(
        <SectionDialog
          mode="add"
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Add New Section')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('should show section-specific validation error for empty form', async () => {
      renderWithProviders(
        <SectionDialog
          mode="add"
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Add' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Section name is required')
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit section name for add mode', async () => {
      renderWithProviders(
        <SectionDialog
          mode="add"
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('Enter section name');
      fireEvent.change(input, { target: { value: 'New Section' } });

      const submitButton = screen.getByRole('button', { name: 'Add' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('New Section');
      });
    });
  });

  describe('Edit Mode', () => {
    const mockSection = {
      id: 'section-1',
      name: 'Existing Section',
    };

    it('should display correct title and pre-populate form for edit mode', () => {
      renderWithProviders(
        <SectionDialog
          mode="edit"
          section={mockSection}
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Edit Section')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Enter section name');
      expect(input.value).toBe('Existing Section');
    });

    it('should submit updated section name for edit mode', async () => {
      renderWithProviders(
        <SectionDialog
          mode="edit"
          section={mockSection}
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByPlaceholderText('Enter section name');
      fireEvent.change(input, { target: { value: 'Updated Section' } });

      const submitButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Updated Section');
      });
    });
  });

  it('should handle submission errors gracefully', async () => {
    const mockOnSubmitWithError = vi
      .fn()
      .mockRejectedValue(new Error('Submission failed'));
    renderWithProviders(
      <SectionDialog
        mode="add"
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmitWithError}
      />
    );

    const input = screen.getByPlaceholderText('Enter section name');
    fireEvent.change(input, { target: { value: 'Test Section' } });

    const submitButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmitWithError).toHaveBeenCalledWith('Test Section');
      // Error handling is done silently now - no console.error
    });
  });
});
