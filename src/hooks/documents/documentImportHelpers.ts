/**
 * Helper functions for document import operations
 * Extracted from useDocumentImport to improve readability and maintainability
 */

import {
  doc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch,
  setDoc,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/config/firebase';
import { getFileExtension } from '@/components/documents/utils/fileUtils';
import { getImportDestinationConfig, DestinationType, AdditionalContext } from './utils';
import type { User, FirestoreDocument, FirestoreSection, ImportedDocumentData, ImportedSectionData } from '@/types';

interface CopyDocumentResponse {
  success: boolean;
}

interface StorageRefs {
  storageRef?: string;
  thumbStorageRef?: string;
}

type SourceType = 'project' | 'library';

/**
 * Copy a file using the Cloud Function
 */
async function copyStorageFile(sourcePath: string, destPath: string): Promise<boolean> {
  try {
    const copyDocumentFn = httpsCallable<
      { sourceStoragePath: string; destinationStoragePath: string },
      CopyDocumentResponse
    >(functions, 'copyDocument');
    const result = await copyDocumentFn({
      sourceStoragePath: sourcePath,
      destinationStoragePath: destPath,
    });
    return result.data.success === true;
  } catch {
    return false;
  }
}

/**
 * Copies a document's main file and thumbnail
 */
async function copyDocumentFiles(
  sourceDoc: Partial<FirestoreDocument>,
  newDocId: string
): Promise<StorageRefs> {
  const storageRefs: StorageRefs = {};

  // Copy main file
  if (sourceDoc.storageRef) {
    const filename = sourceDoc.storageRef.split('/').pop();
    if (!filename) {
      throw new Error('Invalid storage reference path');
    }
    const destPath = `documents/${newDocId}/${filename}`;
    const success = await copyStorageFile(sourceDoc.storageRef, destPath);
    if (!success) {
      throw new Error(`Failed to copy document file: ${sourceDoc.storageRef}`);
    }
    storageRefs.storageRef = destPath;
  }

  // Copy thumbnail
  if (sourceDoc.thumbStorageRef) {
    const thumbFilename = sourceDoc.thumbStorageRef.split('/').pop();
    if (!thumbFilename) {
      throw new Error('Invalid thumbnail storage reference path');
    }
    const destThumbPath = `documents/${newDocId}/${thumbFilename}`;
    const success = await copyStorageFile(
      sourceDoc.thumbStorageRef,
      destThumbPath
    );
    if (!success) {
      throw new Error(`Failed to copy thumbnail: ${sourceDoc.thumbStorageRef}`);
    }
    storageRefs.thumbStorageRef = destThumbPath;
  }

  return storageRefs;
}

/**
 * Gets the highest order value for documents in a given context
 *
 * WHY THIS EXISTS:
 * When importing documents, we need to place them at the END of existing documents
 * to avoid disrupting the user's current organization. This function finds the
 * highest order value so we can add 1000 to it for the new imported items.
 */
async function getHighestOrderValue(
  collectionName: string,
  foreignKeys: Record<string, string>,
  targetSectionId: string | null,
  destinationType: DestinationType,
  destinationId: string
): Promise<number> {
  let highestOrder = 0;

  if (destinationType === 'weldLog') {
    // Weld logs don't have sections, query all documents
    const allDocsQuery = query(
      collection(db, collectionName),
      where('weldLogId', '==', destinationId)
    );
    const snapshot = await getDocs(allDocsQuery);
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'active' && data.order > highestOrder) {
        highestOrder = data.order;
      }
    });
  } else {
    // Projects and libraries have sections
    const foreignKeyName = Object.keys(foreignKeys)[0];
    const foreignKeyValue = Object.values(foreignKeys)[0];
    const orderQuery = query(
      collection(db, collectionName),
      where(foreignKeyName, '==', foreignKeyValue),
      where('sectionId', '==', targetSectionId),
      where('status', '==', 'active'),
      orderBy('order', 'desc')
    );
    const orderSnapshot = await getDocs(orderQuery);
    if (!orderSnapshot.empty) {
      highestOrder = orderSnapshot.docs[0].data().order;
    }
  }

  return highestOrder;
}

/**
 * Prepares data for a new document
 */
export function prepareNewDocumentData(
  newDocId: string,
  sourceDoc: Partial<FirestoreDocument>,
  foreignKeys: Record<string, string>,
  targetSectionId: string | null,
  order: number,
  storageRefs: StorageRefs,
  destinationType: DestinationType,
  loggedInUser: User | null
): ImportedDocumentData {
  const timestamp = serverTimestamp();

  const fileType = sourceDoc.fileType ||
    getFileExtension(sourceDoc.storageRef || '')
      .substring(1)
      .toUpperCase() ||
    'FILE';

  return {
    id: newDocId,
    ...foreignKeys,
    sectionId: destinationType === 'weldLog' ? null : targetSectionId,
    title: sourceDoc.title || 'Untitled Document',
    fileType,
    fileSize: sourceDoc.fileSize || 0,
    processingState: 'completed',
    status: 'active',
    order,
    createdAt: timestamp,
    createdBy: loggedInUser?.id || 'system',
    updatedAt: timestamp,
    updatedBy: loggedInUser?.id || 'system',
    importedFrom: sourceDoc.id,
    importedAt: timestamp,
    storageRef: storageRefs.storageRef || '',
    thumbStorageRef: storageRefs.thumbStorageRef || null,
  };
}

/**
 * Prepares data for a new section
 */
export function prepareNewSectionData(
  newSectionId: string,
  sourceSection: Partial<FirestoreSection & { id?: string }>,
  foreignKeys: Record<string, string>,
  order: number,
  loggedInUser: User | null
): ImportedSectionData {
  const timestamp = serverTimestamp();

  return {
    id: newSectionId,
    ...foreignKeys,
    name: sourceSection.name || 'Untitled Section',
    description: sourceSection.description || '',
    status: 'active',
    order,
    createdAt: timestamp,
    createdBy: loggedInUser?.id || 'system',
    updatedAt: timestamp,
    updatedBy: loggedInUser?.id || 'system',
    importedFrom: sourceSection.id || null,
    importedAt: timestamp,
  };
}

/**
 * Fetches source documents for a section
 */
async function getSectionSourceDocuments(
  sourceSection: { id: string },
  sourceType: SourceType,
  sourceId: string
): Promise<QuerySnapshot<DocumentData>> {
  const sourceDocCollection =
    sourceType === 'project' ? 'project-documents' : 'library-documents';

  const sourceDocsQuery = query(
    collection(db, sourceDocCollection),
    where(sourceType === 'project' ? 'projectId' : 'libraryId', '==', sourceId),
    where('sectionId', '==', sourceSection.id),
    where('status', '==', 'active'),
    orderBy('order', 'asc')
  );

  return await getDocs(sourceDocsQuery);
}

/**
 * Import a single document to the destination
 */
export async function importSingleDocument(
  sourceDoc: Partial<FirestoreDocument>,
  targetSectionId: string | null,
  destinationType: DestinationType,
  destinationId: string,
  additionalContext: AdditionalContext,
  loggedInUser: User | null
): Promise<string> {
  const { documentCollectionName, foreignKeys } = getImportDestinationConfig(
    destinationType,
    destinationId,
    additionalContext
  );

  const newDocId = doc(collection(db, documentCollectionName)).id;

  // Get current highest order to append imported doc at the end
  const highestOrder = await getHighestOrderValue(
    documentCollectionName,
    foreignKeys,
    targetSectionId,
    destinationType,
    destinationId
  );
  const newOrder = highestOrder + 1000; // Place at end with 1000 gap

  // Copy files to new location
  const storageRefs = await copyDocumentFiles(sourceDoc, newDocId);

  // Prepare document data
  const newDocData = prepareNewDocumentData(
    newDocId,
    sourceDoc,
    foreignKeys,
    targetSectionId,
    newOrder,
    storageRefs,
    destinationType,
    loggedInUser
  );

  // Create document in Firestore
  await setDoc(doc(db, documentCollectionName, newDocId), newDocData);

  return newDocId;
}

/**
 * Import a complete section with all its documents
 */
export async function importCompleteSection(
  sourceSection: Partial<FirestoreSection> & { id: string; name: string },
  sourceType: SourceType,
  sourceId: string,
  destinationType: DestinationType,
  destinationId: string,
  loggedInUser: User | null
): Promise<string> {
  // Validate source section
  if (!sourceSection?.id) {
    throw new Error('Source section missing required id field');
  }
  if (!sourceSection?.name) {
    throw new Error('Source section missing required name field');
  }

  const { documentCollectionName, sectionCollectionName, foreignKeys } =
    getImportDestinationConfig(destinationType, destinationId);

  const newSectionId = doc(collection(db, sectionCollectionName)).id;
  const batch = writeBatch(db);

  // ========== STEP 1: GET SECTION ORDER ==========
  // Place new section at the end of existing sections
  const sectionOrderQuery = query(
    collection(db, sectionCollectionName),
    where(
      destinationType === 'project' ? 'projectId' : 'libraryId',
      '==',
      destinationId
    ),
    where('status', '==', 'active'),
    orderBy('order', 'desc')
  );
  const sectionOrderSnapshot = await getDocs(sectionOrderQuery);
  const highestSectionOrder = sectionOrderSnapshot.empty
    ? 0
    : sectionOrderSnapshot.docs[0].data().order;
  const newSectionOrder = highestSectionOrder + 1000;

  // ========== STEP 2: PREPARE SECTION DATA ==========
  const newSectionData = prepareNewSectionData(
    newSectionId,
    sourceSection,
    foreignKeys,
    newSectionOrder,
    loggedInUser
  );
  batch.set(doc(db, sectionCollectionName, newSectionId), newSectionData);

  // ========== STEP 3: FETCH SOURCE DOCUMENTS ==========
  const sourceDocsSnapshot = await getSectionSourceDocuments(
    sourceSection,
    sourceType,
    sourceId
  );

  // ========== STEP 4: PROCESS AND COPY DOCUMENTS ==========
  // Documents within imported section maintain their relative order
  const documentsToCreate: { docId: string; data: ImportedDocumentData }[] = [];
  let documentOrder = 1000; // First doc in section gets order 1000

  for (const docSnapshot of sourceDocsSnapshot.docs) {
    const sourceDoc = { id: docSnapshot.id, ...docSnapshot.data() } as FirestoreDocument;
    const newDocId = doc(collection(db, documentCollectionName)).id;

    // Copy files
    const storageRefs = await copyDocumentFiles(sourceDoc, newDocId);

    // Prepare document data
    const newDocData = prepareNewDocumentData(
      newDocId,
      sourceDoc,
      foreignKeys,
      newSectionId,
      documentOrder,
      storageRefs,
      destinationType,
      loggedInUser
    );

    documentsToCreate.push({ docId: newDocId, data: newDocData });
    documentOrder += 1000;
  }

  // ========== STEP 5: ADD DOCUMENTS TO BATCH ==========
  for (const { docId, data } of documentsToCreate) {
    batch.set(doc(db, documentCollectionName, docId), data);
  }

  // ========== STEP 6: COMMIT BATCH ==========
  await batch.commit();

  return newSectionId;
}