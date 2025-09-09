import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { DocumentFormDialog } from './DocumentFormDialog';

// Mock sonner toast (no longer used in this component)

describe('DocumentFormDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
    document: null,
  };

  const mockDocument = {
    id: '1',
    name: 'Test Collection',
    description: 'Test description',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test form modes using data-driven approach
  const formModeTestCases = [
    {
      mode: 'create',
      props: defaultProps,
      expectedTitle: 'Add Document Collection',
      expectedButton: 'Add',
    },
    {
      mode: 'edit',
      props: { ...defaultProps, document: mockDocument },
      expectedTitle: 'Edit Collection',
      expectedButton: 'Save Changes',
    },
  ];

  formModeTestCases.forEach(
    ({ mode, props, expectedTitle, expectedButton }) => {
      it(`should render ${mode} form correctly with translations`, () => {
        renderWithProviders(<DocumentFormDialog {...props} />);

        expect(
          screen.getByRole('heading', { name: expectedTitle })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: expectedButton })
        ).toBeInTheDocument();
      });
    }
  );

  it('should display form fields with proper labels and placeholders', () => {
    renderWithProviders(<DocumentFormDialog {...defaultProps} />);

    // Form labels
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();

    // Form placeholders
    expect(
      screen.getByPlaceholderText('Enter collection name')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter description')
    ).toBeInTheDocument();
  });

  it('should populate form fields when editing', () => {
    renderWithProviders(
      <DocumentFormDialog {...defaultProps} document={mockDocument} />
    );

    expect(screen.getByDisplayValue('Test Collection')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('should handle form validation and submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DocumentFormDialog {...defaultProps} />);

    // Test validation error
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    // Test successful submission
    mockOnSubmit.mockResolvedValueOnce();
    const nameInput = screen.getByPlaceholderText('Enter collection name');
    await user.type(nameInput, 'New Collection');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Collection',
        description: '',
      });
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should handle dialog interactions and errors', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DocumentFormDialog {...defaultProps} />);

    // Test cancel functionality
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);

    // Test error handling
    mockOnSubmit.mockRejectedValueOnce(new Error('API Error'));
    const nameInput = screen.getByPlaceholderText('Enter collection name');
    await user.type(nameInput, 'New Collection');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    // Error is handled silently now - no console output
    await waitFor(() => {
      // Form should still be open after error
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
