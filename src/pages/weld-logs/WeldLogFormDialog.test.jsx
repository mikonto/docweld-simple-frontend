import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import { WeldLogFormDialog } from './WeldLogFormDialog';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WeldLogFormDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  };

  const mockWeldLog = {
    id: '1',
    name: 'WL-001',
    description: 'Test weld log',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test form modes using data-driven approach
  const formModeTestCases = [
    {
      mode: 'create',
      props: defaultProps,
      expectedTitle: 'Add Weld Log',
      expectedButton: 'Add',
    },
    {
      mode: 'edit',
      props: { ...defaultProps, weldLog: mockWeldLog },
      expectedTitle: 'Edit Weld Log',
      expectedButton: 'Save Changes',
    },
  ];

  formModeTestCases.forEach(
    ({ mode, props, expectedTitle, expectedButton }) => {
      it(`should render ${mode} form correctly with translations`, () => {
        render(<WeldLogFormDialog {...props} />);

        expect(
          screen.getByRole('heading', { name: expectedTitle })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: expectedButton })
        ).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    }
  );

  it('should display form fields with proper labels and placeholders', () => {
    render(<WeldLogFormDialog {...defaultProps} />);

    // Form labels
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();

    // Form placeholders
    expect(
      screen.getByPlaceholderText('Enter weld log name')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter description')
    ).toBeInTheDocument();
  });

  it('should handle form interactions and validation', async () => {
    const user = userEvent.setup();
    render(<WeldLogFormDialog {...defaultProps} />);

    // Test cancel functionality
    await user.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);

    // Test validation errors
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });
});
