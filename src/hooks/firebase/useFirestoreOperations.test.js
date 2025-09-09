import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({ loggedInUser: { uid: 'test-user' } })),
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
  useTranslation: () => ({ t: (key) => key }),
}));

import { useCollection } from 'react-firebase-hooks/firestore';
import { useApp } from '@/contexts/AppContext';

describe('useFirestoreOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFirebaseMocks();

    // Setup default doc mock to return an ID
    mockDoc.mockReturnValue({ id: 'new-doc-123' });
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
      await expect(result.current.create(null)).rejects.toThrow(
        'Invalid data provided'
      );

      // Test with non-object
      await expect(result.current.create('invalid')).rejects.toThrow(
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
        result.current.update(null, { name: 'Test' })
      ).rejects.toThrow('Invalid document ID provided');

      // Test with invalid data
      await expect(result.current.update('doc-123', null)).rejects.toThrow(
        'Invalid update data provided'
      );

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('Basic Operations', () => {
    it('should return documents from collection', async () => {
      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.documents).toBeDefined();
      });

      expect(result.current.documents).toHaveLength(2);
      expect(result.current.documents[0].name).toBe('Doc 1');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should create a new document', async () => {
      mockSetDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      const docId = await result.current.create({ name: 'New Document' });

      expect(docId).toBe('new-doc-123');
      expect(mockSetDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('crud.createSuccess');
    });

    it('should update an existing document', async () => {
      mockUpdateDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.update('doc-123', { name: 'Updated' });

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('crud.updateSuccess');
    });

    it('should soft delete by default', async () => {
      mockUpdateDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.remove('doc-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(mockDeleteDoc).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('crud.deleteSuccess');
    });

    it('should hard delete when specified', async () => {
      mockDeleteDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.remove('doc-123', true);

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('crud.deleteSuccess');
    });
  });

  describe('Error Handling', () => {
    it('should handle create errors', async () => {
      const error = new Error('Create failed');
      mockSetDoc.mockRejectedValueOnce(error);

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(result.current.create({ name: 'New' })).rejects.toThrow(
        'Create failed'
      );

      expect(toast.error).toHaveBeenCalledWith('Create failed');
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockUpdateDoc.mockRejectedValueOnce(error);

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(
        result.current.update('doc-123', { name: 'Updated' })
      ).rejects.toThrow('Update failed');

      expect(toast.error).toHaveBeenCalledWith('Update failed');
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for operations when requireAuth is true', async () => {
      // Mock no logged in user
      useApp.mockReturnValueOnce({ loggedInUser: null });

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(result.current.create({ name: 'Test' })).rejects.toThrow(
        'User must be logged in to perform this operation'
      );
    });

    it('should always require authentication - no exceptions', async () => {
      useApp.mockReturnValueOnce({ loggedInUser: null });
      mockSetDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      // Should throw error even without requireAuth option
      await expect(result.current.create({ name: 'Test' })).rejects.toThrow(
        'User must be logged in to perform this operation'
      );

      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should use provided ID when creating document with id field', async () => {
      mockSetDoc.mockResolvedValueOnce();
      const providedId = 'custom-doc-id-123';

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      const docId = await result.current.create({
        id: providedId,
        name: 'Test Document',
      });

      expect(docId).toBe(providedId);
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'test-collection',
        providedId
      );
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should generate ID when creating document without id field', async () => {
      mockSetDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      const docId = await result.current.create({
        name: 'Test Document',
      });

      expect(docId).toBe('new-doc-123');
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should handle empty collection gracefully', async () => {
      useCollection.mockReturnValueOnce([{ docs: [] }, false, null]);

      const { result } = renderHook(() =>
        useFirestoreOperations('empty-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      expect(result.current.documents).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle rapid operations (create then update)', async () => {
      mockSetDoc.mockResolvedValueOnce();
      mockUpdateDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      // Create document
      const docId = await result.current.create({ name: 'New Document' });
      expect(docId).toBe('new-doc-123');

      // Immediately update it
      await result.current.update(docId, { name: 'Updated Document' });

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledTimes(2);
    });

    it('should handle null snapshot gracefully', async () => {
      useCollection.mockReturnValueOnce([null, false, null]);

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      // Should not crash and return empty array
      expect(result.current.documents).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Archive and Restore', () => {
    it('should archive a document', async () => {
      mockUpdateDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.archive('doc-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('crud.archiveSuccess');
    });

    it('should restore a document', async () => {
      mockUpdateDoc.mockResolvedValueOnce();

      const { result } = renderHook(() =>
        useFirestoreOperations('test-collection')
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await result.current.restore('doc-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('crud.restoreSuccess');
    });
  });
});
