/**
 * useDocuments - Unified hook for document operations across all entity types
 *
 * This hook provides a complete interface for managing documents within projects,
 * libraries, or weld logs. It combines data fetching with CRUD operations and
 * file upload capabilities.
 *
 * @example
 * // For project documents
 * const {
 *   documents,
 *   documentsLoading,
 *   documentsError,
 *   createDocument,
 *   updateDocument,
 *   deleteDocument,
 *   uploadFiles,
 *   uploadingFiles
 * } = useDocuments({
 *   entityType: 'project',
 *   entityId: projectId,
 *   sectionId: sectionId  // optional - filter by section
 * });
 *
 * @example
 * // For library documents
 * const docs = useDocuments({
 *   entityType: 'library',
 *   entityId: libraryId
 * });
 *
 * @example
 * // For weld log documents (requires projectId)
 * const docs = useDocuments({
 *   entityType: 'weldLog',
 *   entityId: weldLogId,
 *   additionalForeignKeys: { projectId }
 * });
 */

import {
  useBaseDocumentOperations,
  UseBaseDocumentOperationsReturn,
} from './useBaseDocumentOperations';
import { useDocumentData } from './useDocumentData';
import { DocumentData, FirestoreError } from 'firebase/firestore';

type EntityType = 'project' | 'library' | 'weldLog' | 'weld';

interface UseDocumentsConfig {
  entityType: EntityType;
  entityId: string;
  sectionId?: string | null;
  additionalForeignKeys?: Record<string, string>;
}

interface UseDocumentsReturn
  extends Omit<
    UseBaseDocumentOperationsReturn,
    'documents' | 'loading' | 'error'
  > {
  documents: DocumentData[];
  documentsLoading: boolean;
  documentsError: FirestoreError | undefined;
}

const collectionMap: Record<EntityType, string> = {
  project: 'project-documents',
  library: 'library-documents',
  weldLog: 'weld-log-documents',
  weld: 'weld-documents',
};

/**
 * Unified hook for document operations
 */
export function useDocuments(config: UseDocumentsConfig): UseDocumentsReturn {
  const {
    entityType,
    entityId,
    sectionId = null,
    additionalForeignKeys = {},
  } = config;

  // Validate required parameters
  if (!entityType || !entityId) {
    throw new Error('useDocuments requires entityType and entityId');
  }

  // Map entity types to collection names
  const collectionName = collectionMap[entityType];
  if (!collectionName) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  // Build foreign keys based on entity type
  const foreignKeys: Record<string, string | null> = {
    [`${entityType}Id`]: entityId,
    ...(sectionId && { sectionId }),
    ...additionalForeignKeys,
  };

  // Get operations from base hook
  const operations = useBaseDocumentOperations(
    collectionName,
    foreignKeys as Record<string, string>
  );

  // Get data from data hook
  const data = useDocumentData(collectionName, foreignKeys);

  // Return combined operations and data with same API as original hooks
  return {
    // Operations (exclude duplicate properties)
    addDocument: operations.addDocument,
    renameDocument: operations.renameDocument,
    deleteDocument: operations.deleteDocument,
    updateDocumentOrder: operations.updateDocumentOrder,
    updateProcessingState: operations.updateProcessingState,
    handleFileUpload: operations.handleFileUpload,
    uploadingFiles: operations.uploadingFiles,
    handleUpload: operations.handleUpload,
    handleCancelUpload: operations.handleCancelUpload,
    // Data with renamed properties
    documents: data.documents,
    documentsLoading: data.loading,
    documentsError: data.error,
  };
}
