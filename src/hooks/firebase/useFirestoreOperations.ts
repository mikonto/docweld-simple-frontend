import { useCallback } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  Query,
  FirestoreError,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { STATUS } from '@/types/common/status';

/**
 * Options for Firestore operations
 */
interface FirestoreOperationOptions {
  suppressToast?: boolean;
}

/**
 * Options for the useFirestoreOperations hook
 */
interface UseFirestoreOperationsOptions {
  constraints?: QueryConstraint[];
}

/**
 * Return type for useFirestoreOperations hook
 */
export interface UseFirestoreOperationsReturn {
  documents: DocumentData[];
  loading: boolean;
  error: FirestoreError | undefined;
  create: (
    data: DocumentData,
    options?: FirestoreOperationOptions
  ) => Promise<string>;
  update: (
    documentId: string,
    updates: DocumentData,
    options?: FirestoreOperationOptions
  ) => Promise<void>;
  remove: (documentId: string, hardDelete?: boolean) => Promise<void>;
  archive: (documentId: string) => Promise<void>;
  restore: (documentId: string) => Promise<void>;
}

/**
 * Unified hook for Firestore operations with authentication and error handling
 */
export const useFirestoreOperations = (
  collectionName: string,
  options: UseFirestoreOperationsOptions = {}
): UseFirestoreOperationsReturn => {
  const { constraints = [] } = options;
  const { loggedInUser } = useApp();
  const { t } = useTranslation();

  // Build query with constraints
  const collectionQuery:
    | CollectionReference<DocumentData>
    | Query<DocumentData> =
    constraints.length > 0
      ? query(collection(db, collectionName), ...constraints)
      : collection(db, collectionName);

  // Use react-firebase-hooks for real-time data
  const [snapshot, loading, error] = useCollection(collectionQuery);

  // Transform snapshot to documents array
  // Documents should have their own 'id' field matching the document ID
  const documents = snapshot?.docs?.map((doc) => doc.data()) || [];

  // Create a new document
  const create = useCallback(
    async (
      data: DocumentData,
      options: FirestoreOperationOptions = {}
    ): Promise<string> => {
      try {
        // ALWAYS check auth for security - no exceptions
        if (!loggedInUser) {
          throw new Error('User must be logged in to perform this operation');
        }

        // Basic validation
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data provided');
        }

        // Check if ID is provided in the data
        let docRef;
        let docId: string;

        if (data.id) {
          // Use the provided ID (needed for documents feature)
          docId = data.id as string;
          docRef = doc(db, collectionName, docId);
        } else {
          // Generate new ID (existing behavior for other components)
          docRef = doc(collection(db, collectionName));
          docId = docRef.id;
        }

        const newDocument = {
          ...data,
          id: docId, // Add explicit id field
          status: data.status || STATUS.ACTIVE,
          createdAt: serverTimestamp(),
          createdBy: loggedInUser.uid,
          updatedAt: serverTimestamp(),
          updatedBy: loggedInUser.uid,
        };

        // Set the document with the determined ID
        await setDoc(docRef, newDocument);

        // Only show toast if not explicitly suppressed
        if (options.suppressToast !== true) {
          toast.success(t('crud.createSuccess'));
        }
        return docId;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t('crud.createError');
        toast.error(message);
        throw error;
      }
    },
    [collectionName, loggedInUser, t]
  );

  // Update an existing document
  const update = useCallback(
    async (
      documentId: string,
      updates: DocumentData,
      options: FirestoreOperationOptions = {}
    ): Promise<void> => {
      try {
        // ALWAYS check auth for security - no exceptions
        if (!loggedInUser) {
          throw new Error('User must be logged in to perform this operation');
        }

        // Basic validation
        if (!documentId || typeof documentId !== 'string') {
          throw new Error('Invalid document ID provided');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Invalid update data provided');
        }

        const docRef = doc(db, collectionName, documentId);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
          updatedBy: loggedInUser.uid,
        });

        // Only show toast if not explicitly suppressed
        if (options.suppressToast !== true) {
          toast.success(t('crud.updateSuccess'));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t('crud.updateError');
        toast.error(message);
        throw error;
      }
    },
    [collectionName, loggedInUser, t]
  );

  // Delete a document (soft delete by default)
  const remove = useCallback(
    async (documentId: string, hardDelete = false): Promise<void> => {
      try {
        // ALWAYS check auth for security - no exceptions
        if (!loggedInUser) {
          throw new Error('User must be logged in to perform this operation');
        }

        const docRef = doc(db, collectionName, documentId);

        if (hardDelete) {
          await deleteDoc(docRef);
        } else {
          // Soft delete - mark as deleted
          await updateDoc(docRef, {
            status: STATUS.DELETED,
            deletedAt: serverTimestamp(),
            deletedBy: loggedInUser.uid,
            updatedAt: serverTimestamp(),
            updatedBy: loggedInUser.uid,
          });
        }

        toast.success(t('crud.deleteSuccess'));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t('crud.deleteError');
        toast.error(message);
        throw error;
      }
    },
    [collectionName, loggedInUser, t]
  );

  // Archive a document
  const archive = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        // ALWAYS check auth for security - no exceptions
        if (!loggedInUser) {
          throw new Error('User must be logged in to perform this operation');
        }

        const docRef = doc(db, collectionName, documentId);
        await updateDoc(docRef, {
          status: STATUS.ARCHIVED,
          archivedAt: serverTimestamp(),
          archivedBy: loggedInUser.uid,
          updatedAt: serverTimestamp(),
          updatedBy: loggedInUser.uid,
        });
        toast.success(t('crud.archiveSuccess'));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t('crud.archiveError');
        toast.error(message);
        throw error;
      }
    },
    [collectionName, loggedInUser, t]
  );

  // Restore an archived/deleted document
  const restore = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        // ALWAYS check auth for security - no exceptions
        if (!loggedInUser) {
          throw new Error('User must be logged in to perform this operation');
        }

        const docRef = doc(db, collectionName, documentId);
        await updateDoc(docRef, {
          status: STATUS.ACTIVE,
          restoredAt: serverTimestamp(),
          restoredBy: loggedInUser.uid,
          updatedAt: serverTimestamp(),
          updatedBy: loggedInUser.uid,
        });
        toast.success(t('crud.restoreSuccess'));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t('crud.restoreError');
        toast.error(message);
        throw error;
      }
    },
    [collectionName, loggedInUser, t]
  );

  return {
    documents,
    loading,
    error,
    create,
    update,
    remove,
    archive,
    restore,
  };
};
