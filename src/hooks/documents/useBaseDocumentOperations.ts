// src/hooks/documents/useBaseDocumentOperations.ts
import { useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  QueryConstraint,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { useFileUpload } from './useFileUpload';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import {
  getNextDescendingOrder,
  getDescendingOrderForPosition,
  getFallbackOrder,
} from '@/utils/orderManagement';
import type { DocumentData } from 'firebase/firestore';
import type { UploadingFile } from '@/types';

// @unused - configuration interface for base document operations
// interface BaseDocumentOperationsConfig {
//   collectionName: string;
//   foreignKeys: Record<string, string>;
// }

export interface BaseDocumentData extends DocumentData {
  id: string;
  title: string;
  order: number;
  storageRef: string;
  thumbStorageRef: string | null;
  processingState: string;
  status: string;
  fileType: string;
  fileSize: number;
}

export interface UseBaseDocumentOperationsReturn {
  // From Firestore operations
  documents: DocumentData[];
  loading: boolean;
  error: FirestoreError | undefined;

  // Document-specific operations
  addDocument: (
    title: string,
    docId: string,
    orderValue?: number | null,
    fileType?: string | null,
    fileSize?: number | null
  ) => Promise<BaseDocumentData>;
  renameDocument: (docId: string, newTitle: string) => Promise<void>;
  deleteDocument: (docId: string) => Promise<{ success: boolean; error?: Error | unknown }>;
  updateDocumentOrder: (orderedDocIds: string[]) => Promise<{ success: boolean; error?: Error | unknown }>;
  updateProcessingState: (docId: string, processingState: string) => Promise<void>;

  // File upload operations
  handleFileUpload: (files: FileList | File[]) => void;
  uploadingFiles: UploadingFile[];
  handleUpload: (files: FileList | File[]) => Promise<any>;
  handleCancelUpload: (fileId: string) => void;
}

/**
 * Base hook for flat document collection operations with foreign key support
 */
export function useBaseDocumentOperations(
  collectionName: string,
  foreignKeys: Record<string, string>
): UseBaseDocumentOperationsReturn {
  const { loggedInUser } = useApp();

  // Build constraints for the query
  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];
    Object.entries(foreignKeys).forEach(([key, value]) => {
      if (value) result.push(where(key, '==', value));
    });
    return result;
  }, [foreignKeys]);

  // Use the shared CRUD hook - this provides create, update, remove operations
  const firebaseOps = useFirestoreOperations(collectionName, {
    constraints,
  });

  /**
   * Get the next order value for a new document
   */
  const getNextOrderValue = useCallback(async (): Promise<number> => {
    try {
      // Build query with foreign key constraints
      const queryConstraints = [...constraints];

      // Add ordering to get the highest order value (for newest first)
      queryConstraints.push(orderBy('order', 'desc'));
      queryConstraints.push(limit(1));

      const q = query(collection(db, collectionName), ...queryConstraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return getNextDescendingOrder(null);
      }

      // Get highest order value for newest first
      const highestOrder = snapshot.docs[0].data().order as number;
      return getNextDescendingOrder(highestOrder);
    } catch {
      return getFallbackOrder(); // Use timestamp as fallback to ensure uniqueness
    }
  }, [collectionName, constraints]);

  /**
   * Add a document to the collection
   */
  const addDocument = useCallback(
    async (
      title: string,
      docId: string,
      orderValue: number | null = null,
      fileType: string | null = null,
      fileSize: number | null = null
    ): Promise<BaseDocumentData> => {
      const order =
        orderValue !== null ? orderValue : await getNextOrderValue();

      const newDocData: BaseDocumentData = {
        // Core fields
        id: docId,
        title,
        order,

        // Foreign keys
        ...foreignKeys,

        // Document metadata
        storageRef: `documents/${docId}/${title}`, // title is the sanitizedFileName passed from upload
        thumbStorageRef: null,
        processingState: 'uploading', // Start with 'uploading', will be set to 'pending' after upload completes
        status: 'active',
        fileType: fileType || '',
        fileSize: fileSize || 0,

        // Timestamps are handled by useFirestoreOperations
      };

      // Use the create method from useFirestoreOperations
      // It will add timestamps and user tracking automatically
      // Suppress toast here - we'll show it when upload completes
      await firebaseOps.create(newDocData, { suppressToast: true });
      return newDocData;
    },
    [foreignKeys, getNextOrderValue, firebaseOps]
  );

  /**
   * Rename a document
   */
  const renameDocument = useCallback(
    async (docId: string, newTitle: string): Promise<void> => {
      // Use the update method from useFirestoreOperations
      // It will handle timestamps and user tracking automatically
      await firebaseOps.update(docId, {
        title: newTitle,
      });
    },
    [firebaseOps]
  );

  /**
   * Soft delete a document
   */
  const deleteDocument = useCallback(
    async (docId: string): Promise<{ success: boolean; error?: Error | unknown }> => {
      try {
        // Use the remove method from useFirestoreOperations with soft delete
        await firebaseOps.remove(docId, false); // false = soft delete

        // Return success result instead of showing toast
        return { success: true };
      } catch (err) {
        // Return error result instead of showing toast
        return { success: false, error: err };
      }
    },
    [firebaseOps]
  );

  /**
   * Update document processing state
   */
  const updateProcessingState = useCallback(
    async (docId: string, processingState: string): Promise<void> => {
      // Use the update method from useFirestoreOperations
      // Suppress toast here - we'll show it when upload completes
      await firebaseOps.update(
        docId,
        {
          processingState,
        },
        { suppressToast: true }
      );
    },
    [firebaseOps]
  );

  /**
   * Update document order using numeric values
   */
  const updateDocumentOrder = useCallback(
    async (orderedDocIds: string[]): Promise<{ success: boolean; error?: Error | unknown }> => {
      try {
        const batch = writeBatch(db);

        // For descending order (newest first), assign highest values to first items
        // Start from a high base value and decrease by 1000 for each position
        const totalDocs = orderedDocIds.length;

        // Update each document with new order value
        orderedDocIds.forEach((docId, index) => {
          const docRef = doc(db, collectionName, docId);
          batch.update(docRef, {
            order: getDescendingOrderForPosition(index, totalDocs),
            updatedAt: serverTimestamp(),
            updatedBy: loggedInUser?.id || null,
          });
        });

        await batch.commit();
        // Return success result instead of showing toast
        return { success: true };
      } catch (err) {
        // Return error result instead of showing toast
        return { success: false, error: err };
      }
    },
    [collectionName, loggedInUser?.id]
  );

  // Set up file upload functionality
  const {
    uploadingFiles,
    handleFileUpload,
    handleUpload: baseHandleUpload,
    handleCancelUpload,
  } = useFileUpload(
    // For flat structure, we pass collection name and foreign keys
    { collectionName, foreignKeys },
    addDocument,
    updateProcessingState
  );

  // Wrap handleUpload to include any post-upload operations
  const handleUpload = useCallback(
    (files: FileList | File[]) => {
      return baseHandleUpload(files, updateDocumentOrder);
    },
    [baseHandleUpload, updateDocumentOrder]
  );

  return {
    // Expose the underlying Firestore operations data
    documents: firebaseOps.documents,
    loading: firebaseOps.loading,
    error: firebaseOps.error,

    // Document-specific operations
    addDocument,
    renameDocument,
    deleteDocument,
    updateDocumentOrder,
    updateProcessingState,

    // File upload operations
    handleFileUpload,
    uploadingFiles,
    handleUpload,
    handleCancelUpload,
  };
}