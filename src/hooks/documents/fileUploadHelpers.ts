/**
 * Helper functions for file upload operations
 * Extracted from useFileUpload to improve readability and maintainability
 */

import { doc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UPLOAD_CONFIG } from '@/components/documents/constants';
import { isAllowedFile } from '@/components/documents/utils/fileUtils';
import { sanitizeFileName } from '@/utils/sanitizeFileName';

interface ValidationResult {
  isValid: boolean;
  error: Error | null;
  oversizedFiles: File[];
  notAllowedFiles: File[];
  heicFileCount: number;
  filesToUpload?: File[];
}

export interface PlannedDocument {
  file: File;
  docId: string;
  sanitizedFileName: string;
}

export interface FirestoreConfig {
  collectionName: string;
  [key: string]: any;
}

interface UploadError extends Error {
  isBatchCreationError?: boolean;
  failedCount?: number;
  failedAtIndex?: number;
  code?: string;
}

export interface UploadResults {
  heicFileCount: number;
  totalFiles: number;
  errors: Error[];
  successCount: number;
  failedCount: number;
}

/**
 * Validates a batch of files for upload
 */
export function validateUploadBatch(files: FileList | File[]): ValidationResult {
  const filesToUpload = Array.from(files);

  // Check max files limit
  if (filesToUpload.length > UPLOAD_CONFIG.MAX_FILES) {
    return {
      isValid: false,
      error: new Error(
        `Max ${UPLOAD_CONFIG.MAX_FILES} files allowed. ${filesToUpload.length} selected.`
      ),
      oversizedFiles: [],
      notAllowedFiles: [],
      heicFileCount: 0,
    };
  }

  // Check file sizes
  const oversizedFiles = filesToUpload.filter(
    (file) => file.size > UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024
  );

  // Check file types
  const notAllowedFiles = filesToUpload.filter((file) => !isAllowedFile(file));

  // Count HEIC files for user notification
  const heicFileCount = filesToUpload.filter((file) => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return ['.heic', '.heif'].includes(extension);
  }).length;

  if (oversizedFiles.length > 0 || notAllowedFiles.length > 0) {
    return {
      isValid: false,
      error: new Error(
        `Upload failed: ${oversizedFiles.length} files exceed size limit, ${notAllowedFiles.length} files have unsupported formats.`
      ),
      oversizedFiles,
      notAllowedFiles,
      heicFileCount,
    };
  }

  return {
    isValid: true,
    error: null,
    oversizedFiles: [],
    notAllowedFiles: [],
    heicFileCount,
    filesToUpload,
  };
}

/**
 * Prepares the upload plan for a batch of files
 * Generates document IDs and sanitized filenames
 */
export function prepareUploadPlan(
  files: File[],
  config: FirestoreConfig
): PlannedDocument[] {
  const plannedDocuments: PlannedDocument[] = [];

  for (const file of files) {
    const sanitizedName = sanitizeFileName(file.name);
    const docId = doc(collection(db, config.collectionName)).id;

    plannedDocuments.push({
      file,
      docId,
      sanitizedFileName: sanitizedName,
    });
  }

  return plannedDocuments;
}

/**
 * Creates documents in Firestore with rollback support
 * If any document creation fails, all previously created documents are rolled back
 *
 * WHY ROLLBACK:
 * This ensures users don't get partial uploads. If document #3 fails,
 * we clean up documents #1 and #2 to maintain data consistency.
 */
export async function createDocumentsWithRollback(
  plannedDocuments: PlannedDocument[],
  addDocument: (
    fileName: string,
    docId: string,
    order: number | null,
    fileExtension: string,
    fileSize: number
  ) => Promise<void>,
  config: FirestoreConfig
): Promise<PlannedDocument[]> {
  const createdDocuments: PlannedDocument[] = [];

  for (const { file, docId, sanitizedFileName } of plannedDocuments) {
    try {
      // Extract file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

      // Create document in Firestore
      await addDocument(
        sanitizedFileName,
        docId,
        null, // order - let addDocument calculate it
        fileExtension,
        file.size
      );

      createdDocuments.push({ file, docId, sanitizedFileName });
    } catch (err) {
      // ========== ROLLBACK ON FAILURE ==========
      // Clean up any documents that were already created
      if (createdDocuments.length > 0) {
        await rollbackDocuments(createdDocuments, config);
      }

      // Create enhanced error with batch info
      const batchError = new Error(
        err instanceof Error ? err.message : 'Document creation failed'
      ) as UploadError;
      batchError.isBatchCreationError = true;
      batchError.failedCount =
        plannedDocuments.length - createdDocuments.length;
      batchError.failedAtIndex = createdDocuments.length;

      throw batchError;
    }
  }

  return createdDocuments;
}

/**
 * Rolls back created documents by deleting them from Firestore
 * Used when document creation fails partway through a batch
 */
async function rollbackDocuments(
  documents: PlannedDocument[],
  config: FirestoreConfig
): Promise<void> {
  const rollbackPromises = documents.map(async ({ docId }) => {
    try {
      await deleteDoc(doc(db, config.collectionName, docId));
    } catch {
      // Failed to rollback document - continue with other rollbacks
      // Better to clean up what we can than fail entirely
    }
  });

  // Wait for all rollbacks to complete
  await Promise.allSettled(rollbackPromises);
}

/**
 * Creates enhanced error messages for storage errors
 */
export function getStorageErrorMessage(err: UploadError): string {
  if (err.code === 'storage/unauthorized') {
    return "You don't have permission to upload to this location";
  } else if (err.code === 'storage/canceled') {
    return 'Upload was canceled';
  } else if (err.code === 'storage/unknown') {
    return 'Upload failed due to unknown error. Please check your connection';
  } else if (err.code === 'storage/quota-exceeded') {
    return 'Storage quota exceeded. Please contact administrator';
  } else if (err.message) {
    return err.message;
  }
  return 'Upload failed';
}

/**
 * Process upload results and prepare response
 */
export function processUploadResults(
  uploadResults: PromiseSettledResult<any>[],
  heicFileCount: number,
  totalFiles: number
): UploadResults {
  const errors = uploadResults.filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected'
  );

  return {
    heicFileCount,
    totalFiles,
    errors: errors.map((e) => e.reason),
    successCount: uploadResults.filter((r) => r.status === 'fulfilled').length,
    failedCount: errors.length,
  };
}