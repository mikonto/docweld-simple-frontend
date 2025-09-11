import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, where, QueryConstraint, FirestoreError } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useCascadingSoftDelete } from '@/hooks/firebase/useCascadingSoftDelete';
import { type WeldLog, type WeldLogFormData } from '@/types';

/**
 * Return type for useWeldLogOperations hook
 */
interface UseWeldLogOperationsReturn {
  createWeldLog: (projectId: string, weldLogData: WeldLogFormData) => Promise<string>;
  updateWeldLog: (weldLogId: string, updates: Partial<WeldLog>) => Promise<void>;
  deleteWeldLog: (weldLogId: string, projectId: string) => Promise<void>;
}

// Collection of hooks for interacting with weld logs in Firestore

/**
 * Hook to fetch a single weld log's Firestore document
 * @param weldLogId - The weld log ID to fetch
 * @returns Returns:
 *   - WeldLog document or null if not found
 *   - Loading state
 *   - Error if any
 */
export const useWeldLog = (weldLogId?: string | null): [WeldLog | null, boolean, FirestoreError | undefined] => {
  const [snapshot, loading, error] = useDocument(
    weldLogId ? doc(db, 'weld-logs', weldLogId) : null
  );

  const weldLog = snapshot?.exists()
    ? { id: snapshot.id, ...snapshot.data() } as WeldLog
    : null;

  return [weldLog, loading, error];
};

/**
 * Hook to fetch weld logs for a specific project
 * @param projectId - The project ID to fetch weld logs for
 * @returns Returns:
 *   - Array of weld log documents
 *   - Loading state
 *   - Error if any
 */
export const useWeldLogs = (projectId?: string | null): [WeldLog[], boolean, FirestoreError | undefined] => {
  // Use useFirestoreOperations with constraints for projectId and active status
  const constraints: QueryConstraint[] = projectId
    ? [where('projectId', '==', projectId), where('status', '==', 'active')]
    : [];

  const { documents, loading, error } = useFirestoreOperations('weld-logs', {
    constraints,
  });

  // If no projectId, return empty results
  if (!projectId) {
    return [[], false, null];
  }

  return [documents as WeldLog[], loading, error];
};

/**
 * Hook providing operations for weld logs (create, update, delete)
 * @returns Object containing weld log operation functions
 */
export const useWeldLogOperations = (): UseWeldLogOperationsReturn => {
  // Use useFirestoreOperations for CRUD operations
  const { create, update } = useFirestoreOperations('weld-logs');

  // Get cascading delete function
  const { deleteWeldLog: cascadeDelete } = useCascadingSoftDelete();

  /**
   * Create a new weld log
   * @param projectId - The project ID to associate with the weld log
   * @param weldLogData - The weld log data
   * @returns The ID of the created weld log
   */
  const createWeldLog = async (projectId: string, weldLogData: WeldLogFormData): Promise<string> => {
    // Add projectId to the weld log data
    const newWeldLogData = {
      ...weldLogData,
      projectId, // Add foreign key reference
    };

    const docId = await create(newWeldLogData);
    return docId;
  };

  /**
   * Update an existing weld log
   * @param weldLogId - The ID of the weld log to update
   * @param updates - The fields to update
   */
  const updateWeldLog = async (weldLogId: string, updates: Partial<WeldLog>): Promise<void> => {
    await update(weldLogId, updates);
  };

  /**
   * Delete a weld log (mark as deleted) and cascade to related data
   * @param weldLogId - The ID of the weld log to delete
   * @param projectId - The project ID (required for cascading)
   */
  const deleteWeldLog = async (weldLogId: string, projectId: string): Promise<void> => {
    await cascadeDelete(weldLogId, projectId);
  };

  return {
    createWeldLog,
    updateWeldLog,
    deleteWeldLog,
  };
};