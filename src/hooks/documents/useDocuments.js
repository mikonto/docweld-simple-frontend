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

import { useBaseDocumentOperations } from './useBaseDocumentOperations';
import { useDocumentData } from './useDocumentData';

/**
 * Unified hook for document operations
 * @param {Object} config - Configuration object
 * @param {string} config.entityType - Type of entity ('project', 'library', 'weldLog')
 * @param {string} config.entityId - ID of the entity that owns the documents
 * @param {string} [config.sectionId] - Optional section ID for filtering documents
 * @param {Object} [config.additionalForeignKeys] - Additional foreign keys (required for weldLog: {projectId})
 * @returns {Object} Document operations and data
 * @returns {Array} returns.documents - Array of document objects
 * @returns {boolean} returns.documentsLoading - Loading state for documents
 * @returns {Error} returns.documentsError - Error if document fetching failed
 * @returns {Function} returns.createDocument - Create a new document
 * @returns {Function} returns.updateDocument - Update an existing document
 * @returns {Function} returns.deleteDocument - Soft delete a document
 * @returns {Function} returns.uploadFiles - Upload files and create documents
 * @returns {Object} returns.uploadingFiles - Upload progress for each file
 */
export function useDocuments(config) {
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
  const collectionMap = {
    project: 'project-documents',
    library: 'library-documents',
    weldLog: 'weld-log-documents',
    weld: 'weld-documents',
  };

  const collectionName = collectionMap[entityType];
  if (!collectionName) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  // Build foreign keys based on entity type
  const foreignKeys = {
    [`${entityType}Id`]: entityId,
    ...(sectionId && { sectionId }),
    ...additionalForeignKeys,
  };

  // Get operations from base hook
  const operations = useBaseDocumentOperations(
    collectionName,
    foreignKeys,
    null // Storage path no longer needed
  );

  // Get data from data hook
  const data = useDocumentData(collectionName, foreignKeys);

  // Return combined operations and data with same API as original hooks
  return {
    // Operations
    ...operations,
    // Data
    documents: data.documents,
    documentsLoading: data.loading,
    documentsError: data.error,
  };
}
