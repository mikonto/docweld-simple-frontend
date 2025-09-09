// src/hooks/documents/shared/importing/useDocumentImport.js
import { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  importSingleDocument,
  importCompleteSection,
} from './documentImportHelpers';

/**
 * Hook for importing documents and sections between different containers
 *
 * FEATURES:
 * 1. Import individual documents to projects/libraries/weld logs
 * 2. Import complete sections with all their documents
 * 3. Maintain document ordering (imported items go to the END)
 * 4. Copy storage files using Cloud Functions
 * 5. Track import metadata (importedFrom, importedAt)
 * 6. Support batch operations with error handling
 * 7. All-or-nothing imports (rollback on failure)
 * 8. Section support for projects/libraries (not weld logs)
 *
 * WHY ORDER MANAGEMENT:
 * When importing documents, we place them at the END (highest order + 1000)
 * to avoid disrupting the user's existing organization. This is intuitive
 * and prevents confusion about where imported items appear.
 *
 * @param {string} destinationType - Type of destination ('project', 'library', 'weldLog')
 * @param {string} destinationId - ID of the destination container
 * @returns {Object} Import functions and state
 */
export function useDocumentImport(destinationType, destinationId) {
  const { loggedInUser } = useApp();
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Import a single document
   * Wrapper around the helper function to provide user context
   */
  const importDocument = useCallback(
    async (sourceDoc, targetSectionId, additionalContext = {}) => {
      return await importSingleDocument(
        sourceDoc,
        targetSectionId,
        destinationType,
        destinationId,
        additionalContext,
        loggedInUser
      );
    },
    [destinationType, destinationId, loggedInUser]
  );

  /**
   * Import a complete section with all its documents
   * Wrapper around the helper function to provide user context
   */
  const importSection = useCallback(
    async (sourceSection, sourceType, sourceId) => {
      return await importCompleteSection(
        sourceSection,
        sourceType,
        sourceId,
        destinationType,
        destinationId,
        loggedInUser
      );
    },
    [destinationType, destinationId, loggedInUser]
  );

  /**
   * Import multiple items (sections and/or documents)
   * Handles both section and document imports with proper error tracking
   */
  const importItems = useCallback(
    async (items, additionalContext = {}) => {
      setIsImporting(true);

      try {
        const results = {
          sections: [],
          documents: [],
          errors: [],
        };

        // Group items by type
        const sections = items.filter((item) => item.type === 'section');
        const documents = items.filter((item) => item.type === 'document');

        // ========== IMPORT SECTIONS ==========
        // Skip sections for weld logs and welds as they don't support them
        if (
          (destinationType === 'weldLog' || destinationType === 'weld') &&
          sections.length > 0
        ) {
          sections.forEach((section) => {
            results.errors.push({
              item: section,
              error: 'Sections are not supported in weld logs or welds',
            });
          });
        } else {
          // Import each section with all its documents
          for (const section of sections) {
            try {
              const sourceType = section.projectId ? 'project' : 'library';
              const sourceId = section.projectId || section.collectionId;
              const newSectionId = await importSection(
                section,
                sourceType,
                sourceId
              );
              results.sections.push({
                original: section,
                imported: newSectionId,
              });
            } catch (error) {
              // Silently handle error - added to results.errors for UI feedback
              results.errors.push({ item: section, error: error.message });
            }
          }
        }

        // ========== IMPORT INDIVIDUAL DOCUMENTS ==========
        for (const doc of documents) {
          try {
            // Use targetSectionId from container or document itself
            const targetSectionId = doc.targetSectionId || doc.sectionId;
            const newDocId = await importDocument(
              doc,
              targetSectionId,
              additionalContext
            );
            results.documents.push({ original: doc, imported: newDocId });
          } catch (error) {
            // Silently handle error - added to results.errors for UI feedback
            results.errors.push({ item: doc, error: error.message });
          }
        }

        // Success/error messaging handled by calling components
        // This prevents duplicate toasts
        return results;
      } catch (error) {
        // Add error to results and return
        const errorResult = {
          sections: [],
          documents: [],
          errors: [{ error: error.message }],
        };
        return errorResult;
      } finally {
        setIsImporting(false);
      }
    },
    [importDocument, importSection, destinationType]
  );

  return {
    importDocument,
    importSection,
    importItems,
    isImporting,
  };
}
