/**
 * MIGRATION NOTES - React Firebase Hooks Migration
 *
 * This file has been partially migrated to use react-firebase-hooks:
 * ✅ useWeld - Uses useDocument hook for single weld fetching
 * ✅ useWelds - Uses useFirestoreOperations for collection queries
 * ✅ createWeld - Migrated to use useFirestoreOperations.create
 * ✅ updateWeld - Migrated to use useFirestoreOperations.update
 * ✅ deleteWeld - Migrated to use useFirestoreOperations.remove
 *
 * Functions that MUST remain using direct SDK:
 * - isWeldNumberAvailable - Called conditionally, hooks can't be used
 * - isWeldNumberRangeAvailable - Called conditionally, hooks can't be used
 * - createWeldsRange - Uses writeBatch for atomic operations
 *
 * This is the optimal hybrid approach for this use case.
 */

import { useDocument } from 'react-firebase-hooks/firestore';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  writeBatch,
  orderBy,
  QueryConstraint,
  FirestoreError,
  WriteBatch,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { type Weld, type WeldFormData } from '@/types';

/**
 * Return type for useWeldOperations hook
 */
interface UseWeldOperationsReturn {
  createWeld: (projectId: string, weldLogId: string, weldData: WeldFormData) => Promise<string>;
  createWeldsRange: (
    projectId: string,
    weldLogId: string,
    startNumber: string,
    endNumber: string,
    sharedData: Partial<WeldFormData>,
    positions?: Record<number, string>
  ) => Promise<string[]>;
  updateWeld: (weldId: string, updates: Partial<Weld>, weldLogId?: string | null) => Promise<void>;
  deleteWeld: (weldId: string) => Promise<void>;
  isWeldNumberAvailable: (weldLogId: string, number: string, currentWeldId?: string | null) => Promise<boolean>;
  isWeldNumberRangeAvailable: (weldLogId: string, start: number, end: number) => Promise<boolean>;
}

/**
 * Collection of hooks for interacting with welds in Firestore
 * Operations are performed on the flat 'welds' collection with projectId and weldLogId references
 */

/**
 * Hook to fetch a single weld's Firestore document
 * @param weldId - The weld document ID
 * @returns Returns:
 *   - Weld document data or null if not found
 *   - Loading state
 *   - Error if any
 */
export const useWeld = (weldId?: string | null): [Weld | null, boolean, FirestoreError | undefined] => {
  const [snapshot, loading, error] = useDocument(
    weldId ? doc(db, 'welds', weldId) : null
  );

  const weld = snapshot?.exists()
    ? { id: snapshot.id, ...snapshot.data() } as Weld
    : null;

  return [weld, loading, error];
};

/**
 * Hook to fetch welds for a specific weld log
 * Only active welds are returned by default
 *
 * @param weldLogId - The weld log document ID
 * @returns Returns:
 *   - Array of weld documents
 *   - Loading state
 *   - Error if any
 */
export const useWelds = (weldLogId?: string | null): [Weld[], boolean, FirestoreError | undefined] => {
  // Build constraints based on weldLogId
  // Default constraints now include ordering by number
  const constraints: QueryConstraint[] = weldLogId
    ? [
        where('weldLogId', '==', weldLogId),
        where('status', '==', 'active'),
        orderBy('number', 'asc'),
      ]
    : [];

  // Use the unified hook
  const { documents, loading, error } = useFirestoreOperations('welds', {
    constraints: weldLogId ? constraints : [], // Only apply constraints if weldLogId is provided
    // requireAuth defaults to true in useFirestoreOperations
  });

  // Return in the expected format [welds, loading, error]
  return [weldLogId ? documents as Weld[] : [], loading, error];
};

/**
 * Hook providing operations for welds (create, update, delete)
 * @returns Object containing weld operation functions
 */
export const useWeldOperations = (): UseWeldOperationsReturn => {
  const { loggedInUser } = useApp();
  const { t } = useTranslation();

  // Get unified CRUD operations
  const weldsOperations = useFirestoreOperations('welds');

  /**
   * Check if a weld number is available (not already used) in the weld log
   * NOTE: This function uses getDocs() directly instead of hooks because:
   * - It's a utility function called conditionally based on user input
   * - React hooks cannot be called inside async functions or conditionally
   * - This is a validation check, not a component that needs real-time updates
   * @param weldLogId - The weld log ID
   * @param number - The weld number to check
   * @param currentWeldId - Optional ID of current weld (for edit mode)
   * @returns True if the number is available, false otherwise
   */
  const isWeldNumberAvailable = async (
    weldLogId: string,
    number: string,
    currentWeldId: string | null = null
  ): Promise<boolean> => {
    if (!weldLogId || !number) return false;

    const q = query(
      collection(db, 'welds'),
      where('weldLogId', '==', weldLogId),
      where('number', '==', number),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);

    // If no documents found, the number is available
    if (querySnapshot.empty) return true;

    // If in edit mode and the only match is the current weld, the number is available
    if (
      currentWeldId &&
      querySnapshot.size === 1 &&
      querySnapshot.docs[0].id === currentWeldId
    ) {
      return true;
    }

    // Otherwise, the number is already in use
    return false;
  };

  /**
   * Check if a range of weld numbers is available
   * NOTE: This function uses getDocs() directly - see isWeldNumberAvailable for reasons
   * @param weldLogId - The weld log ID
   * @param start - Start of number range
   * @param end - End of number range
   * @returns True if all numbers in range are available
   */
  const isWeldNumberRangeAvailable = async (weldLogId: string, start: number, end: number): Promise<boolean> => {
    if (!weldLogId || isNaN(start) || isNaN(end) || start > end) return false;

    // Fetch all welds for the weld log once
    const q = query(
      collection(db, 'welds'),
      where('weldLogId', '==', weldLogId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    const existingNumbers = new Set(
      querySnapshot.docs.map((d) => parseInt(d.data().number, 10))
    );

    // Check if any number in the new range already exists
    for (let i = start; i <= end; i++) {
      if (existingNumbers.has(i)) {
        return false; // Found an existing weld, so range is not available
      }
    }

    // If loop completes, no overlapping numbers were found
    return true;
  };

  /**
   * Create a new weld
   * @param projectId - The project ID
   * @param weldLogId - The weld log ID
   * @param weldData - The weld data
   * @returns The ID of the created weld
   */
  const createWeld = async (projectId: string, weldLogId: string, weldData: WeldFormData): Promise<string> => {
    if (!loggedInUser)
      throw new Error('User must be logged in to create welds');

    // Verify the weld number is available
    const isAvailable = await isWeldNumberAvailable(weldLogId, weldData.number || '');
    if (!isAvailable) {
      throw new Error(t('welds.numberInUse', { number: weldData.number }));
    }

    // Add projectId and weldLogId to the weld data
    const newWeld = {
      ...weldData,
      projectId, // Add foreign key
      weldLogId, // Add foreign key
    };

    // Use the unified create operation
    // Error toast is already shown by useFirestoreOperations if it fails
    const docId = await weldsOperations.create(newWeld);
    return docId;
  };

  /**
   * Create multiple welds with sequential numbers
   * NOTE: This function uses writeBatch() directly instead of hooks because:
   * - Batch operations are transactional and must complete atomically
   * - React hooks cannot be used for batch operations
   * - This is a one-time creation operation, not a component needing updates
   * @param projectId - The project ID
   * @param weldLogId - The weld log ID
   * @param startNumber - Start of number range
   * @param endNumber - End of number range
   * @param sharedData - Data common to all welds
   * @param positions - Optional positions object
   * @returns Array of created weld IDs
   */
  const createWeldsRange = async (
    projectId: string,
    weldLogId: string,
    startNumber: string,
    endNumber: string,
    sharedData: Partial<WeldFormData>,
    positions: Record<number, string> = {}
  ): Promise<string[]> => {
    try {
      if (!loggedInUser)
        throw new Error('User must be logged in to create welds');

      // Convert to numbers for iteration
      const start = parseInt(startNumber, 10);
      const end = parseInt(endNumber, 10);

      if (isNaN(start) || isNaN(end) || start > end) {
        throw new Error(t('welds.invalidRange'));
      }

      // Check if all numbers in the range are available
      const isAvailable = await isWeldNumberRangeAvailable(
        weldLogId,
        start,
        end
      );
      if (!isAvailable) {
        throw new Error(t('welds.rangeInUse'));
      }

      // Create a batch operation for better performance
      const batch: WriteBatch = writeBatch(db);
      const createdIds: string[] = [];
      const timestamp = new Date(); // Use the same timestamp for all welds

      for (let i = start; i <= end; i++) {
        const number = i.toString();
        const newWeldRef: DocumentReference = doc(collection(db, 'welds'));
        const docId = newWeldRef.id;

        createdIds.push(docId);

        const newWeld = {
          id: docId, // Add explicit id field matching document ID
          number,
          ...sharedData,
          // Use position from positions object if provided, otherwise use shared position
          position: positions[i] || sharedData.position || '',
          projectId, // Add foreign key
          weldLogId, // Add foreign key
          status: 'active',
          createdAt: timestamp,
          createdBy: loggedInUser.uid,
          updatedAt: timestamp,
          updatedBy: loggedInUser.uid,
        };

        batch.set(newWeldRef, newWeld);
      }

      // Commit the batch
      await batch.commit();
      const count = end - start + 1;
      toast.success(t('welds.createRangeSuccess', { count }));
      return createdIds;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('welds.createRangeError');
      toast.error(message);
      throw error;
    }
  };

  /**
   * Update an existing weld
   * @param weldId - The ID of the weld to update
   * @param updates - The fields to update
   * @param weldLogId - The weld log ID (needed for number validation)
   */
  const updateWeld = async (weldId: string, updates: Partial<Weld>, weldLogId: string | null = null): Promise<void> => {
    if (!loggedInUser)
      throw new Error('User must be logged in to update welds');

    // If number is being updated, check that it's available
    if (updates.number && weldLogId) {
      const isAvailable = await isWeldNumberAvailable(
        weldLogId,
        updates.number,
        weldId
      );
      if (!isAvailable) {
        throw new Error(t('welds.numberInUse', { number: updates.number }));
      }
    }

    // Use the unified update operation
    await weldsOperations.update(weldId, updates);
  };

  /**
   * Delete a weld (mark as deleted)
   * @param weldId - The ID of the weld to delete
   */
  const deleteWeld = async (weldId: string): Promise<void> => {
    if (!loggedInUser)
      throw new Error('User must be logged in to delete welds');

    // Use the unified remove operation (soft delete)
    await weldsOperations.remove(weldId, false);
  };

  return {
    createWeld,
    createWeldsRange,
    updateWeld,
    deleteWeld,
    isWeldNumberAvailable,
    isWeldNumberRangeAvailable,
  };
};