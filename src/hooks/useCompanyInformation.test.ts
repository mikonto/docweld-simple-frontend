import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompanyInformation } from './useCompanyInformation';
import { useApp } from '@/contexts/AppContext';
import type { CompanyFormData } from '@/types';

// Mock dependencies
vi.mock('@/hooks/firebase/useFirestoreOperations');
vi.mock('react-firebase-hooks/storage', () => ({
  useUploadFile: () => [
    vi.fn().mockResolvedValue({ ref: 'mock-ref' }),
    false,
    null,
    null,
  ],
}));
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  getDownloadURL: vi.fn(),
}));
vi.mock('@/config/firebase', () => ({
  db: 'mock-db',
  storage: 'mock-storage',
}));
vi.mock('@/contexts/AppContext');
vi.mock('@/utils/sanitizeFileName', () => ({
  sanitizeFileName: vi.fn((name: string) => name),
}));

describe('useCompanyInformation', () => {
  const mockLoggedInUser = { uid: 'test-user-123' };
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as Mock).mockReturnValue({ loggedInUser: mockLoggedInUser });
  });

  it('should fetch and transform company information', async () => {
    const { useFirestoreOperations } = await import(
      '@/hooks/firebase/useFirestoreOperations'
    );

    const mockCompanyData = {
      id: 'company',
      companyName: 'Test Company',
      companyAddress: '123 Test St',
      companyWebsite: 'https://test.com',
      contactPersonName: 'John Doe',
      contactPersonEmail: 'john@test.com',
      contactPersonPhone: '+1234567890',
      logoUrl: 'https://test.com/logo.png',
    };

    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [mockCompanyData],
      loading: false,
      error: null,
      create: mockCreate,
      update: mockUpdate,
    });

    const { result } = renderHook(() => useCompanyInformation());

    expect(result.current.companyInformation).toEqual({
      id: 'company',
      companyName: 'Test Company',
      address: '123 Test St',
      website: 'https://test.com',
      contactPerson: 'John Doe',
      contactEmail: 'john@test.com',
      contactPhone: '+1234567890',
      logoUrl: 'https://test.com/logo.png',
      createdAt: undefined,
      updatedAt: undefined,
    });
    expect(result.current.loading).toBe(false);
  });

  it('should handle missing company document', async () => {
    const { useFirestoreOperations } = await import(
      '@/hooks/firebase/useFirestoreOperations'
    );

    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: null,
      create: mockCreate,
      update: mockUpdate,
    });

    const { result } = renderHook(() => useCompanyInformation());

    expect(result.current.companyInformation).toBe(null);
  });

  it('should create new company information', async () => {
    const { useFirestoreOperations } = await import(
      '@/hooks/firebase/useFirestoreOperations'
    );

    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: null,
      create: mockCreate,
      update: mockUpdate,
    });

    const { result } = renderHook(() => useCompanyInformation());

    const formData: CompanyFormData = {
      companyName: 'New Company',
      address: '456 New St',
      website: 'https://new.com',
      contactPerson: 'Jane Smith',
      contactEmail: 'jane@new.com',
      contactPhone: '+0987654321',
    };

    await result.current.updateCompanyInformation(formData);

    expect(mockCreate).toHaveBeenCalledWith({
      companyName: 'New Company',
      companyAddress: '456 New St',
      companyWebsite: 'https://new.com',
      contactPersonName: 'Jane Smith',
      contactPersonEmail: 'jane@new.com',
      contactPersonPhone: '+0987654321',
      id: 'company',
    });
  });

  it('should update existing company information', async () => {
    const { useFirestoreOperations } = await import(
      '@/hooks/firebase/useFirestoreOperations'
    );

    const mockCompanyData = {
      id: 'company',
      companyName: 'Existing Company',
    };

    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [mockCompanyData],
      loading: false,
      error: null,
      create: mockCreate,
      update: mockUpdate,
    });

    const { result } = renderHook(() => useCompanyInformation());

    const formData: CompanyFormData = {
      companyName: 'Updated Company',
      address: '789 Updated St',
      website: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
    };

    await result.current.updateCompanyInformation(formData);

    expect(mockUpdate).toHaveBeenCalledWith('company', {
      companyName: 'Updated Company',
      companyAddress: '789 Updated St',
      companyWebsite: '',
      contactPersonName: '',
      contactPersonEmail: '',
      contactPersonPhone: '',
    });
  });

  it('should upload logo and update document', async () => {
    const { useFirestoreOperations } = await import(
      '@/hooks/firebase/useFirestoreOperations'
    );
    const { getDownloadURL } = await import('firebase/storage');

    const mockCompanyData = { id: 'company' };

    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [mockCompanyData],
      loading: false,
      error: null,
      create: mockCreate,
      update: mockUpdate,
    });

    (getDownloadURL as Mock).mockResolvedValue('https://test.com/new-logo.png');

    const { result } = renderHook(() => useCompanyInformation());

    const mockFile = new File([''], 'logo.png', { type: 'image/png' });
    const logoUrl = await result.current.uploadCompanyLogo(mockFile);

    expect(logoUrl).toBe('https://test.com/new-logo.png');
    expect(mockUpdate).toHaveBeenCalledWith('company', {
      logoUrl: 'https://test.com/new-logo.png',
    });
  });
});