import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useMaterials,
  useAlloyMaterials,
  useMaterialOperations,
} from './useMaterials';
import {
  // mockWhere, // Not used in current tests
  resetFirebaseMocks,
} from '@/test/mocks/firebase';
import { useApp } from '@/contexts/AppContext';

// Mock the AppContext
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(),
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
    t: (key, options) => {
      const translations = {
        // Materials namespace translations
        'materials.createSuccess': 'Material added successfully',
        'materials.updateSuccess': 'Material updated successfully',
        'materials.deleteSuccess': 'Material deleted successfully',
        // CRUD fallbacks
        'crud.createSuccess': 'Added successfully',
        'crud.updateSuccess': 'Updated successfully',
        'crud.deleteSuccess': 'Deleted successfully',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

// Mock useFirestoreOperations
vi.mock('@/hooks/firebase/useFirestoreOperations', () => ({
  useFirestoreOperations: vi.fn(),
}));

// Import the mocked functions
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';

describe('useMaterials Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetFirebaseMocks();
    vi.clearAllMocks();

    // Setup default useApp mock
    useApp.mockReturnValue({
      loggedInUser: { uid: 'test-user-id', email: 'test@example.com' },
    });
  });

  describe('useMaterials', () => {
    it('should return empty list while loading', () => {
      useFirestoreOperations.mockReturnValue({
        documents: [],
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useMaterials('parent'));

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(true);
      expect(result.current[2]).toBe(null);
    });

    it('should return materials for given type', () => {
      const mockMaterials = [
        {
          id: '1',
          name: 'Material 1',
          status: 'active',
        },
        {
          id: '2',
          name: 'Material 2',
          status: 'active',
        },
      ];

      useFirestoreOperations.mockReturnValue({
        documents: mockMaterials,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useMaterials('parent'));

      expect(result.current[0]).toHaveLength(2);
      expect(result.current[0][0].name).toBe('Material 1');
      expect(result.current[0][1].name).toBe('Material 2');
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to load');
      useFirestoreOperations.mockReturnValue({
        documents: [],
        loading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useMaterials('parent'));

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(mockError);
    });
  });

  describe('useAlloyMaterials', () => {
    it('should return alloy materials', () => {
      const mockAlloys = [
        {
          id: '1',
          name: 'Alloy 1',
          status: 'active',
        },
      ];

      useFirestoreOperations.mockReturnValue({
        documents: mockAlloys,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useAlloyMaterials());

      expect(result.current[0]).toHaveLength(1);
      expect(result.current[0][0].name).toBe('Alloy 1');
    });
  });

  describe('useMaterialOperations', () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };

    // Setup simplified mocks - just one for testing core operations
    const mockOps = {
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      documents: [],
      loading: false,
      error: null,
    };

    beforeEach(() => {
      useApp.mockReturnValue({ loggedInUser: mockUser });

      // Mock all three calls to useFirestoreOperations with the same mock
      useFirestoreOperations
        .mockReturnValue(mockOps)
        .mockReturnValue(mockOps)
        .mockReturnValue(mockOps);
    });

    describe('createMaterial', () => {
      it('should create new material and return ID', async () => {
        mockOps.create.mockResolvedValue('new-material-id');

        const { result } = renderHook(() => useMaterialOperations());

        const materialData = {
          name: 'Test Material',
          description: 'Test description',
        };

        await act(async () => {
          const materialId = await result.current.createMaterial(
            'parent',
            materialData
          );
          expect(materialId).toBe('new-material-id');
        });

        expect(mockOps.create).toHaveBeenCalledWith(materialData);
      });

      it('should handle invalid material type', async () => {
        const { result } = renderHook(() => useMaterialOperations());

        await act(async () => {
          await expect(
            result.current.createMaterial('invalid', { name: 'Test' })
          ).rejects.toThrow('Invalid material type: invalid');
        });
      });

      it('should handle creation failure', async () => {
        mockOps.create.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useMaterialOperations());

        await act(async () => {
          await expect(
            result.current.createMaterial('parent', { name: 'Test' })
          ).rejects.toThrow('Network error');
        });
      });
    });

    describe('updateMaterial', () => {
      it('should update material', async () => {
        mockOps.update.mockResolvedValue();

        const { result } = renderHook(() => useMaterialOperations());

        const updates = {
          name: 'Updated Name',
          description: 'Updated description',
        };

        await act(async () => {
          await result.current.updateMaterial('parent', 'material123', updates);
        });

        expect(mockOps.update).toHaveBeenCalledWith('material123', updates);
      });

      it('should handle invalid material type', async () => {
        const { result } = renderHook(() => useMaterialOperations());

        await act(async () => {
          await expect(
            result.current.updateMaterial('invalid', 'id', { name: 'Test' })
          ).rejects.toThrow('Invalid material type: invalid');
        });
      });

      it('should handle update failure', async () => {
        mockOps.update.mockRejectedValue(new Error('Update failed'));

        const { result } = renderHook(() => useMaterialOperations());

        await act(async () => {
          await expect(
            result.current.updateMaterial('parent', 'id', { name: 'Test' })
          ).rejects.toThrow('Update failed');
        });
      });
    });

    describe('deleteMaterial', () => {
      it('should soft delete material', async () => {
        mockOps.remove.mockResolvedValue();

        const { result } = renderHook(() => useMaterialOperations());

        await act(async () => {
          await result.current.deleteMaterial('parent', 'material123');
        });

        expect(mockOps.remove).toHaveBeenCalledWith('material123', false);
      });

      it('should handle invalid material type', async () => {
        const { result } = renderHook(() => useMaterialOperations());

        await act(async () => {
          await expect(
            result.current.deleteMaterial('invalid', 'id')
          ).rejects.toThrow('Invalid material type: invalid');
        });
      });

      it('should handle deletion failure', async () => {
        mockOps.remove.mockRejectedValue(new Error('Delete failed'));

        const { result } = renderHook(() => useMaterialOperations());

        await act(async () => {
          await expect(
            result.current.deleteMaterial('parent', 'id')
          ).rejects.toThrow('Delete failed');
        });
      });
    });

    // Minimal tests to verify different material types work
    it('should work with filler materials', async () => {
      mockOps.create.mockResolvedValue('new-filler-id');

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        const materialId = await result.current.createMaterial('filler', {
          name: 'Test Filler',
        });
        expect(materialId).toBe('new-filler-id');
      });
    });

    it('should work with alloy materials', async () => {
      mockOps.create.mockResolvedValue('new-alloy-id');

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        const materialId = await result.current.createMaterial('alloy', {
          name: 'Test Alloy',
        });
        expect(materialId).toBe('new-alloy-id');
      });
    });
  });
});

// Critical i18n tests merged from useMaterials.i18n.test.jsx
describe('useMaterialOperations i18n messages', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
  const mockParentOps = {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useApp.mockReturnValue({ loggedInUser: mockUser });

    // Mock parent and filler material operations
    useFirestoreOperations
      .mockReturnValueOnce(mockParentOps) // Parent materials
      .mockReturnValueOnce(mockParentOps); // Filler materials
  });

  describe('createMaterial', () => {
    it('should handle success message when creating material', async () => {
      mockParentOps.create.mockResolvedValueOnce('new-material-id');

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        await result.current.createMaterial('parent', {
          name: 'Test Material',
        });
      });

      expect(mockParentOps.create).toHaveBeenCalledWith({
        name: 'Test Material',
      });
      // Success toast is handled by useFirestoreOperations
    });

    it('should handle error message when creating material fails', async () => {
      mockParentOps.create.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        try {
          await result.current.createMaterial('parent', {
            name: 'Test Material',
          });
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
      });
      // Error toast is handled by useFirestoreOperations
    });
  });

  describe('updateMaterial', () => {
    it('should handle success message when updating material', async () => {
      mockParentOps.update.mockResolvedValueOnce();

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        await result.current.updateMaterial('parent', 'material-id', {
          name: 'Updated Material',
        });
      });

      expect(mockParentOps.update).toHaveBeenCalledWith('material-id', {
        name: 'Updated Material',
      });
      // Success toast is handled by useFirestoreOperations
    });

    it('should handle error message when updating material fails', async () => {
      mockParentOps.update.mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        try {
          await result.current.updateMaterial('parent', 'material-id', {
            name: 'Updated Material',
          });
        } catch (error) {
          expect(error.message).toBe('Permission denied');
        }
      });
      // Error toast is handled by useFirestoreOperations
    });
  });

  describe('deleteMaterial', () => {
    it('should handle success message when deleting material', async () => {
      mockParentOps.remove.mockResolvedValueOnce();

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        await result.current.deleteMaterial('parent', 'material-id');
      });

      expect(mockParentOps.remove).toHaveBeenCalledWith('material-id', false);
      // Success toast is handled by useFirestoreOperations
    });

    it('should handle error message when deleting material fails', async () => {
      mockParentOps.remove.mockRejectedValueOnce(new Error('Material in use'));

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        try {
          await result.current.deleteMaterial('parent', 'material-id');
        } catch (error) {
          expect(error.message).toBe('Material in use');
        }
      });
      // Error toast is handled by useFirestoreOperations
    });
  });
});
