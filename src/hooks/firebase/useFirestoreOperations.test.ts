import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useFirestoreOperations } from './useFirestoreOperations';
import { toast } from 'sonner';
import {
  mockSetDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockDoc,
  resetFirebaseMocks,
} from '@/test/mocks/firebase';

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(() => [
    {
      docs: [
        { id: '1', data: () => ({ id: '1', name: 'Doc 1', status: 'active' }) },
        { id: '2', data: () => ({ id: '2', name: 'Doc 2', status: 'active' }) },
      ],
    },
    false,
    null,
  ]),
}));

// Mock AppContext
const mockUseApp = vi.fn(() => ({ loggedInUser: { uid: 'test-user' } }));
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => mockUseApp(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('useFirestoreOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFirebaseMocks();

    // Setup default doc mock to return an ID
    (mockDoc as Mock).mockReturnValue({ id: 'new-doc-123' });
    
    // Reset useApp mock to have a logged in user by default
    mockUseApp.mockReturnValue({ loggedInUser: { uid: 'test-user' } });
  });

  describe('Input Validation', () => {
    it('should reject create with invalid data', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      // Wait for hook to be ready
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      // Test with null
      await expect(result.current.create(null as any)).rejects.toThrow(
        'Invalid data provided'
      );

      // Test with non-object
      await expect(result.current.create('invalid' as any)).rejects.toThrow(
        'Invalid data provided'
      );

      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should reject update with invalid parameters', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      // Test with invalid ID
      await expect(
        result.current.update(null as any, { name: 'Test' })
      ).rejects.toThrow('Invalid document ID provided');

      // Test with invalid data
      await expect(result.current.update('doc-123', null as any)).rejects.toThrow(
        'Invalid update data provided'
      );

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Checks', () => {
    it('should reject operations when user is not logged in', async () => {
      // Mock no logged in user
      mockUseApp.mockReturnValue({ loggedInUser: null });

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      // Test create
      await expect(result.current.create({ name: 'Test' })).rejects.toThrow(
        'User must be logged in to perform this operation'
      );

      // Test update
      await expect(
        result.current.update('doc-123', { name: 'Updated' })
      ).rejects.toThrow('User must be logged in to perform this operation');

      // Test delete
      await expect(result.current.remove('doc-123')).rejects.toThrow(
        'User must be logged in to perform this operation'
      );

      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(mockUpdateDoc).not.toHaveBeenCalled();
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });
  });

  describe('Create Operation', () => {
    it('should create a document with generated ID', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      const data = { name: 'New Document', description: 'Test' };
      const docId = await result.current.create(data);

      expect(docId).toBe('new-doc-123');
      expect(mockSetDoc).toHaveBeenCalledWith(
        { id: 'new-doc-123' },
        expect.objectContaining({
          ...data,
          id: 'new-doc-123',
          status: 'active',
          createdBy: 'test-user',
          updatedBy: 'test-user',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('crud.createSuccess');
    });

    it('should create a document with provided ID', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      const data = { id: 'custom-id', name: 'New Document' };
      const docId = await result.current.create(data);

      expect(docId).toBe('custom-id');
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'test-collection', 'custom-id');
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should suppress toast when option is set', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.create(
        { name: 'Test' },
        { suppressToast: true }
      );

      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('Update Operation', () => {
    it('should update a document', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      const updates = { name: 'Updated Name' };
      await result.current.update('doc-123', updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedBy: 'test-user',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('crud.updateSuccess');
    });
  });

  describe('Delete Operation', () => {
    it('should soft delete by default', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.remove('doc-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'deleted',
          deletedBy: 'test-user',
          updatedBy: 'test-user',
        })
      );
      expect(mockDeleteDoc).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('crud.deleteSuccess');
    });

    it('should hard delete when specified', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.remove('doc-123', true);

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('Archive Operation', () => {
    it('should archive a document', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.archive('doc-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'archived',
          archivedBy: 'test-user',
          updatedBy: 'test-user',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('crud.archiveSuccess');
    });
  });

  describe('Restore Operation', () => {
    it('should restore a document', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.restore('doc-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'active',
          restoredBy: 'test-user',
          updatedBy: 'test-user',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('crud.restoreSuccess');
    });
  });

  describe('Data Fetching', () => {
    it('should return documents from collection', () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      expect(result.current.documents).toHaveLength(2);
      expect(result.current.documents[0]).toEqual({
        id: '1',
        name: 'Doc 1',
        status: 'active',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});