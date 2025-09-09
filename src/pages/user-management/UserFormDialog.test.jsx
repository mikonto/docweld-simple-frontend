import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import { UserFormDialog } from './UserFormDialog';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UserFormDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  };

  const mockUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test form modes using data-driven approach
  const formModeTestCases = [
    {
      mode: 'create',
      props: defaultProps,
      expectedTitle: 'Add User',
      expectedButton: 'Add',
      showsEmailMessage: false,
    },
    {
      mode: 'edit',
      props: { ...defaultProps, user: mockUser },
      expectedTitle: 'Edit User',
      expectedButton: 'Save Changes',
      showsEmailMessage: true,
    },
  ];

  formModeTestCases.forEach(
    ({ mode, props, expectedTitle, expectedButton, showsEmailMessage }) => {
      it(`should render ${mode} form correctly with translations`, () => {
        render(<UserFormDialog {...props} />);

        // Test form title and button
        expect(
          screen.getByRole('heading', { name: expectedTitle })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: expectedButton })
        ).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();

        // Test email change message for edit mode
        if (showsEmailMessage) {
          expect(
            screen.getByText(
              'Email addresses cannot be changed. If needed, please create a new user account with the new email address'
            )
          ).toBeInTheDocument();
        }
      });
    }
  );

  it('should display all form fields with proper labels and placeholders', () => {
    render(<UserFormDialog {...defaultProps} />);

    // Form labels
    const expectedLabels = [
      'First Name',
      'Last Name',
      'Email',
      'Password',
      'Grant admin privileges',
    ];
    expectedLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    // Form placeholders
    const expectedPlaceholders = [
      'Enter first name',
      'Enter last name',
      'Enter email address',
      'Enter password',
    ];
    expectedPlaceholders.forEach((placeholder) => {
      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    });
  });

  it('should handle form interactions and validation', async () => {
    const user = userEvent.setup();
    render(<UserFormDialog {...defaultProps} />);

    // Test cancel functionality
    await user.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);

    // Test validation errors
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const expectedErrors = [
      'First name is required',
      'Last name is required',
      'Invalid email address',
      'Password must be at least 6 characters',
    ];

    for (const error of expectedErrors) {
      expect(await screen.findByText(error)).toBeInTheDocument();
    }
  });
});
