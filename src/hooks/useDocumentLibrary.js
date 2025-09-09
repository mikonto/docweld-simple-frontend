import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useCascadingSoftDelete } from '@/hooks/firebase/useCascadingSoftDelete';

/**
 * Collection of hooks for interacting with document library in Firestore
 * All operations are performed on the 'document-library' collection
 */

/**
 * Hook to fetch a single document collection's Firestore document
 * @param {string} documentId - The document collection ID
 * @returns {[Object | null, boolean, Error | undefined]} - Returns:
 *   - Document collection data or null if not found
 *   - Loading state
 *   - Error if any
 */
export const useDocumentCollection = (documentId) => {
  const [snapshot, loading, error] = useDocument(
    documentId ? doc(db, 'document-library', documentId) : null
  );

  const documentCollection = snapshot?.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;

  return [documentCollection, loading, error];
};

/**
 * Hook to fetch multiple document collections with optional status filtering
 * @param {string} status - Filter document collections by status (active/deleted)
 * @returns {[Object[], boolean, Error | undefined]} - Returns:
 *   - Array of document collection documents
 *   - Loading state
 *   - Error if any
 */
export const useDocumentCollections = (status) => {
  // Use useFirestoreOperations with constraints based on status
  const constraints = status ? [where('status', '==', status)] : [];

  const { documents, loading, error } = useFirestoreOperations(
    'document-library',
    {
      constraints,
    }
  );

  return [documents, loading, error];
};

/**
 * Hook to create, update, and delete document collections
 * @returns {Object} Object containing document collection operation functions
 */
export const useDocumentCollectionOperations = () => {
  const { loggedInUser } = useApp();

  // Use useFirestoreOperations for CRUD operations
  const { create, update } = useFirestoreOperations('document-library');

  // Get cascading delete function
  const { deleteDocumentLibrary: cascadeDelete } = useCascadingSoftDelete();

  /**
   * Create a new document collection
   * @param {Object} documentData - The document collection data
   * @returns {Promise<string>} The ID of the created document collection
   */
  const createDocumentCollection = async (documentData) => {
    if (!loggedInUser)
      throw new Error('User must be logged in to create document collections');

    // Don't add documentSections array - it's a deprecated field
    return await create(documentData);
  };

  /**
   * Update an existing document collection
   * @param {string} documentId - The ID of the document collection to update
   * @param {Object} updates - The fields to update
   */
  const updateDocumentCollection = async (documentId, updates) => {
    if (!loggedInUser)
      throw new Error('User must be logged in to update document collections');

    return await update(documentId, updates);
  };

  /**
   * Mark a document collection as deleted (soft delete with cascade)
   * This will also delete all sections and documents within the collection
   * @param {string} documentId - The ID of the document collection to delete
   */
  const deleteDocumentCollection = async (documentId) => {
    if (!loggedInUser)
      throw new Error('User must be logged in to delete document collections');

    // Use unified cascade delete
    await cascadeDelete(documentId);

    return true;
  };

  return {
    createDocumentCollection,
    updateDocumentCollection,
    deleteDocumentCollection,
  };
};
