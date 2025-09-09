// src/hooks/documents/index.js

/**
 * Document Hooks Public API
 *
 * This module exports hooks for managing documents and sections in the DocWeld application.
 * The hooks are already consolidated - use these public APIs instead of internal implementations.
 */

// ============================================================================
// MAIN HOOKS - Use these for document and section management
// ============================================================================

/**
 * useDocuments - Main hook for document CRUD operations
 * @example
 * const docs = useDocuments({
 *   entityType: 'project',  // 'project' | 'library' | 'weldLog'
 *   entityId: projectId,
 *   sectionId: sectionId,   // optional - filter by section
 * });
 */
export { useDocuments } from './useDocuments';

/**
 * useSections - Main hook for section CRUD operations
 * @example
 * const sections = useSections({
 *   entityType: 'project',  // 'project' | 'library'
 *   entityId: projectId,
 * });
 */
// Note: useSections is imported directly from './useSections' where needed

/**
 * useDocumentImport - Specialized hook for importing documents between entities
 * Complex but necessary for welder certificate reuse across projects
 * @example
 * const { importItems, isImporting } = useDocumentImport('project', projectId);
 */
export { useDocumentImport } from './useDocumentImport';

// ============================================================================
// UTILITY HOOKS - For specific UI needs
// ============================================================================

/**
 * useDocumentDisplay - Handles document image/thumbnail display with loading states
 * Used by DocumentCard component
 */
export { useDocumentDisplay } from './useDocumentDisplay';

/**
 * useDragAndDrop - Provides drag and drop functionality for file uploads
 * Used by DocumentUploadCard component
 */
export { useDragAndDrop } from './useDragAndDrop';

// ============================================================================
// UTILITY FUNCTIONS - Not hooks, just helper functions
// ============================================================================
export * from './utils';

// ============================================================================
// INTERNAL HOOKS - DO NOT EXPORT
// These are implementation details used by the public hooks above:
// - useBaseDocumentOperations (used by useDocuments)
// - useDocumentData (used by useDocuments)
// - useSectionData (used by useSections)
// - useSectionOperations (used by useSections)
// - useFileUpload (used by useBaseDocumentOperations)
// ============================================================================
