// src/hooks/documents/useSectionOperations.js
import { useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { useSectionCascadingDelete } from '@/hooks/firebase/useSectionCascadingDelete';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import {
  getNextAscendingOrder,
  getAscendingOrderForPosition,
  moveItemInArray,
  DEFAULT_ORDER,
} from '@/utils/orderManagement';

/**
 * Hook for section operations for document sections
 * @param {string} collectionName - Name of sections collection (e.g., 'project-document-sections')
 * @param {object} foreignKeys - Foreign key values (e.g., { projectId: 'xyz' })
 * @returns {object} Section operations and state
 */
export function useSectionOperations(collectionName, foreignKeys) {
  const { loggedInUser } = useApp();

  // Build constraints for the query
  const constraints = useMemo(() => {
    const result = [];
    Object.entries(foreignKeys).forEach(([key, value]) => {
      if (value) result.push(where(key, '==', value));
    });
    // Add status filter for active sections
    result.push(where('status', '==', 'active'));
    return result;
  }, [foreignKeys]);

  // Use the shared CRUD hook - this provides create, update, remove operations
  const firebaseOps = useFirestoreOperations(collectionName, {
    constraints,
  });

  // Get cascading delete functions
  const { deleteProjectSection, deleteLibrarySection } =
    useSectionCascadingDelete();

  /**
   * Get the next order value for a new section
   * @returns {number} Next order value
   */
  const getNextOrderValue = useCallback(async () => {
    try {
      // Build query with foreign key constraints
      let q = collection(db, collectionName);

      const queryConstraints = [...constraints];
      queryConstraints.push(orderBy('order', 'desc'));

      q = query(q, ...queryConstraints);

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return DEFAULT_ORDER;
      }

      const highestOrder = snapshot.docs[0].data().order || 0;
      return getNextAscendingOrder(highestOrder);
    } catch {
      return DEFAULT_ORDER;
    }
  }, [collectionName, constraints]);

  /**
   * Add a new section
   * @param {string} name - Section name
   * @param {string} description - Section description
   * @returns {object} Created section data
   */
  const addSection = useCallback(
    async (name, description = '') => {
      const nextOrder = await getNextOrderValue();
      const sectionId = doc(collection(db, collectionName)).id;

      const newSectionData = {
        id: sectionId,
        name,
        description,
        order: nextOrder,

        // Foreign keys
        ...foreignKeys,

        // Section metadata
        status: 'active',
        documentIds: [],

        // Timestamps are handled by useFirestoreOperations
      };

      // Use the create method from useFirestoreOperations
      // It will add timestamps and user tracking automatically
      await firebaseOps.create(newSectionData);

      // Return success result
      return { id: sectionId, ...newSectionData };
    },
    [collectionName, foreignKeys, firebaseOps, getNextOrderValue]
  );

  /**
   * Rename a section
   * @param {string} sectionId - ID of the section to rename
   * @param {string} newName - New name for the section
   */
  const renameSection = useCallback(
    async (sectionId, newName) => {
      try {
        // Use the update method from useFirestoreOperations
        // It will handle timestamps and user tracking automatically
        await firebaseOps.update(sectionId, {
          name: newName,
        });

        // Return success result
        return { success: true };
      } catch (err) {
        // Return error result
        return { success: false, error: err };
      }
    },
    [firebaseOps]
  );

  /**
   * Soft delete a section (with cascade delete for all documents)
   * @param {string} sectionId - ID of the section to delete
   */
  const deleteSection = useCallback(
    async (sectionId) => {
      try {
        // Determine which cascade delete operation to use
        if (collectionName === 'project-document-sections') {
          // Use unified project section cascade delete
          const result = await deleteProjectSection(
            sectionId,
            foreignKeys.projectId
          );
          // Return success result with count
          return { success: true, deletedCount: result.deletedCount };
        } else if (collectionName === 'library-document-sections') {
          // Use unified library section cascade delete
          const result = await deleteLibrarySection(
            sectionId,
            foreignKeys.libraryId
          );
          // Return success result with count
          return { success: true, deletedCount: result.deletedCount };
        } else {
          // Fallback to simple soft delete using useFirestoreOperations
          await firebaseOps.remove(sectionId, false); // false = soft delete
          // Return success result
          return { success: true };
        }
      } catch (err) {
        // Return error result with specific error type
        let errorType = 'general';
        if (err.message && err.message.includes('requires an index')) {
          errorType = 'indexError';
        } else if (
          err.message &&
          err.message.includes('Batch operation limit exceeded')
        ) {
          errorType = 'batchLimitError';
        }
        return { success: false, error: err, errorType };
      }
    },
    [
      collectionName,
      foreignKeys,
      firebaseOps,
      deleteProjectSection,
      deleteLibrarySection,
    ]
  );

  /**
   * Update section order using numeric values
   * @param {Array} orderedSectionIds - Array of section IDs in new order
   */
  const updateSectionOrder = useCallback(
    async (orderedSectionIds) => {
      try {
        const batch = writeBatch(db);

        // Update each section with new order value
        orderedSectionIds.forEach((sectionId, index) => {
          const sectionRef = doc(db, collectionName, sectionId);
          batch.update(sectionRef, {
            order: getAscendingOrderForPosition(index),
            updatedAt: serverTimestamp(),
            updatedBy: loggedInUser?.uid || 'unknown',
          });
        });

        await batch.commit();
        // Return success result
        return { success: true };
      } catch (err) {
        // Return error result
        return { success: false, error: err };
      }
    },
    [collectionName, loggedInUser]
  );

  /**
   * Move a section (update order between two sections)
   * @param {string} sectionId - ID of section to move
   * @param {string} direction - 'up' or 'down'
   * @param {Array} currentOrder - Current ordered array of sections
   */
  const moveSection = useCallback(
    async (sectionId, direction, currentOrder) => {
      const reorderedSections = moveItemInArray(
        currentOrder,
        sectionId,
        direction
      );

      if (!reorderedSections) return; // Invalid move

      // Update order
      await updateSectionOrder(reorderedSections.map((s) => s.id));
    },
    [updateSectionOrder]
  );

  return {
    // Expose the underlying Firestore operations data
    sections: firebaseOps.documents,
    loading: firebaseOps.loading,
    error: firebaseOps.error,

    // Section-specific operations
    addSection,
    renameSection,
    deleteSection,
    updateSectionOrder,
    moveSection,
  };
}
