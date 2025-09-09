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
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { STATUS, COLLECTIONS } from '@/constants/firestore';

// Firestore technical limits
const FIRESTORE_IN_QUERY_LIMIT = 30; // Max items for 'in' operator
const FIRESTORE_BATCH_LIMIT = 500; // Max operations per batch

/**
 * Hook for cascading soft deletes across related Firestore collections
 * When a parent entity is deleted, all related child entities are also soft-deleted
 */
export function useCascadingSoftDelete() {
  const { loggedInUser } = useApp();
  const { t } = useTranslation();

  /**
   * Soft delete a project and all its related data
   * @param {string} projectId - The project ID to delete
   */
  const deleteProject = async (projectId) => {
    try {
      let batch = writeBatch(db);
      let operationCount = 0;
      const batches = [];
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Helper to manage batch size limits
      const addBatchOperation = (docRef, updates) => {
        if (operationCount >= FIRESTORE_BATCH_LIMIT) {
          batches.push(batch);
          batch = writeBatch(db);
          operationCount = 0;
        }
        batch.update(docRef, updates);
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
      participantsSnapshot.forEach((doc) => {
        addBatchOperation(doc.ref, {
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
      const weldLogIds = [];
      weldLogsSnapshot.forEach((doc) => {
        weldLogIds.push(doc.id);
        addBatchOperation(doc.ref, {
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
          weldsSnapshot.forEach((doc) => {
            addBatchOperation(doc.ref, {
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
      sectionsSnapshot.forEach((doc) => {
        addBatchOperation(doc.ref, {
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
      documentsSnapshot.forEach((doc) => {
        addBatchOperation(doc.ref, {
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
      weldLogDocsSnapshot.forEach((doc) => {
        addBatchOperation(doc.ref, {
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
   * @param {string} weldLogId - The weld log ID to delete
   */
  const deleteWeldLog = async (weldLogId) => {
    try {
      let batch = writeBatch(db);
      let operationCount = 0;
      const batches = [];
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Helper to manage batch size limits
      const addBatchOperation = (docRef, updates) => {
        if (operationCount >= FIRESTORE_BATCH_LIMIT) {
          batches.push(batch);
          batch = writeBatch(db);
          operationCount = 0;
        }
        batch.update(docRef, updates);
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
      weldsSnapshot.forEach((doc) => {
        addBatchOperation(doc.ref, {
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
      weldLogDocsSnapshot.forEach((doc) => {
        addBatchOperation(doc.ref, {
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
   * @param {string} libraryId - The library ID to delete
   */
  const deleteDocumentLibrary = async (libraryId) => {
    try {
      let batch = writeBatch(db);
      let operationCount = 0;
      const batches = [];
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Helper to manage batch size limits
      const addBatchOperation = (docRef, updates) => {
        if (operationCount >= FIRESTORE_BATCH_LIMIT) {
          batches.push(batch);
          batch = writeBatch(db);
          operationCount = 0;
        }
        batch.update(docRef, updates);
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
      sectionsSnapshot.forEach((doc) => {
        addBatchOperation(doc.ref, {
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
      documentsSnapshot.forEach((doc) => {
        addBatchOperation(doc.ref, {
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
   * @param {string} userId - The user ID to delete
   */
  const deleteUser = async (userId) => {
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
   * @param {string} materialId - The material ID to delete
   */
  const deleteMaterial = async (materialId) => {
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      const deletedBy = loggedInUser?.uid || 'system';

      // Delete the material (single operation, no batch management needed)
      const materialRef = doc(db, COLLECTIONS.MATERIALS, materialId);
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
