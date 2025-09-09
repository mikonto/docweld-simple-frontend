import { COLLECTIONS } from '@/constants/firestore';

/**
 * Returns collection names and foreign keys for document/section imports.
 * @param {string} destinationType - 'project', 'library', or 'weldLog'.
 * @param {string} destinationId - The ID of the destination (e.g., projectId).
 * @param {object} additionalContext - Additional context (e.g., { weldLogId }).
 * @returns {{documentCollectionName: string, sectionCollectionName: string, foreignKeys: object}}
 */
export const getImportDestinationConfig = (
  destinationType,
  destinationId,
  additionalContext = {}
) => {
  let documentCollectionName = '';
  let sectionCollectionName = '';
  let foreignKeys = {};

  switch (destinationType) {
    case 'project':
      documentCollectionName = COLLECTIONS.PROJECT_DOCUMENTS;
      sectionCollectionName = COLLECTIONS.PROJECT_DOCUMENT_SECTIONS;
      foreignKeys = { projectId: destinationId };
      break;
    case 'library':
      documentCollectionName = COLLECTIONS.LIBRARY_DOCUMENTS;
      sectionCollectionName = COLLECTIONS.LIBRARY_DOCUMENT_SECTIONS;
      foreignKeys = { libraryId: destinationId };
      break;
    case 'weldLog':
      documentCollectionName = COLLECTIONS.WELD_LOG_DOCUMENTS;
      sectionCollectionName = COLLECTIONS.WELD_LOG_DOCUMENT_SECTIONS;
      foreignKeys = {
        weldLogId: destinationId,
        projectId: additionalContext.projectId,
      };
      break;
    case 'weld':
      documentCollectionName = COLLECTIONS.WELD_DOCUMENTS;
      sectionCollectionName = COLLECTIONS.WELD_DOCUMENT_SECTIONS;
      foreignKeys = {
        weldId: destinationId,
        weldLogId: additionalContext.weldLogId,
        projectId: additionalContext.projectId,
      };
      break;
    default:
      throw new Error(`Invalid destination type: ${destinationType}`);
  }

  return { documentCollectionName, sectionCollectionName, foreignKeys };
};
