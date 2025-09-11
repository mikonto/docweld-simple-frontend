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

import { useSectionOperations, UseSectionOperationsReturn } from './useSectionOperations';
import { useSectionData } from './useSectionData';
import { DocumentData, FirestoreError } from 'firebase/firestore';

type SectionEntityType = 'project' | 'library';

interface UseSectionsConfig {
  entityType: SectionEntityType;
  entityId: string;
}

interface UseSectionsReturn extends Omit<UseSectionOperationsReturn, 'sections' | 'loading' | 'error'> {
  sections: DocumentData[];
  sectionsLoading: boolean;
  sectionsError: FirestoreError | undefined;
}

const collectionMap: Record<SectionEntityType, string> = {
  project: 'project-document-sections',
  library: 'library-document-sections',
};

/**
 * Unified hook for section operations
 */
export function useSections(config: UseSectionsConfig): UseSectionsReturn {
  const { entityType, entityId } = config;

  // Validate required parameters
  if (!entityType || !entityId) {
    throw new Error('useSections requires entityType and entityId');
  }

  // Map entity types to collection names
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
    // Operations (exclude duplicate properties)
    addSection: operations.addSection,
    renameSection: operations.renameSection,
    deleteSection: operations.deleteSection,
    updateSectionOrder: operations.updateSectionOrder,
    moveSection: operations.moveSection,
    // Data with renamed properties
    sections: data.sections,
    sectionsLoading: data.loading,
    sectionsError: data.error,
  };
}