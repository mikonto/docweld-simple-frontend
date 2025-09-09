import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWeldLogs, useWeldLog, useWeldLogOperations } from './useWeldLogs';
import {
  // mockWhere, // Not used in current tests
  resetFirebaseMocks,
} from '@/test/mocks/firebase';
import { useApp } from '@/contexts/AppContext';
import { useDocument } from 'react-firebase-hooks/firestore';

// Mock the AppContext
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock cascading soft delete
vi.mock('@/hooks/firebase/useCascadingSoftDelete', () => ({
  useCascadingSoftDelete: vi.fn(),
}));

// Mock useFirestoreOperations
vi.mock('@/hooks/firebase/useFirestoreOperations', () => ({
  useFirestoreOperations: vi.fn(),
}));

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(),
  useDocument: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'weldLogs.createSuccess': 'Weld log added successfully',
        'weldLogs.updateSuccess': 'Weld log updated successfully',
        'weldLogs.deleteSuccess': 'Weld log deleted successfully',
        'crud.createSuccess': 'Added successfully',
        'crud.updateSuccess': 'Updated successfully',
        'crud.deleteSuccess': 'Deleted successfully',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import the mocked functions
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useCascadingSoftDelete } from '@/hooks/firebase/useCascadingSoftDelete';

describe('useWeldLogs Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetFirebaseMocks();
    vi.clearAllMocks();

    // Setup default useApp mock
    useApp.mockReturnValue({
      loggedInUser: { uid: 'test-user-id', email: 'test@example.com' },
    });
  });

  describe('useWeldLogs', () => {
    it('should return empty list while loading', () => {
      useFirestoreOperations.mockReturnValue({
        documents: [],
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useWeldLogs('project123'));

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(true);
      expect(result.current[2]).toBe(null);
    });

    it('should return weld logs for project', () => {
      const mockWeldLogs = [
        {
          id: '1',
          projectId: 'project123',
          name: 'Weld Log 1',
          status: 'active',
        },
        {
          id: '2',
          projectId: 'project123',
          name: 'Weld Log 2',
          status: 'active',
        },
      ];

      useFirestoreOperations.mockReturnValue({
        documents: mockWeldLogs,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useWeldLogs('project123'));

      expect(result.current[0]).toHaveLength(2);
      expect(result.current[0][0].name).toBe('Weld Log 1');
      expect(result.current[0][1].name).toBe('Weld Log 2');
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to load');
      useFirestoreOperations.mockReturnValue({
        documents: [],
        loading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useWeldLogs('project123'));

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(mockError);
    });
  });

  describe('useWeldLog', () => {
    it('should return nothing when no weld log selected', () => {
      useDocument.mockReturnValue([null, false, null]);

      const { result } = renderHook(() => useWeldLog(null));

      expect(result.current[0]).toBe(null);
      expect(result.current[1]).toBe(false);
    });

    it('should return weld log data', () => {
      const mockWeldLog = {
        id: '123',
        exists: () => true,
        data: () => ({
          projectId: 'project123',
          name: 'Weld Log 1',
          description: 'Test description',
          status: 'active',
        }),
      };

      useDocument.mockReturnValue([mockWeldLog, false, null]);

      const { result } = renderHook(() => useWeldLog('123'));

      expect(result.current[0]).toMatchObject({
        id: '123',
        projectId: 'project123',
        name: 'Weld Log 1',
        description: 'Test description',
        status: 'active',
      });
    });

    it('should handle loading state', () => {
      useDocument.mockReturnValue([null, true, null]);

      const { result } = renderHook(() => useWeldLog('123'));

      expect(result.current[0]).toBe(null);
      expect(result.current[1]).toBe(true);
    });
  });

  describe('useWeldLogOperations', () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };

    // Setup simplified mocks
    const mockOps = {
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
      remove: vi.fn(),
    };

    const mockCascading = {
      deleteWeldLog: vi.fn(),
    };

    beforeEach(() => {
      useApp.mockReturnValue({ loggedInUser: mockUser });
      useFirestoreOperations.mockReturnValue(mockOps);
      useCascadingSoftDelete.mockReturnValue(mockCascading);
    });

    describe('createWeldLog', () => {
      it('should create new weld log and return ID', async () => {
        mockOps.create.mockResolvedValue('new-weld-log-id');

        const { result } = renderHook(() => useWeldLogOperations());

        const weldLogData = {
          name: 'New Weld Log',
          description: 'Test description',
        };

        await act(async () => {
          const weldLogId = await result.current.createWeldLog(
            'project123',
            weldLogData
          );
          expect(weldLogId).toBe('new-weld-log-id');
        });

        expect(mockOps.create).toHaveBeenCalledWith({
          name: 'New Weld Log',
          description: 'Test description',
          projectId: 'project123',
        });
      });

      it('should handle creation failure', async () => {
        mockOps.create.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useWeldLogOperations());

        await act(async () => {
          await expect(
            result.current.createWeldLog('project123', { name: 'Test' })
          ).rejects.toThrow('Network error');
        });
      });
    });

    describe('updateWeldLog', () => {
      it('should update weld log', async () => {
        mockOps.update.mockResolvedValue();

        const { result } = renderHook(() => useWeldLogOperations());

        const updates = {
          name: 'Updated Name',
          description: 'Updated description',
        };

        await act(async () => {
          await result.current.updateWeldLog('weldlog123', updates);
        });

        expect(mockOps.update).toHaveBeenCalledWith('weldlog123', updates);
      });

      it('should handle update failure', async () => {
        mockOps.update.mockRejectedValue(new Error('Permission denied'));

        const { result } = renderHook(() => useWeldLogOperations());

        await act(async () => {
          await expect(
            result.current.updateWeldLog('weldlog123', { name: 'Test' })
          ).rejects.toThrow('Permission denied');
        });
      });
    });

    describe('deleteWeldLog', () => {
      it('should soft delete weld log using cascading delete', async () => {
        mockCascading.deleteWeldLog.mockResolvedValue();

        const { result } = renderHook(() => useWeldLogOperations());

        await act(async () => {
          await result.current.deleteWeldLog('weldlog123', 'project123');
        });

        expect(mockCascading.deleteWeldLog).toHaveBeenCalledWith(
          'weldlog123',
          'project123'
        );
      });

      it('should handle deletion failure', async () => {
        mockCascading.deleteWeldLog.mockRejectedValue(
          new Error('Permission denied')
        );

        const { result } = renderHook(() => useWeldLogOperations());

        await act(async () => {
          await expect(
            result.current.deleteWeldLog('weldlog123', 'project123')
          ).rejects.toThrow('Permission denied');
        });
      });
    });
  });
});

// Critical i18n tests merged from useWeldLogs.i18n.test.jsx
describe('useWeldLogOperations i18n messages', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockCascadeDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useApp.mockReturnValue({ loggedInUser: mockUser });

    useFirestoreOperations.mockReturnValue({
      documents: [],
      loading: false,
      error: null,
      create: mockCreate,
      update: mockUpdate,
    });

    useCascadingSoftDelete.mockReturnValue({
      deleteWeldLog: mockCascadeDelete,
    });
  });

  describe('createWeldLog', () => {
    it('should handle success and error messages for weld log creation', async () => {
      mockCreate.mockResolvedValueOnce('new-weld-log-id');

      const { result } = renderHook(() => useWeldLogOperations());

      await act(async () => {
        await result.current.createWeldLog('project-id', {
          weldNumber: 'W001',
          weldType: 'TIG',
        });
      });

      expect(mockCreate).toHaveBeenCalledWith({
        weldNumber: 'W001',
        weldType: 'TIG',
        projectId: 'project-id',
      });
    });

    it('should handle error messages when creation fails', async () => {
      const error = new Error('Network error');
      mockCreate.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWeldLogOperations());

      await expect(
        act(async () => {
          await result.current.createWeldLog('project-id', {
            weldNumber: 'W001',
          });
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('updateWeldLog', () => {
    it('should handle success and error messages for weld log updates', async () => {
      mockUpdate.mockResolvedValueOnce();

      const { result } = renderHook(() => useWeldLogOperations());

      await act(async () => {
        await result.current.updateWeldLog('weld-log-id', {
          weldNumber: 'W002',
        });
      });

      expect(mockUpdate).toHaveBeenCalledWith('weld-log-id', {
        weldNumber: 'W002',
      });
    });

    it('should handle error messages when update fails', async () => {
      const error = new Error('Permission denied');
      mockUpdate.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWeldLogOperations());

      await expect(
        act(async () => {
          await result.current.updateWeldLog('weld-log-id', {
            weldNumber: 'W002',
          });
        })
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('deleteWeldLog', () => {
    it('should handle success and error messages for weld log deletion', async () => {
      mockCascadeDelete.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useWeldLogOperations());

      await act(async () => {
        await result.current.deleteWeldLog('weld-log-id', 'project-id');
      });

      expect(mockCascadeDelete).toHaveBeenCalledWith(
        'weld-log-id',
        'project-id'
      );
    });

    it('should handle error messages when deletion fails', async () => {
      const error = new Error('Document not found');
      mockCascadeDelete.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWeldLogOperations());

      await expect(
        act(async () => {
          await result.current.deleteWeldLog('weld-log-id', 'project-id');
        })
      ).rejects.toThrow('Document not found');
    });
  });

  describe('authentication errors', () => {
    beforeEach(() => {
      useApp.mockReturnValue({ loggedInUser: null });
      mockCreate.mockRejectedValue(
        new Error('User must be logged in to perform this operation')
      );
      mockUpdate.mockRejectedValue(
        new Error('User must be logged in to perform this operation')
      );
    });

    it('should handle authentication errors for operations', async () => {
      const { result } = renderHook(() => useWeldLogOperations());

      await expect(
        act(async () => {
          await result.current.createWeldLog('project-id', {});
        })
      ).rejects.toThrow('User must be logged in to perform this operation');

      await expect(
        act(async () => {
          await result.current.updateWeldLog('weld-log-id', {});
        })
      ).rejects.toThrow('User must be logged in to perform this operation');
    });
  });
});
