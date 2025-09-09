import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useDocumentCollections,
  useDocumentCollection,
  useDocumentCollectionOperations,
} from './useDocumentLibrary';
import { useApp } from '@/contexts/AppContext';

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(),
  useDocument: vi.fn(),
}));

vi.mock('@/hooks/firebase/useCascadingSoftDelete', () => ({
  useCascadingSoftDelete: vi.fn(() => ({
    deleteDocumentLibrary: vi.fn().mockResolvedValue({ deletedCount: 19 }),
  })),
}));

vi.mock('@/hooks/firebase/useFirestoreOperations', () => ({
  useFirestoreOperations: vi.fn(() => ({
    documents: [],
    loading: false,
    error: null,
    create: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue(),
  })),
}));

import { useDocument } from 'react-firebase-hooks/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';

describe('useDocumentLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useDocumentCollections', () => {
    it('should return document collections with loading and error states', () => {
      const mockDocs = [
        { id: '1', name: 'Project Documents', status: 'active' },
      ];

      useFirestoreOperations.mockReturnValue({
        documents: mockDocs,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useDocumentCollections());

      expect(result.current[0]).toEqual(mockDocs);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(null);
    });

    it('should handle errors', () => {
      const mockError = new Error('Firebase error');
      useFirestoreOperations.mockReturnValue({
        documents: [],
        loading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useDocumentCollections());

      expect(result.current[2]).toBe(mockError);
    });
  });

  describe('useDocumentCollection', () => {
    it('should return document data when found', () => {
      const mockDoc = {
        id: '123',
        exists: () => true,
        data: () => ({ name: 'Project Alpha', status: 'active' }),
      };

      useDocument.mockReturnValue([mockDoc, false, null]);

      const { result } = renderHook(() => useDocumentCollection('123'));

      expect(result.current[0]).toEqual({
        id: '123',
        name: 'Project Alpha',
        status: 'active',
      });
    });

    it('should return null when document not found', () => {
      const mockDoc = { exists: () => false };
      useDocument.mockReturnValue([mockDoc, false, null]);

      const { result } = renderHook(() => useDocumentCollection('123'));

      expect(result.current[0]).toBe(null);
    });
  });

  describe('useDocumentCollectionOperations', () => {
    const mockUser = { uid: 'user123' };

    beforeEach(() => {
      useApp.mockReturnValue({ loggedInUser: mockUser });
    });

    it('should create document collection', async () => {
      const mockCreate = vi.fn().mockResolvedValue('new-id');
      useFirestoreOperations.mockReturnValue({
        documents: [],
        loading: false,
        error: null,
        create: mockCreate,
        update: vi.fn(),
        remove: vi.fn(),
      });

      const { result } = renderHook(() => useDocumentCollectionOperations());

      const collectionId = await act(async () => {
        return await result.current.createDocumentCollection({
          name: 'New Collection',
          description: 'Test description',
        });
      });

      expect(collectionId).toBe('new-id');
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'New Collection',
        description: 'Test description',
      });
    });

    it('should update document collection', async () => {
      const mockUpdate = vi.fn().mockResolvedValue();
      useFirestoreOperations.mockReturnValue({
        documents: [],
        loading: false,
        error: null,
        create: vi.fn(),
        update: mockUpdate,
        remove: vi.fn(),
      });

      const { result } = renderHook(() => useDocumentCollectionOperations());

      await act(async () => {
        await result.current.updateDocumentCollection('123', {
          name: 'Updated Name',
        });
      });

      expect(mockUpdate).toHaveBeenCalledWith('123', {
        name: 'Updated Name',
      });
    });

    it('should perform cascade delete', async () => {
      const { result } = renderHook(() => useDocumentCollectionOperations());

      const deleteResult = await act(async () => {
        return await result.current.deleteDocumentCollection('123');
      });

      expect(deleteResult).toBe(true);
    });

    it('should require user to be logged in', async () => {
      useApp.mockReturnValue({ loggedInUser: null });

      const { result } = renderHook(() => useDocumentCollectionOperations());

      await expect(
        result.current.createDocumentCollection({ name: 'Test' })
      ).rejects.toThrow('User must be logged in');

      await expect(
        result.current.deleteDocumentCollection('123')
      ).rejects.toThrow('User must be logged in');
    });
  });
});
