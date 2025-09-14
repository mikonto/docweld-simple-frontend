// src/hooks/documents/useSectionOperations.ts
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
  QueryConstraint,
  DocumentData,
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

interface SectionOperationResult {
  success: boolean;
  error?: unknown;
  deletedCount?: number;
  errorType?: string;
  id?: string;
}

interface SectionData extends DocumentData {
  id: string;
  name: string;
  description: string;
  order: number;
  status: string;
  documentIds: string[];
}

export interface UseSectionOperationsReturn {
  sections: DocumentData[];
  loading: boolean;
  error: Error | null;
  addSection: (name: string, description?: string) => Promise<SectionData>;
  renameSection: (
    sectionId: string,
    newName: string
  ) => Promise<SectionOperationResult>;
  deleteSection: (sectionId: string) => Promise<SectionOperationResult>;
  updateSectionOrder: (
    orderedSectionIds: string[]
  ) => Promise<SectionOperationResult>;
  moveSection: (
    sectionId: string,
    direction: 'up' | 'down',
    currentOrder: DocumentData[]
  ) => Promise<void>;
}

/**
 * Hook for section operations for document sections
 */
export function useSectionOperations(
  collectionName: string,
  foreignKeys: Record<string, string | null>
): UseSectionOperationsReturn {
  const { loggedInUser } = useApp();

  // Build constraints for the query
  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];
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
   */
  const getNextOrderValue = useCallback(async (): Promise<number> => {
    try {
      // Build query with foreign key constraints
      const queryConstraints = [...constraints];
      queryConstraints.push(orderBy('order', 'desc'));

      const q = query(collection(db, collectionName), ...queryConstraints);
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
   */
  const addSection = useCallback(
    async (name: string, description: string = ''): Promise<SectionData> => {
      const nextOrder = await getNextOrderValue();
      const sectionId = doc(collection(db, collectionName)).id;

      const newSectionData: SectionData = {
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
      return newSectionData;
    },
    [collectionName, foreignKeys, firebaseOps, getNextOrderValue]
  );

  /**
   * Rename a section
   */
  const renameSection = useCallback(
    async (
      sectionId: string,
      newName: string
    ): Promise<SectionOperationResult> => {
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
   */
  const deleteSection = useCallback(
    async (sectionId: string): Promise<SectionOperationResult> => {
      try {
        // Determine which cascade delete operation to use
        if (collectionName === 'project-document-sections') {
          // Use unified project section cascade delete
          const result = await deleteProjectSection(
            sectionId,
            foreignKeys.projectId as string
          );
          // Return success result with count
          return { success: true, deletedCount: result.deletedCount };
        } else if (collectionName === 'library-document-sections') {
          // Use unified library section cascade delete
          const result = await deleteLibrarySection(
            sectionId,
            foreignKeys.libraryId as string
          );
          // Return success result with count
          return { success: true, deletedCount: result.deletedCount };
        } else {
          // Fallback to simple soft delete using useFirestoreOperations
          await firebaseOps.remove(sectionId, false); // false = soft delete
          // Return success result
          return { success: true };
        }
      } catch (err: unknown) {
        // Return error result with specific error type
        let errorType = 'general';
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('requires an index')) {
          errorType = 'indexError';
        } else if (errorMessage.includes('Batch operation limit exceeded')) {
          errorType = 'batchLimitError';
        }
        return { success: false, error: err as Error, errorType };
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
   */
  const updateSectionOrder = useCallback(
    async (orderedSectionIds: string[]): Promise<SectionOperationResult> => {
      try {
        const batch = writeBatch(db);

        // Update each section with new order value
        orderedSectionIds.forEach((sectionId, index) => {
          const sectionRef = doc(db, collectionName, sectionId);
          batch.update(sectionRef, {
            order: getAscendingOrderForPosition(index),
            updatedAt: serverTimestamp(),
            updatedBy: loggedInUser?.id || 'unknown',
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
   */
  const moveSection = useCallback(
    async (
      sectionId: string,
      direction: 'up' | 'down',
      currentOrder: DocumentData[]
    ): Promise<void> => {
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
    error: firebaseOps.error || null,

    // Section-specific operations
    addSection,
    renameSection,
    deleteSection,
    updateSectionOrder,
    moveSection,
  };
}
