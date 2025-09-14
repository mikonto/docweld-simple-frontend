import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { SectionDialog } from './SectionDialog';
import { renderWithProviders } from '@/test/utils/testUtils';
import type { Section } from '@/types/database';
import type { Timestamp } from 'firebase/firestore';

describe('SectionDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const mockSection: Section = {
    id: 'section-1',
    name: 'Test Section',
    description: 'Test description',
    status: 'active',
    order: 1,
    createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
    updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
    createdBy: 'user1',
    updatedBy: 'user1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with add mode', () => {
    renderWithProviders(
      <SectionDialog
        mode="add"
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Add Section')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('should render with edit mode', () => {
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
  });

  it('should populate form with section name when editing', () => {
    renderWithProviders(
      <SectionDialog
        mode="edit"
        section={mockSection}
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByDisplayValue('Test Section')).toBeInTheDocument();
  });

  it('should show validation error when form is submitted with empty name', async () => {
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
      expect(screen.getByText('Section name is required')).toBeInTheDocument();
    });
  });

  it('should call onSubmit with section name when form is submitted', async () => {
    renderWithProviders(
      <SectionDialog
        mode="add"
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const input = screen.getByLabelText('Section Name');
    fireEvent.change(input, { target: { value: 'New Section' } });

    const submitButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('New Section');
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    renderWithProviders(
      <SectionDialog
        mode="add"
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
