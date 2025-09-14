import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  doc,
  WriteBatch,
  DocumentReference,
  DocumentData,
  FieldValue,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { STATUS, COLLECTIONS } from '@/constants/firestore';

// Firestore technical limits
const FIRESTORE_IN_QUERY_LIMIT = 30; // Max items for 'in' operator
const FIRESTORE_BATCH_LIMIT = 500; // Max operations per batch

/**
 * Batch operation updates interface
 */
interface BatchUpdate {
  status: string;
  updatedAt: FieldValue;
  updatedBy: string;
}

/**
 * Return type for useCascadingSoftDelete hook
 */
interface UseCascadingSoftDeleteReturn {
  deleteProject: (projectId: string) => Promise<boolean>;
  deleteWeldLog: (weldLogId: string) => Promise<boolean>;
  deleteDocumentLibrary: (libraryId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  deleteMaterial: (
    materialId: string,
    materialType: 'parent' | 'filler' | 'alloy'
  ) => Promise<boolean>;
}

/**
 * Hook for cascading soft deletes across related Firestore collections
 * When a parent entity is deleted, all related child entities are also soft-deleted
 */
export function useCascadingSoftDelete(): UseCascadingSoftDeleteReturn {
  const { loggedInUser } = useApp();
  const { t } = useTranslation();

  /**
   * Soft delete a project and all its related data
   * @param projectId - The project ID to delete
   */
  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      let batch: WriteBatch = writeBatch(db);
      let operationCount = 0;
      const batches: WriteBatch[] = [];
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Helper to manage batch size limits
      const addBatchOperation = (
        docRef: DocumentReference<DocumentData>,
        updates: BatchUpdate
      ) => {
        if (operationCount >= FIRESTORE_BATCH_LIMIT) {
          batches.push(batch);
          batch = writeBatch(db);
          operationCount = 0;
        }
        batch.update(docRef, { ...updates });
        operationCount++;
      };

      // Delete the project itself
      const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
      addBatchOperation(projectRef, {
        status: STATUS.DELETED,
        updatedAt: timestamp,
        updatedBy: deletedBy,
      });

      // Delete all project participants
      const participantsQuery = query(
        collection(db, COLLECTIONS.PROJECT_PARTICIPANTS),
        where('projectId', '==', projectId),
        where('status', '!=', STATUS.DELETED)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      participantsSnapshot.forEach((document) => {
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Delete all weld logs
      const weldLogsQuery = query(
        collection(db, COLLECTIONS.WELD_LOGS),
        where('projectId', '==', projectId),
        where('status', '!=', STATUS.DELETED)
      );
      const weldLogsSnapshot = await getDocs(weldLogsQuery);
      const weldLogIds: string[] = [];
      weldLogsSnapshot.forEach((document) => {
        weldLogIds.push(document.id);
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Delete all welds for each weld log (handle Firestore 'in' query limit)
      if (weldLogIds.length > 0) {
        // Process weldLogIds in chunks to avoid Firestore 'in' query limit
        for (let i = 0; i < weldLogIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
          const chunk = weldLogIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
          const weldsQuery = query(
            collection(db, COLLECTIONS.WELDS),
            where('projectId', '==', projectId),
            where('weldLogId', 'in', chunk),
            where('status', '!=', STATUS.DELETED)
          );
          const weldsSnapshot = await getDocs(weldsQuery);
          weldsSnapshot.forEach((document) => {
            addBatchOperation(document.ref, {
              status: STATUS.DELETED,
              updatedAt: timestamp,
              updatedBy: deletedBy,
            });
          });
        }
      }

      // Delete all project document sections
      const sectionsQuery = query(
        collection(db, COLLECTIONS.PROJECT_DOCUMENT_SECTIONS),
        where('projectId', '==', projectId),
        where('status', '!=', STATUS.DELETED)
      );
      const sectionsSnapshot = await getDocs(sectionsQuery);
      sectionsSnapshot.forEach((document) => {
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Delete all project documents
      const documentsQuery = query(
        collection(db, COLLECTIONS.PROJECT_DOCUMENTS),
        where('projectId', '==', projectId),
        where('status', '!=', STATUS.DELETED)
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      documentsSnapshot.forEach((document) => {
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Delete all weld log documents
      const weldLogDocsQuery = query(
        collection(db, COLLECTIONS.WELD_LOG_DOCUMENTS),
        where('projectId', '==', projectId),
        where('status', '!=', STATUS.DELETED)
      );
      const weldLogDocsSnapshot = await getDocs(weldLogDocsQuery);
      weldLogDocsSnapshot.forEach((document) => {
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Add current batch to batches array
      if (operationCount > 0) {
        batches.push(batch);
      }

      // Commit all batches
      for (const batchToCommit of batches) {
        await batchToCommit.commit();
      }

      toast.success(t('projects.deleteSuccess'));
      return true;
    } catch (error) {
      toast.error(t('projects.deleteError'));
      throw error;
    }
  };

  /**
   * Soft delete a weld log and all its related data
   * @param weldLogId - The weld log ID to delete
   */
  const deleteWeldLog = async (weldLogId: string): Promise<boolean> => {
    try {
      let batch: WriteBatch = writeBatch(db);
      let operationCount = 0;
      const batches: WriteBatch[] = [];
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Helper to manage batch size limits
      const addBatchOperation = (
        docRef: DocumentReference<DocumentData>,
        updates: BatchUpdate
      ) => {
        if (operationCount >= FIRESTORE_BATCH_LIMIT) {
          batches.push(batch);
          batch = writeBatch(db);
          operationCount = 0;
        }
        batch.update(docRef, { ...updates });
        operationCount++;
      };

      // Delete the weld log itself
      const weldLogRef = doc(db, COLLECTIONS.WELD_LOGS, weldLogId);
      addBatchOperation(weldLogRef, {
        status: STATUS.DELETED,
        updatedAt: timestamp,
        updatedBy: deletedBy,
      });

      // Delete all welds in this weld log
      const weldsQuery = query(
        collection(db, COLLECTIONS.WELDS),
        where('weldLogId', '==', weldLogId),
        where('status', '!=', STATUS.DELETED)
      );
      const weldsSnapshot = await getDocs(weldsQuery);
      weldsSnapshot.forEach((document) => {
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Delete all weld log documents
      const weldLogDocsQuery = query(
        collection(db, COLLECTIONS.WELD_LOG_DOCUMENTS),
        where('weldLogId', '==', weldLogId),
        where('status', '!=', STATUS.DELETED)
      );
      const weldLogDocsSnapshot = await getDocs(weldLogDocsQuery);
      weldLogDocsSnapshot.forEach((document) => {
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Add current batch to batches array
      if (operationCount > 0) {
        batches.push(batch);
      }

      // Commit all batches
      for (const batchToCommit of batches) {
        await batchToCommit.commit();
      }

      toast.success(t('weldLogs.deleteSuccess'));
      return true;
    } catch (error) {
      toast.error(t('weldLogs.deleteError'));
      throw error;
    }
  };

  /**
   * Soft delete a document library and all its related data
   * @param libraryId - The library ID to delete
   */
  const deleteDocumentLibrary = async (libraryId: string): Promise<boolean> => {
    try {
      let batch: WriteBatch = writeBatch(db);
      let operationCount = 0;
      const batches: WriteBatch[] = [];
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Helper to manage batch size limits
      const addBatchOperation = (
        docRef: DocumentReference<DocumentData>,
        updates: BatchUpdate
      ) => {
        if (operationCount >= FIRESTORE_BATCH_LIMIT) {
          batches.push(batch);
          batch = writeBatch(db);
          operationCount = 0;
        }
        batch.update(docRef, { ...updates });
        operationCount++;
      };

      // Delete the library itself
      const libraryRef = doc(db, COLLECTIONS.DOCUMENT_LIBRARY, libraryId);
      addBatchOperation(libraryRef, {
        status: STATUS.DELETED,
        updatedAt: timestamp,
        updatedBy: deletedBy,
      });

      // Delete all library document sections
      const sectionsQuery = query(
        collection(db, COLLECTIONS.LIBRARY_DOCUMENT_SECTIONS),
        where('libraryId', '==', libraryId),
        where('status', '!=', STATUS.DELETED)
      );
      const sectionsSnapshot = await getDocs(sectionsQuery);
      sectionsSnapshot.forEach((document) => {
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Delete all library documents
      const documentsQuery = query(
        collection(db, COLLECTIONS.LIBRARY_DOCUMENTS),
        where('libraryId', '==', libraryId),
        where('status', '!=', STATUS.DELETED)
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      documentsSnapshot.forEach((document) => {
        addBatchOperation(document.ref, {
          status: STATUS.DELETED,
          updatedAt: timestamp,
          updatedBy: deletedBy,
        });
      });

      // Add current batch to batches array
      if (operationCount > 0) {
        batches.push(batch);
      }

      // Commit all batches
      for (const batchToCommit of batches) {
        await batchToCommit.commit();
      }

      toast.success(t('documentLibrary.deleteSuccess'));
      return true;
    } catch (error) {
      toast.error(t('documentLibrary.deleteError'));
      throw error;
    }
  };

  /**
   * Soft delete a user
   * @param userId - The user ID to delete
   */
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Delete the user (single operation, no batch management needed)
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      batch.update(userRef, {
        status: STATUS.DELETED,
        updatedAt: timestamp,
        updatedBy: deletedBy,
      });

      // Commit the delete
      await batch.commit();

      toast.success(t('users.deleteSuccess'));
      return true;
    } catch (error) {
      toast.error(t('users.deleteError'));
      throw error;
    }
  };

  /**
   * Soft delete a material
   * @param materialId - The material ID to delete
   * @param materialType - The type of material ('parent', 'filler', or 'alloy')
   */
  const deleteMaterial = async (
    materialId: string,
    materialType: 'parent' | 'filler' | 'alloy'
  ): Promise<boolean> => {
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Determine the correct collection based on material type
      let collectionName: string;
      switch (materialType) {
        case 'parent':
          collectionName = COLLECTIONS.PARENT_MATERIALS;
          break;
        case 'filler':
          collectionName = COLLECTIONS.FILLER_MATERIALS;
          break;
        case 'alloy':
          collectionName = COLLECTIONS.ALLOY_MATERIALS;
          break;
        default:
          throw new Error(`Invalid material type: ${materialType}`);
      }

      // Delete the material (single operation, no batch management needed)
      const materialRef = doc(db, collectionName, materialId);
      batch.update(materialRef, {
        status: STATUS.DELETED,
        updatedAt: timestamp,
        updatedBy: deletedBy,
      });

      // Commit the delete
      await batch.commit();

      toast.success(t('materials.deleteSuccess'));
      return true;
    } catch (error) {
      toast.error(t('materials.deleteError'));
      throw error;
    }
  };

  return {
    deleteProject,
    deleteWeldLog,
    deleteDocumentLibrary,
    deleteUser,
    deleteMaterial,
  };
}
