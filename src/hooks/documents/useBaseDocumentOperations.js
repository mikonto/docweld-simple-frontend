// src/hooks/documents/useBaseDocumentOperations.js
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

/**
 * Base hook for flat document collection operations with foreign key support
 * @param {string} collectionName - Name of the collection (e.g., 'project-documents')
 * @param {object} foreignKeys - Foreign key values for filtering (e.g., { projectId: 'xyz' })
 *
 * @param {object} options - Additional options
 * @returns {object} Document operations and state
 */
export function useBaseDocumentOperations(collectionName, foreignKeys) {
  const { loggedInUser } = useApp();

  // Build constraints for the query
  const constraints = useMemo(() => {
    const result = [];
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
   * @returns {number} Next order value
   */
  const getNextOrderValue = useCallback(async () => {
    try {
      // Build query with foreign key constraints
      let q = collection(db, collectionName);

      // Add foreign key filters
      const queryConstraints = [...constraints];

      // Add ordering to get the highest order value (for newest first)
      queryConstraints.push(orderBy('order', 'desc'));
      queryConstraints.push(limit(1));

      q = query(q, ...queryConstraints);

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return getNextDescendingOrder(null);
      }

      // Get highest order value for newest first
      const highestOrder = snapshot.docs[0].data().order;
      return getNextDescendingOrder(highestOrder);
    } catch {
      return getFallbackOrder(); // Use timestamp as fallback to ensure uniqueness
    }
  }, [collectionName, constraints]);

  /**
   * Add a document to the collection
   * @param {string} title - Document title
   * @param {string} docId - Document ID
   * @param {number} orderValue - Optional order value (if not provided, will calculate next)
   * @returns {object} Created document data
   */
  const addDocument = useCallback(
    async (
      title,
      docId,
      orderValue = null,
      fileType = null,
      fileSize = null
    ) => {
      const order =
        orderValue !== null ? orderValue : await getNextOrderValue();

      const newDocData = {
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
   * @param {string} docId - ID of the document to rename
   * @param {string} newTitle - New title for the document
   */
  const renameDocument = useCallback(
    async (docId, newTitle) => {
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
   * @param {string} docId - ID of the document to delete
   */
  const deleteDocument = useCallback(
    async (docId) => {
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
   * @param {string} docId - ID of the document to update
   * @param {string} processingState - New processing state
   */
  const updateProcessingState = useCallback(
    async (docId, processingState) => {
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
   * @param {Array} orderedDocIds - Array of document IDs in new order
   */
  const updateDocumentOrder = useCallback(
    async (orderedDocIds) => {
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
            updatedBy: loggedInUser?.uid || null,
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
    [collectionName, loggedInUser?.uid]
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
    (files) => {
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
