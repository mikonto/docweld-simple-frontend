// src/hooks/documents/useDocumentImport.ts
import { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  importSingleDocument,
  importCompleteSection,
} from './documentImportHelpers';
import type { FirestoreDocument, FirestoreSection } from '@/types/database';
import type { DestinationType, AdditionalContext } from './utils';

// Type alias for source types (only project or library can be sources)
type SourceType = 'project' | 'library';

/**
 * Import item types
 */
interface ImportItem {
  type: 'section' | 'document';
  id?: string;
  name?: string; // Required for sections
  projectId?: string;
  collectionId?: string;
  targetSectionId?: string;
  sectionId?: string;
  [key: string]: unknown; // Allow additional properties from source data
}

/**
 * Import results
 */
interface ImportResults {
  sections: Array<{
    original: ImportItem;
    imported: string;
  }>;
  documents: Array<{
    original: ImportItem;
    imported: string;
  }>;
  errors: Array<{
    item?: ImportItem;
    error: string;
  }>;
}

/**
 * Return type for useDocumentImport hook
 */
interface UseDocumentImportReturn {
  importDocument: (
    sourceDoc: Partial<FirestoreDocument>,
    targetSectionId?: string | null,
    additionalContext?: AdditionalContext
  ) => Promise<string>;
  importSection: (
    sourceSection: Partial<FirestoreSection> & { id: string; name: string },
    sourceType: SourceType,
    sourceId: string
  ) => Promise<string>;
  importItems: (
    items: ImportItem[],
    additionalContext?: AdditionalContext
  ) => Promise<ImportResults>;
  isImporting: boolean;
}

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
 * @param destinationType - Type of destination ('project', 'library', 'weldLog')
 * @param destinationId - ID of the destination container
 * @returns Import functions and state
 */
export function useDocumentImport(
  destinationType: DestinationType,
  destinationId: string | null
): UseDocumentImportReturn {
  const { userDb } = useApp();
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Import a single document
   * Wrapper around the helper function to provide user context
   */
  const importDocument = useCallback(
    async (
      sourceDoc: Partial<FirestoreDocument>,
      targetSectionId?: string | null,
      additionalContext: AdditionalContext = {}
    ): Promise<string> => {
      if (!destinationId) {
        throw new Error('Destination ID is required for import');
      }
      return await importSingleDocument(
        sourceDoc,
        targetSectionId ?? null,
        destinationType,
        destinationId,
        additionalContext,
        userDb
      );
    },
    [destinationType, destinationId, userDb]
  );

  /**
   * Import a complete section with all its documents
   * Wrapper around the helper function to provide user context
   */
  const importSection = useCallback(
    async (
      sourceSection: Partial<FirestoreSection> & { id: string; name: string },
      sourceType: SourceType,
      sourceId: string
    ): Promise<string> => {
      if (!destinationId) {
        throw new Error('Destination ID is required for import');
      }
      return await importCompleteSection(
        sourceSection,
        sourceType,
        sourceId,
        destinationType,
        destinationId,
        userDb
      );
    },
    [destinationType, destinationId, userDb]
  );

  /**
   * Import multiple items (sections and/or documents)
   * Handles both section and document imports with proper error tracking
   */
  const importItems = useCallback(
    async (
      items: ImportItem[],
      additionalContext: AdditionalContext = {}
    ): Promise<ImportResults> => {
      setIsImporting(true);

      try {
        const results: ImportResults = {
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
              const sourceType: SourceType = section.projectId
                ? 'project'
                : 'library';
              const sourceId = section.projectId || section.collectionId;
              if (!sourceId) {
                throw new Error('Source ID is required for section import');
              }
              if (!section.id || !section.name) {
                throw new Error('Section must have id and name properties');
              }
              const newSectionId = await importSection(
                section as Partial<FirestoreSection> & {
                  id: string;
                  name: string;
                },
                sourceType,
                sourceId
              );
              results.sections.push({
                original: section,
                imported: newSectionId,
              });
            } catch (error: unknown) {
              // Silently handle error - added to results.errors for UI feedback
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              results.errors.push({ item: section, error: errorMessage });
            }
          }
        }

        // ========== IMPORT INDIVIDUAL DOCUMENTS ==========
        for (const doc of documents) {
          try {
            // Use targetSectionId from container or document itself
            const targetSectionId = doc.targetSectionId || doc.sectionId;
            const newDocId = await importDocument(
              doc as Partial<FirestoreDocument>,
              targetSectionId,
              additionalContext
            );
            results.documents.push({ original: doc, imported: newDocId });
          } catch (error: unknown) {
            // Silently handle error - added to results.errors for UI feedback
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            results.errors.push({ item: doc, error: errorMessage });
          }
        }

        // Success/error messaging handled by calling components
        // This prevents duplicate toasts
        return results;
      } catch (error: unknown) {
        // Add error to results and return
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorResult: ImportResults = {
          sections: [],
          documents: [],
          errors: [{ error: errorMessage }],
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
