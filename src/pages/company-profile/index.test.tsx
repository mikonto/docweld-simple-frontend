import React from 'react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import CompanyProfile from './index';
import { toast } from 'sonner';

// Mock the useCompanyInformation hook
vi.mock('@/hooks/useCompanyInformation', () => ({
  useCompanyInformation: vi.fn(),
}));

// Mock PageHeader
vi.mock('@/components/layouts/PageHeader', () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

// Mock ErrorLoadingWrapper
vi.mock('@/components/shared/ErrorLoadingWrapper', () => ({
  ErrorLoadingWrapper: ({
    error,
    loading,
    resourceName,
    children,
  }: {
    error?: Error | null;
    loading?: boolean;
    resourceName?: string;
    children?: React.ReactNode;
  }) => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading {resourceName}</div>;
    return <>{children}</>;
  },
}));

// Mock CompanyProfileForm
vi.mock('./CompanyProfileForm', () => ({
  CompanyProfileForm: ({
    onSubmit,
    handleLogoChange,
  }: {
    onSubmit: (data: { companyName: string }) => void;
    handleLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div>
      <button onClick={() => onSubmit({ companyName: 'Test Company' })}>
        Save Changes
      </button>
      <input
        type="file"
        onChange={handleLogoChange}
        data-testid="logo-upload"
      />
    </div>
  ),
}));

// Mock sonner toast
vi.mock('sonner');

describe('CompanyProfile', () => {
  const mockUpdateCompanyInformation = vi.fn();
  const mockUploadCompanyLogo = vi.fn();

  const defaultMockData = {
    companyInformation: {
      id: 'company',
      companyName: 'Test Company',
      address: '123 Test St',
      contactPerson: 'John Doe',
      contactEmail: 'john@test.com',
      contactPhone: '+1234567890',
      website: 'https://test.com',
      logoUrl: 'https://test.com/logo.png',
    },
    loading: false,
    error: undefined,
    updateCompanyInformation: mockUpdateCompanyInformation,
    uploadCompanyLogo: mockUploadCompanyLogo,
    isUploading: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useCompanyInformation } = vi.mocked(
      await import('@/hooks/useCompanyInformation')
    );
    useCompanyInformation.mockReturnValue(defaultMockData);
  });

  // Test data states using data-driven approach
  const stateTestCases = [
    {
      name: 'loading',
      mockData: { ...defaultMockData, loading: true },
      expectedText: 'Loading...',
    },
    {
      name: 'error',
      mockData: { ...defaultMockData, error: new Error('Failed to load') },
      expectedText: 'Error loading company profile',
    },
    {
      name: 'loaded',
      mockData: defaultMockData,
      expectedText: 'Company Profile',
    },
  ];

  stateTestCases.forEach(({ name, mockData, expectedText }) => {
    it(`should display ${name} state correctly`, async () => {
      const { useCompanyInformation } = vi.mocked(
        await import('@/hooks/useCompanyInformation')
      );
      (
        useCompanyInformation as MockedFunction<typeof useCompanyInformation>
      ).mockReturnValue(mockData);

      renderWithProviders(<CompanyProfile />);

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  it('should handle form submission with success and error scenarios', async () => {
    const user = userEvent.setup();

    // Test successful submission
    mockUpdateCompanyInformation.mockResolvedValueOnce(undefined);
    renderWithProviders(<CompanyProfile />);

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateCompanyInformation).toHaveBeenCalledWith({
        companyName: 'Test Company',
      });
      // Success toast is now shown by useFirestoreOperations
    });

    // Test error scenario
    const error = new Error('Update failed');
    mockUpdateCompanyInformation.mockRejectedValueOnce(error);

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      // Error toast is now shown by useFirestoreOperations
      expect(mockUpdateCompanyInformation).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle logo upload scenarios', async () => {
    const user = userEvent.setup();
    const validFile = new File(['logo'], 'logo.png', { type: 'image/png' });
    const largeFile = new File(
      [new ArrayBuffer(3 * 1024 * 1024)],
      'large-logo.png',
      { type: 'image/png' }
    );

    renderWithProviders(<CompanyProfile />);
    const input = screen.getByTestId('logo-upload') as HTMLInputElement;

    // Test successful logo upload
    mockUploadCompanyLogo.mockResolvedValueOnce(undefined);
    mockUpdateCompanyInformation.mockResolvedValueOnce(undefined);

    await user.upload(input, validFile);
    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUploadCompanyLogo).toHaveBeenCalledWith(validFile);
      // Success toast is now shown by useFirestoreOperations
    });

    // Test file size rejection
    await user.upload(input, largeFile);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Logo file size should not exceed 2MB'
      );
    });

    // Test upload error with graceful fallback
    mockUploadCompanyLogo.mockRejectedValueOnce(new Error('Upload failed'));
    mockUpdateCompanyInformation.mockResolvedValueOnce(undefined);

    await user.upload(input, validFile);
    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to upload logo: Upload failed'
      );
      expect(mockUpdateCompanyInformation).toHaveBeenCalled();
      // Success toast is now shown by useFirestoreOperations
    });
  });
});
