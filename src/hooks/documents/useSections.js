/**
 * useSections - Unified hook for document section operations
 *
 * This hook provides a complete interface for managing document sections within
 * projects or libraries. Sections are used to organize documents into groups.
 *
 * @example
 * // For project sections
 * const {
 *   sections,
 *   sectionsLoading,
 *   sectionsError,
 *   createSection,
 *   updateSection,
 *   deleteSection,
 *   reorderSections
 * } = useSections({
 *   entityType: 'project',
 *   entityId: projectId
 * });
 *
 * @example
 * // For library sections
 * const sections = useSections({
 *   entityType: 'library',
 *   entityId: libraryId
 * });
 *
 * @note Weld logs do not support sections - documents are flat in weld logs
 */

import { useSectionOperations } from './useSectionOperations';
import { useSectionData } from './useSectionData';

/**
 * Unified hook for section operations
 * @param {Object} config - Configuration object
 * @param {string} config.entityType - Type of entity ('project' or 'library')
 * @param {string} config.entityId - ID of the entity that owns the sections
 * @returns {Object} Section operations and data
 * @returns {Array} returns.sections - Array of section objects sorted by order
 * @returns {boolean} returns.sectionsLoading - Loading state for sections
 * @returns {Error} returns.sectionsError - Error if section fetching failed
 * @returns {Function} returns.createSection - Create a new section
 * @returns {Function} returns.updateSection - Update an existing section
 * @returns {Function} returns.deleteSection - Soft delete a section and its documents
 * @returns {Function} returns.reorderSections - Reorder sections by updating their order values
 */
export function useSections(config) {
  const { entityType, entityId } = config;

  // Validate required parameters
  if (!entityType || !entityId) {
    throw new Error('useSections requires entityType and entityId');
  }

  // Map entity types to collection names
  const collectionMap = {
    project: 'project-document-sections',
    library: 'library-document-sections',
  };

  const collectionName = collectionMap[entityType];
  if (!collectionName) {
    throw new Error(
      `Unsupported entity type: ${entityType}. Only 'project' and 'library' are supported.`
    );
  }

  // Build foreign keys based on entity type
  const foreignKeys = {
    [`${entityType}Id`]: entityId,
  };

  // Get operations from operations hook
  const operations = useSectionOperations(collectionName, foreignKeys);

  // Get data from data hook
  const data = useSectionData(collectionName, foreignKeys);

  // Return combined operations and data with same API as original hooks
  return {
    // Operations
    ...operations,
    // Data
    sections: data.sections,
    sectionsLoading: data.loading,
    sectionsError: data.error,
  };
}
