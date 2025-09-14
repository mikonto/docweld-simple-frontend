import { where, FirestoreError } from 'firebase/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { type Material, type MaterialFormData } from '@/types';

/**
 * Migration Notes:
 *
 * This file demonstrates the migration pattern from react-firebase-hooks to useFirestoreOperations:
 *
 * 1. useMaterials: Migrated to use useFirestoreOperations instead of useCollection
 *    - Replaced direct Firestore queries with useFirestoreOperations(collectionPath, { constraints })
 *    - Returns [documents, loading, error] tuple
 *
 * 2. useAlloyMaterials: Simplified version using the same pattern as useMaterials
 *    - No longer needs try-catch for query construction
 *    - Error handling is now centralized in useFirestoreOperations
 *
 * 3. useMaterialOperations: Delegates all CRUD operations to useFirestoreOperations
 *    - Maintains the same API surface (createMaterial, updateMaterial, deleteMaterial)
 *    - Each material type gets its own useFirestoreOperations instance to maintain hook call consistency
 *    - Soft delete is implemented by passing false to the remove function
 *
 * Benefits of this migration:
 * - Consistent error handling and loading states across the application
 * - Centralized Firestore logic with automatic timestamp management
 * - Better testability with cleaner mocking patterns
 * - Reduced boilerplate code
 */

/**
 * Valid material types
 */
export type MaterialType = 'parent' | 'filler' | 'alloy';

/**
 * Material collection mapping
 */
const COLLECTION_MAP: Record<MaterialType, string> = {
  parent: 'parent-materials',
  filler: 'filler-materials',
  alloy: 'alloy-materials',
} as const;

/**
 * Return type for material operations hook
 */
interface UseMaterialOperationsReturn {
  createMaterial: (
    materialType: MaterialType,
    materialData: MaterialFormData
  ) => Promise<string>;
  updateMaterial: (
    materialType: MaterialType,
    materialId: string,
    updates: Partial<Material>
  ) => Promise<void>;
  deleteMaterial: (
    materialType: MaterialType,
    materialId: string
  ) => Promise<void>;
}

/**
 * Hook to fetch materials from a specific material type collection
 * @param materialType - The type of material ("parent", "filler", "alloy")
 * @returns Returns:
 *   - Array of material documents
 *   - Loading state
 *   - Error if any
 */
export const useMaterials = (
  materialType: MaterialType
): [Material[], boolean, FirestoreError | undefined] => {
  const collectionPath = COLLECTION_MAP[materialType];

  // Use useFirestoreOperations with active status constraint
  const { documents, loading, error } = useFirestoreOperations(collectionPath, {
    constraints: [where('status', '==', 'active')],
  });

  return [documents as Material[], loading, error];
};

/**
 * Hook to fetch all active alloy materials for use in dropdowns
 * @returns Returns:
 *   - Array of alloy material documents
 *   - Loading state
 *   - Error if any
 */
export const useAlloyMaterials = (): [
  Material[],
  boolean,
  FirestoreError | undefined,
] => {
  // Use useFirestoreOperations with active status constraint
  const { documents, loading, error } = useFirestoreOperations(
    'alloy-materials',
    {
      constraints: [where('status', '==', 'active')],
    }
  );

  return [documents as Material[], loading, error];
};

/**
 * Hook to create, update, and delete materials
 * @returns Object containing material operation functions
 */
export const useMaterialOperations = (): UseMaterialOperationsReturn => {
  // We need to call useFirestoreOperations for all possible material types
  // to maintain consistent hook calls
  const parentOps = useFirestoreOperations('parent-materials', {
    constraints: [where('status', '==', 'active')],
  });
  const fillerOps = useFirestoreOperations('filler-materials', {
    constraints: [where('status', '==', 'active')],
  });
  const alloyOps = useFirestoreOperations('alloy-materials', {
    constraints: [where('status', '==', 'active')],
  });

  // Map operations by material type
  const opsMap: Record<
    MaterialType,
    ReturnType<typeof useFirestoreOperations>
  > = {
    parent: parentOps,
    filler: fillerOps,
    alloy: alloyOps,
  };

  /**
   * Create a new material
   * @param materialType - The type of material ("parent", "filler", "alloy")
   * @param materialData - The material data
   * @returns The ID of the created material
   */
  const createMaterial = async (
    materialType: MaterialType,
    materialData: MaterialFormData
  ): Promise<string> => {
    const ops = opsMap[materialType];
    if (!ops) {
      throw new Error(`Invalid material type: ${materialType}`);
    }
    return ops.create(materialData);
  };

  /**
   * Update an existing material
   * @param materialType - The type of material ("parent", "filler", "alloy")
   * @param materialId - The ID of the material to update
   * @param updates - The fields to update
   */
  const updateMaterial = async (
    materialType: MaterialType,
    materialId: string,
    updates: Partial<Material>
  ): Promise<void> => {
    const ops = opsMap[materialType];
    if (!ops) {
      throw new Error(`Invalid material type: ${materialType}`);
    }
    return ops.update(materialId, updates);
  };

  /**
   * Mark a material as deleted (soft delete)
   * @param materialType - The type of material ("parent", "filler", "alloy")
   * @param materialId - The ID of the material to delete
   */
  const deleteMaterial = async (
    materialType: MaterialType,
    materialId: string
  ): Promise<void> => {
    const ops = opsMap[materialType];
    if (!ops) {
      throw new Error(`Invalid material type: ${materialType}`);
    }
    return ops.remove(materialId, false); // false = soft delete
  };

  return {
    createMaterial,
    updateMaterial,
    deleteMaterial,
  };
};
