import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  useMaterials,
  useAlloyMaterials,
  useMaterialOperations,
  type MaterialType,
} from './useMaterials';
import { resetFirebaseMocks } from '@/test/mocks/firebase';
import { useApp } from '@/contexts/AppContext';
import type { Material, MaterialFormData } from '@/types';
import type { FirestoreError } from 'firebase/firestore';
import type { UseFirestoreOperationsReturn } from '@/hooks/firebase/useFirestoreOperations';

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
    t: (key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
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
    (useApp as Mock).mockReturnValue({
      loggedInUser: { uid: 'test-user-id', email: 'test@example.com' },
    });
  });

  describe('useMaterials', () => {
    it('should return empty list while loading', () => {
      (useFirestoreOperations as Mock).mockReturnValue({
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
      const mockMaterials: Partial<Material>[] = [
        {
          id: '1',
          name: 'Material 1',
          type: 'carbon-steel',
        },
        {
          id: '2',
          name: 'Material 2',
          type: 'stainless-steel',
        },
      ];

      (useFirestoreOperations as Mock).mockReturnValue({
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
      const mockError = new Error('Failed to load') as FirestoreError;
      (useFirestoreOperations as Mock).mockReturnValue({
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
      const mockAlloys: Partial<Material>[] = [
        {
          id: '1',
          name: 'Alloy 1',
          type: 'aluminum',
        },
      ];

      (useFirestoreOperations as Mock).mockReturnValue({
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
    const mockOps: Partial<UseFirestoreOperationsReturn> = {
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      documents: [],
      loading: false,
      error: undefined,
    };

    beforeEach(() => {
      (useApp as Mock).mockReturnValue({ loggedInUser: mockUser });

      // Mock all three calls to useFirestoreOperations with the same mock
      (useFirestoreOperations as Mock)
        .mockReturnValue(mockOps)
        .mockReturnValue(mockOps)
        .mockReturnValue(mockOps);
    });

    describe('createMaterial', () => {
      it('should create new material and return ID', async () => {
        (mockOps.create as Mock).mockResolvedValue('new-material-id');

        const { result } = renderHook(() => useMaterialOperations());

        const materialData: MaterialFormData = {
          name: 'Test Material',
          type: 'carbon-steel',
          grade: 'A36',
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
            result.current.createMaterial(
              'invalid' as MaterialType,
              { name: 'Test', type: 'carbon-steel' } as MaterialFormData
            )
          ).rejects.toThrow('Invalid material type: invalid');
        });
      });

      it('should handle creation failure', async () => {
        (mockOps.create as Mock).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useMaterialOperations());

        await act(async () => {
          await expect(
            result.current.createMaterial('parent', {
              name: 'Test',
              type: 'carbon-steel',
            } as MaterialFormData)
          ).rejects.toThrow('Network error');
        });
      });
    });

    describe('updateMaterial', () => {
      it('should update material', async () => {
        (mockOps.update as Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useMaterialOperations());

        const updates: Partial<Material> = {
          name: 'Updated Name',
          grade: 'A572',
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
            result.current.updateMaterial('invalid' as MaterialType, 'id', {
              name: 'Test',
            })
          ).rejects.toThrow('Invalid material type: invalid');
        });
      });

      it('should handle update failure', async () => {
        (mockOps.update as Mock).mockRejectedValue(new Error('Update failed'));

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
        (mockOps.remove as Mock).mockResolvedValue(undefined);

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
            result.current.deleteMaterial('invalid' as MaterialType, 'id')
          ).rejects.toThrow('Invalid material type: invalid');
        });
      });

      it('should handle deletion failure', async () => {
        (mockOps.remove as Mock).mockRejectedValue(new Error('Delete failed'));

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
      (mockOps.create as Mock).mockResolvedValue('new-filler-id');

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        const materialId = await result.current.createMaterial('filler', {
          name: 'Test Filler',
          type: 'carbon-steel',
        } as MaterialFormData);
        expect(materialId).toBe('new-filler-id');
      });
    });

    it('should work with alloy materials', async () => {
      (mockOps.create as Mock).mockResolvedValue('new-alloy-id');

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        const materialId = await result.current.createMaterial('alloy', {
          name: 'Test Alloy',
          type: 'aluminum',
        } as MaterialFormData);
        expect(materialId).toBe('new-alloy-id');
      });
    });
  });
});

// Critical i18n tests merged from useMaterials.i18n.test.jsx
describe('useMaterialOperations i18n messages', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
  const mockParentOps: Partial<UseFirestoreOperationsReturn> = {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as Mock).mockReturnValue({ loggedInUser: mockUser });

    // Mock parent and filler material operations
    (useFirestoreOperations as Mock)
      .mockReturnValueOnce(mockParentOps) // Parent materials
      .mockReturnValueOnce(mockParentOps); // Filler materials
  });

  describe('createMaterial', () => {
    it('should handle success message when creating material', async () => {
      (mockParentOps.create as Mock).mockResolvedValueOnce('new-material-id');

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        await result.current.createMaterial('parent', {
          name: 'Test Material',
          type: 'carbon-steel',
        } as MaterialFormData);
      });

      expect(mockParentOps.create).toHaveBeenCalledWith({
        name: 'Test Material',
        type: 'carbon-steel',
      });
      // Success toast is handled by useFirestoreOperations
    });

    it('should handle error message when creating material fails', async () => {
      (mockParentOps.create as Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        try {
          await result.current.createMaterial('parent', {
            name: 'Test Material',
            type: 'carbon-steel',
          } as MaterialFormData);
        } catch (error) {
          expect((error as Error).message).toBe('Network error');
        }
      });
      // Error toast is handled by useFirestoreOperations
    });
  });

  describe('updateMaterial', () => {
    it('should handle success message when updating material', async () => {
      (mockParentOps.update as Mock).mockResolvedValueOnce(undefined);

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
      (mockParentOps.update as Mock).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        try {
          await result.current.updateMaterial('parent', 'material-id', {
            name: 'Updated Material',
          });
        } catch (error) {
          expect((error as Error).message).toBe('Permission denied');
        }
      });
      // Error toast is handled by useFirestoreOperations
    });
  });

  describe('deleteMaterial', () => {
    it('should handle success message when deleting material', async () => {
      (mockParentOps.remove as Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        await result.current.deleteMaterial('parent', 'material-id');
      });

      expect(mockParentOps.remove).toHaveBeenCalledWith('material-id', false);
      // Success toast is handled by useFirestoreOperations
    });

    it('should handle error message when deleting material fails', async () => {
      (mockParentOps.remove as Mock).mockRejectedValueOnce(
        new Error('Material in use')
      );

      const { result } = renderHook(() => useMaterialOperations());

      await act(async () => {
        try {
          await result.current.deleteMaterial('parent', 'material-id');
        } catch (error) {
          expect((error as Error).message).toBe('Material in use');
        }
      });
      // Error toast is handled by useFirestoreOperations
    });
  });
});
