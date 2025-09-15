import { useDocument } from 'react-firebase-hooks/firestore';
import {
  doc,
  where,
  QueryConstraint,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useCascadingSoftDelete } from '@/hooks/firebase/useCascadingSoftDelete';
import { type DocumentLibrary, type DocumentLibraryFormData } from '@/types';
import type { Status } from '@/types/common/status';

/**
 * Return type for useDocumentCollectionOperations hook
 */
interface UseDocumentCollectionOperationsReturn {
  createDocumentCollection: (
    documentData: DocumentLibraryFormData
  ) => Promise<string>;
  updateDocumentCollection: (
    documentId: string,
    updates: Partial<DocumentLibrary>
  ) => Promise<void>;
  deleteDocumentCollection: (documentId: string) => Promise<boolean>;
}

/**
 * Collection of hooks for interacting with document library in Firestore
 * All operations are performed on the 'document-library' collection
 */

/**
 * Hook to fetch a single document collection's Firestore document
 * @param documentId - The document collection ID
 * @returns Returns:
 *   - Document collection data or null if not found
 *   - Loading state
 *   - Error if any
 */
export const useDocumentCollection = (
  documentId?: string | null
): [DocumentLibrary | null, boolean, FirestoreError | undefined] => {
  const [snapshot, loading, error] = useDocument(
    documentId ? doc(db, 'document-library', documentId) : null
  );

  const documentCollection = snapshot?.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as DocumentLibrary)
    : null;

  return [documentCollection, loading, error];
};

/**
 * Hook to fetch multiple document collections with optional status filtering
 * @param status - Filter document collections by status (active/deleted)
 * @returns Returns:
 *   - Array of document collection documents
 *   - Loading state
 *   - Error if any
 */
export const useDocumentCollections = (
  status?: Status
): [DocumentLibrary[], boolean, FirestoreError | undefined] => {
  // Use useFirestoreOperations with constraints based on status
  const constraints: QueryConstraint[] = status
    ? [where('status', '==', status)]
    : [];

  const { documents, loading, error } = useFirestoreOperations(
    'document-library',
    {
      constraints,
    }
  );

  return [documents as DocumentLibrary[], loading, error];
};

/**
 * Hook to create, update, and delete document collections
 * @returns Object containing document collection operation functions
 */
export const useDocumentCollectionOperations =
  (): UseDocumentCollectionOperationsReturn => {
    const { loggedInUser } = useApp();

    // Use useFirestoreOperations for CRUD operations
    const { create, update } = useFirestoreOperations('document-library');

    // Get cascading delete function
    const { deleteDocumentLibrary: cascadeDelete } = useCascadingSoftDelete();

    /**
     * Create a new document collection
     * @param documentData - The document collection data
     * @returns The ID of the created document collection
     */
    const createDocumentCollection = async (
      documentData: DocumentLibraryFormData
    ): Promise<string> => {
      if (!loggedInUser)
        throw new Error(
          'User must be logged in to create document collections'
        );

      // Don't add documentSections array - it's a deprecated field
      return await create(documentData);
    };

    /**
     * Update an existing document collection
     * @param documentId - The ID of the document collection to update
     * @param updates - The fields to update
     */
    const updateDocumentCollection = async (
      documentId: string,
      updates: Partial<DocumentLibrary>
    ): Promise<void> => {
      if (!loggedInUser)
        throw new Error(
          'User must be logged in to update document collections'
        );

      return await update(documentId, updates);
    };

    /**
     * Mark a document collection as deleted (soft delete with cascade)
     * This will also delete all sections and documents within the collection
     * @param documentId - The ID of the document collection to delete
     */
    const deleteDocumentCollection = async (
      documentId: string
    ): Promise<boolean> => {
      if (!loggedInUser)
        throw new Error(
          'User must be logged in to delete document collections'
        );

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
