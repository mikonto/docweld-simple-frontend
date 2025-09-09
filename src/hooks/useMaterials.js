import { where } from "firebase/firestore";
import { useFirestoreOperations } from "@/hooks/firebase/useFirestoreOperations";

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
 * Hook to fetch materials from a specific material type collection
 * @param {string} materialType - The type of material ("parent", "filler", "alloy")
 * @returns {[Object[], boolean, Error | undefined]} - Returns:
 *   - Array of material documents
 *   - Loading state
 *   - Error if any
 */

export const useMaterials = (materialType) => {
  // Map material types to flat collection paths (kebab-case)
  const collectionMap = {
    parent: "parent-materials",
    filler: "filler-materials", 
    alloy: "alloy-materials",
  };

  const collectionPath = collectionMap[materialType] || collectionMap.parent;

  // Use useFirestoreOperations with active status constraint
  const { documents, loading, error } = useFirestoreOperations(collectionPath, {
    constraints: [where("status", "==", "active")],
  });

  return [documents, loading, error];
};

/**
 * Hook to fetch all active alloy materials for use in dropdowns
 * @returns {[Object[], boolean, Error | undefined]} - Returns:
 *   - Array of alloy material documents
 *   - Loading state
 *   - Error if any
 */
export const useAlloyMaterials = () => {
  // Use useFirestoreOperations with active status constraint
  const { documents, loading, error } = useFirestoreOperations("alloy-materials", {
    constraints: [where("status", "==", "active")],
  });

  return [documents, loading, error];
};

/**
 * Hook to create, update, and delete materials
 * @returns {Object} Object containing material operation functions
 */
export const useMaterialOperations = () => {
  // We need to call useFirestoreOperations for all possible material types
  // to maintain consistent hook calls
  const parentOps = useFirestoreOperations("parent-materials", {
    constraints: [where("status", "==", "active")],
  });
  const fillerOps = useFirestoreOperations("filler-materials", {
    constraints: [where("status", "==", "active")],
  });
  const alloyOps = useFirestoreOperations("alloy-materials", {
    constraints: [where("status", "==", "active")],
  });

  // Map operations by material type
  const opsMap = {
    parent: parentOps,
    filler: fillerOps,
    alloy: alloyOps,
  };

  /**
   * Create a new material
   * @param {string} materialType - The type of material ("parent", "filler", "alloy")
   * @param {Object} materialData - The material data
   * @returns {Promise<string>} The ID of the created material
   */
  const createMaterial = async (materialType, materialData) => {
    const ops = opsMap[materialType];
    if (!ops) {
      throw new Error(`Invalid material type: ${materialType}`);
    }
    return ops.create(materialData);
  };

  /**
   * Update an existing material
   * @param {string} materialType - The type of material ("parent", "filler", "alloy")
   * @param {string} materialId - The ID of the material to update
   * @param {Object} updates - The fields to update
   */
  const updateMaterial = async (materialType, materialId, updates) => {
    const ops = opsMap[materialType];
    if (!ops) {
      throw new Error(`Invalid material type: ${materialType}`);
    }
    return ops.update(materialId, updates);
  };

  /**
   * Mark a material as deleted (soft delete)
   * @param {string} materialType - The type of material ("parent", "filler", "alloy")
   * @param {string} materialId - The ID of the material to delete
   */
  const deleteMaterial = async (materialType, materialId) => {
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
