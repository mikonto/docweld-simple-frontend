// src/hooks/documents/shared/document-operations/useFileUpload.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { collection, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { sanitizeFileName } from '@/utils/sanitizeFileName';
import { getMimeTypeFromExtension } from '@/components/documents/utils/fileUtils';
import {
  validateUploadBatch,
  prepareUploadPlan,
  createDocumentsWithRollback,
  getStorageErrorMessage,
  processUploadResults,
} from './fileUploadHelpers';

/**
 * Custom hook for handling file uploads
 * @param {string|object} firestoreConfig - Firestore path string or config object with collectionName and foreignKeys
 *
 * @param {Function} addDocument - Function to add document to Firestore
 * @returns {object} File upload operations and state
 */
export function useFileUpload(
  firestoreConfig,
  addDocument,
  updateProcessingState
) {
  // Translation removed - UI concerns moved to components
  const [uploadingFiles, setUploadingFiles] = useState({});
  const timeoutRefs = useRef({});

  /**
   * Handle file upload
   * @param {File} file - File to upload
   * @param {Function} onComplete - Completion callback
   * @param {Function} onError - Error callback
   * @param {string} existingDocId - Optional existing document ID
   * @returns {object} Document ID and upload task
   */
  const handleFileUpload = useCallback(
    (file, onComplete, onError, existingDocId = null) => {
      const sanitizedFileName = sanitizeFileName(file.name);

      // Use existing doc ID or generate a new one
      let docId = existingDocId;
      if (!docId) {
        // Flat structure with collection name
        docId = doc(collection(db, firestoreConfig.collectionName)).id;
      }

      // Create the storage path using simplified structure (documents/{docId}/{filename})
      let storageRefPath = `documents/${docId}/${sanitizedFileName}`;
      const storageRef = ref(storage, storageRefPath);

      // Define metadata for the upload
      const metadata = {
        contentType: file.type || getMimeTypeFromExtension(sanitizedFileName),
        contentDisposition: 'inline', // Suggest browser to display inline
      };

      // First upload the file with metadata
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        () => {
          // Progress tracking removed - we only care about completion
        },
        (err) => {
          // Use helper to get user-friendly error message
          const errorMessage = getStorageErrorMessage(err);
          const enhancedError = { ...err, enhancedMessage: errorMessage };
          onError(docId, enhancedError);
        },
        async () => {
          // Upload complete

          // If document already exists (created upfront), update processing state
          if (existingDocId) {
            try {
              await updateProcessingState(docId, 'pending');
              onComplete(docId);
            } catch (err) {
              onError(docId, err);
            }
          } else {
            // Legacy behavior: create document after upload
            addDocument(sanitizedFileName, docId)
              .then(() => {
                onComplete(docId);
              })
              .catch((err) => {
                onError(docId, err);
              });
          }
        }
      );

      return { docId };
    },
    [firestoreConfig, addDocument, updateProcessingState]
  );

  /**
   * Handle the upload of multiple files
   * Simplified with extracted helper functions for better readability
   * @param {Array} files - Files to upload
   * @param {Function} updateDocumentOrder - Function to update document order
   */
  const handleUpload = useCallback(
    async (files) => {
      // ========== STEP 1: VALIDATE FILES ==========
      const validation = validateUploadBatch(files);
      if (!validation.isValid) {
        throw validation.error;
      }

      const { filesToUpload, heicFileCount } = validation;

      // ========== STEP 2: PREPARE UPLOAD PLAN ==========
      const plannedDocuments = prepareUploadPlan(
        filesToUpload,
        firestoreConfig
      );

      // Set upload statuses BEFORE creating any documents to prevent UI flash
      const uploadStatuses = {};
      plannedDocuments.forEach(({ file, docId }) => {
        uploadStatuses[docId] = {
          file,
          uploadStatus: 'uploading',
        };
      });
      setUploadingFiles((prev) => ({ ...prev, ...uploadStatuses }));

      try {
        // ========== STEP 3: CREATE DOCUMENTS WITH ROLLBACK ==========
        const createdDocuments = await createDocumentsWithRollback(
          plannedDocuments,
          addDocument,
          firestoreConfig
        );

        // ========== STEP 4: UPLOAD FILES TO STORAGE ==========
        // All documents created successfully in Firestore.
        // Now upload the actual files to Storage.
        // Documents are already visible in UI with "uploading" status
        const uploadPromises = createdDocuments.map(({ file, docId }) => {
          return new Promise((resolve, reject) => {
            handleFileUpload(
              file,
              (id) => {
                // Upload finished - document already exists, just update status
                setUploadingFiles((prev) => ({
                  ...prev,
                  [id]: {
                    ...prev[id],
                    uploadStatus: 'complete',
                  },
                }));

                // Clean up after a short delay to allow UI to update
                timeoutRefs.current[id] = setTimeout(() => {
                  setUploadingFiles((prev) => {
                    const newUploadingFiles = { ...prev };
                    delete newUploadingFiles[id];
                    return newUploadingFiles;
                  });
                  delete timeoutRefs.current[id];
                }, 1000);

                resolve(id);
              },
              (id, error) => {
                setUploadingFiles((prev) => {
                  const newUploadingFiles = { ...prev };
                  delete newUploadingFiles[id];
                  return newUploadingFiles;
                });
                reject(error);
              },
              docId // Pass the existing document ID
            );
          });
        });

        // ========== STEP 5: PROCESS RESULTS ==========
        const uploadResults = await Promise.allSettled(uploadPromises);
        return processUploadResults(
          uploadResults,
          heicFileCount,
          filesToUpload.length
        );
      } catch (err) {
        // Clean up upload statuses on error
        setUploadingFiles((prev) => {
          const newState = { ...prev };
          plannedDocuments.forEach(({ docId }) => {
            delete newState[docId];
          });
          return newState;
        });

        throw err; // Re-throw to let the caller handle it
      }
    },
    [handleFileUpload, addDocument, firestoreConfig]
  );

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      // Copy ref value to avoid stale closure warning
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timeouts = timeoutRefs.current;
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  return {
    uploadingFiles,
    handleFileUpload,
    handleUpload,
  };
}
