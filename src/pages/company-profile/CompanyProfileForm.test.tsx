import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { CompanyProfileForm } from './CompanyProfileForm';
import type { CompanyProfileFormProps } from './CompanyProfileForm';
import type { CompanyInformation } from '@/hooks/useCompanyInformation';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Upload: () => <span>Upload Icon</span>,
}));

describe('CompanyProfileForm', () => {
  const mockOnSubmit = vi.fn();
  const mockHandleLogoChange = vi.fn();

  const defaultProps: CompanyProfileFormProps = {
    companyInformation: {
      companyName: 'Test Company',
      address: '123 Test St',
      contactPerson: 'John Doe',
      contactEmail: 'john@test.com',
      contactPhone: '+1234567890',
      website: 'https://test.com',
    } as CompanyInformation,
    isUploading: false,
    isSaving: false,
    logoPreview: null,
    handleLogoChange: mockHandleLogoChange,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display all form sections and fields', () => {
    renderWithProviders(<CompanyProfileForm {...defaultProps} />);

    // Form sections
    expect(screen.getByText('Company Details')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    // Logo section no longer has a title, just the upload button
    expect(screen.getByText('Upload Logo')).toBeInTheDocument();

    // Form fields with populated data
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://test.com')).toBeInTheDocument();
  });

  // Test logo display states using data-driven approach
  const logoTestCases = [
    {
      name: 'upload button when no logo',
      props: defaultProps,
      expectedText: 'Upload Logo',
      expectedInitials: 'TE',
    },
    {
      name: 'change button with logo preview',
      props: { ...defaultProps, logoPreview: 'https://test.com/logo.png' },
      expectedText: 'Change Logo',
      expectedImg: true,
    },
    {
      name: 'fallback initials with null company',
      props: { ...defaultProps, companyInformation: null },
      expectedText: 'Upload Logo',
      expectedInitials: 'LOGO',
    },
  ];

  logoTestCases.forEach(
    ({ name, props, expectedText, expectedInitials, expectedImg }) => {
      it(`should display ${name}`, () => {
        renderWithProviders(<CompanyProfileForm {...props} />);

        expect(screen.getByText(expectedText)).toBeInTheDocument();

        if (expectedImg) {
          const logoImg = screen.getByAltText('Logo');
          expect(logoImg).toBeInTheDocument();
          expect(logoImg).toHaveAttribute('src', 'https://test.com/logo.png');
        }

        if (expectedInitials) {
          expect(screen.getByText(expectedInitials)).toBeInTheDocument();
        }
      });
    }
  );

  it('should handle loading states and form submission', async () => {
    const user = userEvent.setup();

    // Test upload button disabled when uploading
    const { rerender } = renderWithProviders(
      <CompanyProfileForm {...defaultProps} isUploading={true} />
    );
    expect(screen.getByRole('button', { name: /upload logo/i })).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Test submit button disabled when saving
    rerender(<CompanyProfileForm {...defaultProps} isSaving={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();

    // Test successful form submission
    rerender(<CompanyProfileForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          companyName: 'Test Company',
          address: '123 Test St',
          contactPerson: 'John Doe',
          contactEmail: 'john@test.com',
          contactPhone: '+1234567890',
          website: 'https://test.com',
        },
        expect.anything()
      );
    });
  });

  it('should validate form fields and handle errors', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <CompanyProfileForm {...defaultProps} companyInformation={null} />
    );

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
      expect(screen.getByText('Address is required')).toBeInTheDocument();
      expect(
        screen.getByText('Contact person is required')
      ).toBeInTheDocument();
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });

    // Test website field accepts any text (no URL validation)
    rerender(<CompanyProfileForm {...defaultProps} />);

    const websiteInput = screen.getByDisplayValue('https://test.com');
    await user.clear(websiteInput);
    await user.type(websiteInput, 'not-a-url');

    // Clear mock before testing
    mockOnSubmit.mockClear();

    // Trigger form submission
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Verify that form accepts any text in website field
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: 'Test Company',
          address: '123 Test St',
          contactPerson: 'John Doe',
          contactEmail: 'john@test.com',
          contactPhone: '+1234567890',
          website: 'not-a-url',
        }),
        expect.anything()
      );
    });

    // Test empty website is allowed
    await user.clear(websiteInput);
    mockOnSubmit.mockClear(); // Clear previous calls
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: 'Test Company',
          address: '123 Test St',
          contactPerson: 'John Doe',
          contactEmail: 'john@test.com',
          contactPhone: '+1234567890',
          website: '',
        }),
        expect.anything()
      );
    });
  });

  it('should handle logo upload interaction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyProfileForm {...defaultProps} />);

    const uploadButton = screen.getByText('Upload Logo');

    // Mock the hidden file input click
    const clickSpy = vi.fn();
    const fileInput = document.getElementById(
      'logo-upload'
    ) as HTMLInputElement;
    fileInput.click = clickSpy;

    await user.click(uploadButton);
    expect(clickSpy).toHaveBeenCalled();
  });
});
