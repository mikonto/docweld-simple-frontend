import { COLLECTIONS } from '@/constants/firestore';

export type DestinationType = 'project' | 'library' | 'weldLog' | 'weld';

interface ImportDestinationConfig {
  documentCollectionName: string;
  sectionCollectionName: string;
  foreignKeys: Record<string, string>;
}

export interface AdditionalContext {
  projectId?: string;
  weldLogId?: string;
}

/**
 * Returns collection names and foreign keys for document/section imports.
 */
export const getImportDestinationConfig = (
  destinationType: DestinationType,
  destinationId: string,
  additionalContext: AdditionalContext = {}
): ImportDestinationConfig => {
  let documentCollectionName = '';
  let sectionCollectionName = '';
  let foreignKeys: Record<string, string> = {};

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
        projectId: additionalContext.projectId || '',
      };
      break;
    case 'weld':
      documentCollectionName = COLLECTIONS.WELD_DOCUMENTS;
      sectionCollectionName = COLLECTIONS.WELD_DOCUMENT_SECTIONS;
      foreignKeys = {
        weldId: destinationId,
        weldLogId: additionalContext.weldLogId || '',
        projectId: additionalContext.projectId || '',
      };
      break;
    default:
      throw new Error(`Invalid destination type: ${destinationType}`);
  }

  return { documentCollectionName, sectionCollectionName, foreignKeys };
};
