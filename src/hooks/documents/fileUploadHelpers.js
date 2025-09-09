/**
 * Helper functions for file upload operations
 * Extracted from useFileUpload to improve readability and maintainability
 */

import { doc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UPLOAD_CONFIG } from '@/components/documents/constants';
import { isAllowedFile } from '@/components/documents/utils/fileUtils';
import { sanitizeFileName } from '@/utils/sanitizeFileName';

/**
 * Validates a batch of files for upload
 * @param {File[]} files - Array of files to validate
 * @returns {Object} Validation result with isValid flag and error details
 */
export function validateUploadBatch(files) {
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
 * @param {File[]} files - Array of files to upload
 * @param {Object} config - Firestore configuration
 * @returns {Array} Array of planned documents with file, docId, and sanitizedFileName
 */
export function prepareUploadPlan(files, config) {
  const plannedDocuments = [];

  for (const file of files) {
    const sanitizedFileName = sanitizeFileName(file.name);
    const docId = doc(collection(db, config.collectionName)).id;

    plannedDocuments.push({
      file,
      docId,
      sanitizedFileName,
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
 *
 * @param {Array} plannedDocuments - Array of planned documents
 * @param {Function} addDocument - Function to add document to Firestore
 * @param {Object} config - Firestore configuration
 * @returns {Array} Array of successfully created documents
 */
export async function createDocumentsWithRollback(
  plannedDocuments,
  addDocument,
  config
) {
  const createdDocuments = [];

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
      const batchError = new Error(err.message);
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
 * @param {Array} documents - Array of documents to roll back
 * @param {Object} config - Firestore configuration
 */
async function rollbackDocuments(documents, config) {
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
 * @param {Error} err - Original error from storage
 * @returns {string} User-friendly error message
 */
export function getStorageErrorMessage(err) {
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
 * @param {Array} uploadResults - Results from Promise.allSettled
 * @param {number} heicFileCount - Number of HEIC files in batch
 * @param {number} totalFiles - Total number of files
 * @returns {Object} Upload info with counts and errors
 */
export function processUploadResults(uploadResults, heicFileCount, totalFiles) {
  const errors = uploadResults.filter((r) => r.status === 'rejected');

  return {
    heicFileCount,
    totalFiles,
    errors: errors.map((e) => e.reason),
    successCount: uploadResults.filter((r) => r.status === 'fulfilled').length,
    failedCount: errors.length,
  };
}
