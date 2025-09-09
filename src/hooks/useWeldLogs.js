import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useCascadingSoftDelete } from '@/hooks/firebase/useCascadingSoftDelete';

// Collection of hooks for interacting with weld logs in Firestore

// Hook to fetch a single weld log's Firestore document
export const useWeldLog = (weldLogId) => {
  const [snapshot, loading, error] = useDocument(
    weldLogId ? doc(db, 'weld-logs', weldLogId) : null
  );

  const weldLog = snapshot?.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;

  return [weldLog, loading, error];
};

// Hook to fetch weld logs for a specific project
export const useWeldLogs = (projectId) => {
  // Use useFirestoreOperations with constraints for projectId and active status
  const constraints = projectId
    ? [where('projectId', '==', projectId), where('status', '==', 'active')]
    : [];

  const { documents, loading, error } = useFirestoreOperations('weld-logs', {
    constraints,
  });

  // If no projectId, return empty results
  if (!projectId) {
    return [[], false, null];
  }

  return [documents, loading, error];
};

// Hook providing operations for weld logs (create, update, delete)
export const useWeldLogOperations = () => {
  // Use useFirestoreOperations for CRUD operations
  const { create, update } = useFirestoreOperations('weld-logs');

  // Get cascading delete function
  const { deleteWeldLog: cascadeDelete } = useCascadingSoftDelete();

  // Create a new weld log
  const createWeldLog = async (projectId, weldLogData) => {
    // Add projectId to the weld log data
    const newWeldLogData = {
      ...weldLogData,
      projectId, // Add foreign key reference
    };

    const docId = await create(newWeldLogData);
    return docId;
  };

  // Update an existing weld log
  const updateWeldLog = async (weldLogId, updates) => {
    await update(weldLogId, updates);
  };

  // Delete a weld log (mark as deleted) and cascade to related data
  const deleteWeldLog = async (weldLogId, projectId) => {
    await cascadeDelete(weldLogId, projectId);
  };

  return {
    createWeldLog,
    updateWeldLog,
    deleteWeldLog,
  };
};
