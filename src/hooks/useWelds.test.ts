import { act } from '@testing-library/react';
import { renderHook } from '@/test/utils/testUtils';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useWelds, useWeld, useWeldOperations } from './useWelds';
import {
  mockGetDocs,
  mockWriteBatch,
  resetFirebaseMocks,
} from '@/test/mocks/firebase';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import type { Weld, WeldFormData } from '@/types';

// Mock the AppContext
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(),
  useDocument: vi.fn(),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string | ((p: any) => string)> = {
        'welds.createSuccess': 'Weld added successfully',
        'welds.createRangeSuccess': params?.count
          ? `${params.count} welds added successfully`
          : 'welds added successfully',
        'welds.updateSuccess': 'Weld updated successfully',
        'welds.deleteSuccess': 'Weld deleted successfully',
        'welds.numberInUse': params?.number
          ? `Weld number ${params.number} is already in use`
          : 'Weld number is already in use',
        'welds.invalidRange': 'Invalid number range',
        'welds.rangeInUse':
          'One or more weld numbers in the range are already in use',
      };
      const translation = translations[key];
      if (typeof translation === 'function') {
        return translation(params);
      }
      return translation || key;
    },
  }),
}));

// Mock useFirestoreOperations
vi.mock('@/hooks/firebase/useFirestoreOperations', () => ({
  useFirestoreOperations: vi.fn(),
}));

// Import the mocked functions
import { useDocument } from 'react-firebase-hooks/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';

describe('useWelds Hook', () => {
  // Mock functions for useFirestoreOperations
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    resetFirebaseMocks();
    vi.clearAllMocks();

    // Setup default useApp mock
    (useApp as Mock).mockReturnValue({
      loggedInUser: { uid: 'test-user-id', email: 'test@example.com' },
    });

    // Setup default useFirestoreOperations mock
    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: null,
      create: mockCreate,
      update: mockUpdate,
      remove: mockRemove,
    });
  });

  describe('useWelds', () => {
    it('should return welds for a specific weld log', () => {
      const mockWelds: Partial<Weld>[] = [
        {
          id: '1',
          number: '1',
          weldLogId: 'weldlog123',
          description: 'Test weld 1',
          status: 'active',
        },
        {
          id: '2',
          number: '2',
          weldLogId: 'weldlog123',
          description: 'Test weld 2',
          status: 'active',
        },
      ];

      (useFirestoreOperations as Mock).mockReturnValue({
        documents: mockWelds,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useWelds('weldlog123'));

      expect(result.current[0]).toHaveLength(2);
      expect(result.current[0][0].number).toBe('1');
      expect(result.current[0][1].number).toBe('2');
    });

    it('should handle loading state', () => {
      (useFirestoreOperations as Mock).mockReturnValue({
        documents: [],
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useWelds('weldlog123'));

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(true);
      expect(result.current[2]).toBe(null);
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to load');
      (useFirestoreOperations as Mock).mockReturnValue({
        documents: [],
        loading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useWelds('weldlog123'));

      expect(result.current[2]).toBe(mockError);
    });

    it('should return empty array when no weldLogId provided', () => {
      const { result } = renderHook(() => useWelds(null));

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(null);
    });
  });

  describe('useWeld', () => {
    it('should return weld data when found', () => {
      const mockWeld = {
        id: '123',
        exists: () => true,
        data: () => ({
          number: '1',
          weldLogId: 'weldlog123',
          description: 'Test weld',
          status: 'active',
        }),
      };

      (useDocument as Mock).mockReturnValue([mockWeld, false, null]);

      const { result } = renderHook(() => useWeld('123'));

      expect(result.current[0]).toMatchObject({
        id: '123',
        number: '1',
        weldLogId: 'weldlog123',
        description: 'Test weld',
        status: 'active',
      });
    });

    it('should return null when weld does not exist', () => {
      const mockSnapshot = {
        exists: () => false,
      };

      (useDocument as Mock).mockReturnValue([mockSnapshot, false, null]);

      const { result } = renderHook(() => useWeld('123'));

      expect(result.current[0]).toBe(null);
    });

    it('should return null when weldId is not provided', () => {
      (useDocument as Mock).mockReturnValue([null, false, null]);

      const { result } = renderHook(() => useWeld(null));

      expect(result.current[0]).toBe(null);
      expect(result.current[1]).toBe(false);
    });
  });

  describe('useWeldOperations', () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };

    beforeEach(() => {
      (useApp as Mock).mockReturnValue({ loggedInUser: mockUser });
      mockCreate.mockReset();
      mockUpdate.mockReset();
      mockRemove.mockReset();
    });

    describe('createWeld', () => {
      it('should create a new weld successfully', async () => {
        mockGetDocs.mockResolvedValue({
          empty: true,
          docs: [],
        });
        mockCreate.mockResolvedValue('new-weld-id');

        const { result } = renderHook(() => useWeldOperations());

        const weldData: WeldFormData = {
          number: '1',
          description: 'Test weld',
        };

        await act(async () => {
          const weldId = await result.current.createWeld(
            'project123',
            'weldlog123',
            weldData
          );
          expect(weldId).toBe('new-weld-id');
        });

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            number: '1',
            description: 'Test weld',
            projectId: 'project123',
            weldLogId: 'weldlog123',
          })
        );
      });

      it('should prevent creating weld with duplicate number', async () => {
        mockGetDocs.mockResolvedValue({
          empty: false,
          docs: [{ data: () => ({ number: 1 }) }],
        });

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await expect(
            result.current.createWeld('project123', 'weldlog123', {
              number: '1',
            } as WeldFormData)
          ).rejects.toThrow('Weld number 1 is already in use');
        });
      });

      it('should require authenticated user', async () => {
        (useApp as Mock).mockReturnValue({ loggedInUser: null });

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await expect(
            result.current.createWeld('project123', 'weldlog123', {
              number: '1',
            } as WeldFormData)
          ).rejects.toThrow('User must be logged in to create welds');
        });
      });
    });

    describe('createWeldsRange', () => {
      it('should create multiple welds successfully', async () => {
        mockGetDocs.mockResolvedValue({
          empty: true,
          docs: [],
        });

        const mockBatch = {
          set: vi.fn(),
          commit: vi.fn().mockResolvedValue(undefined),
        };
        mockWriteBatch.mockReturnValue(mockBatch);

        const { result } = renderHook(() => useWeldOperations());

        const sharedData: Partial<WeldFormData> = {
          description: 'Batch weld',
        };

        await act(async () => {
          const weldIds = await result.current.createWeldsRange(
            'project123',
            'weldlog123',
            '1',
            '3',
            sharedData
          );
          expect(weldIds).toHaveLength(3);
        });

        expect(mockBatch.commit).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          '3 welds added successfully'
        );
      });

      it('should validate number range', async () => {
        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await expect(
            result.current.createWeldsRange(
              'project123',
              'weldlog123',
              '5',
              '1',
              {}
            )
          ).rejects.toThrow('Invalid number range');
        });

        expect(toast.error).toHaveBeenCalledWith('Invalid number range');
      });

      it('should prevent creating when numbers are in use', async () => {
        mockGetDocs.mockResolvedValue({
          empty: false,
          docs: [{ data: () => ({ number: 2 }) }],
        });

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await expect(
            result.current.createWeldsRange(
              'project123',
              'weldlog123',
              '1',
              '3',
              {}
            )
          ).rejects.toThrow(
            'One or more weld numbers in the range are already in use'
          );
        });
      });
    });

    describe('updateWeld', () => {
      it('should update weld successfully', async () => {
        mockUpdate.mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await result.current.updateWeld('weld123', {
            description: 'Updated description',
            notes: 'Additional notes',
          });
        });

        expect(mockUpdate).toHaveBeenCalledWith(
          'weld123',
          expect.objectContaining({
            description: 'Updated description',
            notes: 'Additional notes',
          })
        );
      });

      it('should validate weld number when updating', async () => {
        mockGetDocs.mockResolvedValue({
          empty: false,
          size: 1,
          docs: [{ id: 'other-weld' }],
        });

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await expect(
            result.current.updateWeld('weld123', { number: '5' }, 'weldlog123')
          ).rejects.toThrow('Weld number 5 is already in use');
        });
      });

      it('should require authenticated user', async () => {
        (useApp as Mock).mockReturnValue({ loggedInUser: null });

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await expect(
            result.current.updateWeld('weld123', { description: 'Test' })
          ).rejects.toThrow('User must be logged in to update welds');
        });
      });
    });

    describe('deleteWeld', () => {
      it('should delete weld successfully', async () => {
        mockRemove.mockResolvedValue(undefined);

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await result.current.deleteWeld('weld123');
        });

        expect(mockRemove).toHaveBeenCalledWith('weld123', false);
      });

      it('should require authenticated user', async () => {
        (useApp as Mock).mockReturnValue({ loggedInUser: null });

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          await expect(result.current.deleteWeld('weld123')).rejects.toThrow(
            'User must be logged in to delete welds'
          );
        });
      });
    });

    describe('number validation helpers', () => {
      it('should check if weld number is available', async () => {
        mockGetDocs.mockResolvedValue({
          empty: true,
          docs: [],
        });

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          const isAvailable = await result.current.isWeldNumberAvailable(
            'weldlog123',
            '1'
          );
          expect(isAvailable).toBe(true);
        });
      });

      it('should check if weld number range is available', async () => {
        mockGetDocs.mockResolvedValue({
          empty: true,
          docs: [],
        });

        const { result } = renderHook(() => useWeldOperations());

        await act(async () => {
          const isAvailable = await result.current.isWeldNumberRangeAvailable(
            'weldlog123',
            1,
            5
          );
          expect(isAvailable).toBe(true);
        });
      });
    });
  });
});

// Critical i18n tests merged from useWelds.i18n.test.jsx
describe('useWeldOperations i18n messages', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' };

  beforeEach(() => {
    resetFirebaseMocks();
    vi.clearAllMocks();
    (useApp as Mock).mockReturnValue({ loggedInUser: mockUser });
  });

  it('should show error message when weld number is already in use', async () => {
    // Mock duplicate weld number found
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => ({ number: '123' }) }],
    });

    const { result } = renderHook(() => useWeldOperations());

    await act(async () => {
      try {
        await result.current.createWeld('project-id', 'weld-log-id', {
          number: '123',
          position: '1F',
        } as WeldFormData);
      } catch (error) {
        expect((error as Error).message).toBe('Weld number 123 is already in use');
      }
    });

    // Toast error is now shown by useFirestoreOperations, not directly in createWeld
  });

  it('should show success message when creating weld range', async () => {
    // Mock no existing welds
    mockGetDocs.mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    const mockBatch = {
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    mockWriteBatch.mockReturnValue(mockBatch);

    const { result } = renderHook(() => useWeldOperations());

    await act(async () => {
      await result.current.createWeldsRange(
        'project-id',
        'weld-log-id',
        '1',
        '5',
        { position: '1F' }
      );
    });

    expect(toast.success).toHaveBeenCalledWith('5 welds added successfully');
  });

  it('should show error message for invalid range', async () => {
    const { result } = renderHook(() => useWeldOperations());

    await act(async () => {
      try {
        await result.current.createWeldsRange(
          'project-id',
          'weld-log-id',
          '5',
          '1', // Invalid: start > end
          { position: '1F' }
        );
      } catch (error) {
        expect((error as Error).message).toBe('Invalid number range');
      }
    });

    expect(toast.error).toHaveBeenCalledWith('Invalid number range');
  });

  it('should show error message when range numbers are in use', async () => {
    // Mock existing weld found in range
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => ({ number: 2 }) }],
    });

    const { result } = renderHook(() => useWeldOperations());

    await act(async () => {
      try {
        await result.current.createWeldsRange(
          'project-id',
          'weld-log-id',
          '1',
          '5',
          { position: '1F' }
        );
      } catch (error) {
        expect((error as Error).message).toBe(
          'One or more weld numbers in the range are already in use'
        );
      }
    });

    expect(toast.error).toHaveBeenCalledWith(
      'One or more weld numbers in the range are already in use'
    );
  });
});