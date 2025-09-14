import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useCascadingSoftDelete } from './useCascadingSoftDelete';
import { writeBatch, getDocs, where } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => ({
    forEach: vi.fn(),
    empty: true,
  })),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({
    id,
    collection,
  })),
}));

vi.mock('@/config/firebase', () => ({
  db: {},
}));

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({ loggedInUser: { uid: 'test-user-123' } }),
}));

vi.mock('sonner');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

interface MockBatch {
  update: Mock;
  commit: Mock;
}

describe('useCascadingSoftDelete', () => {
  let mockBatch: MockBatch;
  let mockGetDocs: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Simple batch mock
    mockBatch = {
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    (writeBatch as Mock).mockReturnValue(mockBatch);

    // Reset getDocs mock
    mockGetDocs = vi.fn(() => ({
      forEach: vi.fn(),
      empty: true,
    }));
    vi.mocked(getDocs).mockImplementation(mockGetDocs);
  });

  describe('deleteProject', () => {
    it('should delete project and return count of deleted items', async () => {
      const { result } = renderHook(() => useCascadingSoftDelete());

      const deletedCount = await act(async () => {
        return await result.current.deleteProject('project-123');
      });

      // Should have called batch update
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);

      // Should return success boolean
      expect(deletedCount).toBe(true);
    });

    it('should handle >30 weld logs by chunking queries', async () => {
      // Create 35 mock weld log IDs to test chunking
      const mockWeldLogIds = Array.from(
        { length: 35 },
        (_, i) => `weld-log-${i}`
      );

      // Mock getDocs to return weld logs on first call, then welds for chunked queries
      let callCount = 0;
      mockGetDocs.mockImplementation(() => {
        callCount++;

        if (callCount === 2) {
          // Second call is for weld logs - return 35 items
          return {
            forEach: (
              callback: (doc: { id: string; ref: { id: string } }) => void
            ) => {
              mockWeldLogIds.forEach((id) => callback({ id, ref: { id } }));
            },
            empty: false,
          };
        }

        // Other calls return empty
        return {
          forEach: vi.fn(),
          empty: true,
        };
      });

      const { result } = renderHook(() => useCascadingSoftDelete());

      await act(async () => {
        await result.current.deleteProject('project-123');
      });

      // Should have made multiple queries due to chunking (35 items = 2 chunks: 30 + 5)
      // Check that where was called with 'in' operator multiple times for welds
      const whereCalls = (where as Mock).mock.calls;
      const inCalls = whereCalls.filter((call: unknown[]) => call[1] === 'in');

      // Should have at least 2 'in' calls for the chunked weld queries
      expect(inCalls.length).toBeGreaterThanOrEqual(2);

      // Batch should have been committed
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockBatch.commit.mockRejectedValue(new Error('Firestore error'));

      const { result } = renderHook(() => useCascadingSoftDelete());

      await expect(
        act(async () => {
          await result.current.deleteProject('project-123');
        })
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('deleteWeldLog', () => {
    it('should delete weld log and return count of deleted items', async () => {
      const { result } = renderHook(() => useCascadingSoftDelete());

      const deletedCount = await act(async () => {
        return await result.current.deleteWeldLog('weld-log-123');
      });

      // Should have called batch operations
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);

      // Should return success boolean
      expect(deletedCount).toBe(true);
    });
  });

  describe('deleteDocumentLibrary', () => {
    it('should delete document library and return count of deleted items', async () => {
      const { result } = renderHook(() => useCascadingSoftDelete());

      const deletedCount = await act(async () => {
        return await result.current.deleteDocumentLibrary('library-123');
      });

      // Should have called batch operations
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);

      // Should return success boolean
      expect(deletedCount).toBe(true);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return success', async () => {
      const { result } = renderHook(() => useCascadingSoftDelete());

      const success = await act(async () => {
        return await result.current.deleteUser('user-123');
      });

      // Should have called batch operations
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);

      // Should return success
      expect(success).toBe(true);
    });
  });

  describe('deleteMaterial', () => {
    it('should delete material and return success', async () => {
      const { result } = renderHook(() => useCascadingSoftDelete());

      const success = await act(async () => {
        return await result.current.deleteMaterial('material-123', 'parent');
      });

      // Should have called batch operations
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);

      // Should return success
      expect(success).toBe(true);
    });
  });
});
