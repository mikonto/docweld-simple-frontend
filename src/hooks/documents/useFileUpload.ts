// src/hooks/documents/useFileUpload.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { collection, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, StorageError } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { sanitizeFileName } from '@/utils/sanitizeFileName';
import { getMimeTypeFromExtension } from '@/components/documents/utils/fileUtils';
import {
  validateUploadBatch,
  prepareUploadPlan,
  createDocumentsWithRollback,
  getStorageErrorMessage,
  processUploadResults,
  FirestoreConfig,
  UploadResults,
} from './fileUploadHelpers';
import type { BaseDocumentData } from './useBaseDocumentOperations';

interface UploadingFileStatus {
  file: File;
  uploadStatus: 'uploading' | 'complete';
}

interface UseFileUploadConfig {
  collectionName: string;
  foreignKeys?: Record<string, string>;
}

interface EnhancedError extends Error {
  enhancedMessage?: string;
  code?: string;
}

type AddDocumentFunction = (
  title: string,
  docId: string,
  orderValue?: number | null,
  fileType?: string | null,
  fileSize?: number | null
) => Promise<BaseDocumentData>;

type UpdateProcessingStateFunction = (
  docId: string,
  processingState: string
) => Promise<void>;

interface UseFileUploadReturn {
  uploadingFiles: Record<string, UploadingFileStatus>;
  handleFileUpload: (
    file: File,
    onComplete: (docId: string) => void,
    onError: (docId: string, error: unknown) => void,
    existingDocId?: string | null
  ) => { docId: string };
  handleUpload: (
    files: FileList | File[],
    updateDocumentOrder?: (
      orderedDocIds: string[]
    ) => Promise<{ success: boolean; error?: Error | unknown }>
  ) => Promise<UploadResults>;
  handleCancelUpload: (fileId: string) => void;
}

/**
 * Custom hook for handling file uploads
 */
export function useFileUpload(
  firestoreConfig: UseFileUploadConfig,
  addDocument: AddDocumentFunction,
  updateProcessingState: UpdateProcessingStateFunction
): UseFileUploadReturn {
  const [uploadingFiles, setUploadingFiles] = useState<
    Record<string, UploadingFileStatus>
  >({});
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(
    (
      file: File,
      onComplete: (docId: string) => void,
      onError: (docId: string, error: unknown) => void,
      existingDocId: string | null = null
    ): { docId: string } => {
      const sanitizedName = sanitizeFileName(file.name);

      // Use existing doc ID or generate a new one
      let docId = existingDocId;
      if (!docId) {
        // Flat structure with collection name
        docId = doc(collection(db, firestoreConfig.collectionName)).id;
      }

      // Create the storage path using simplified structure (documents/{docId}/{filename})
      const storageRefPath = `documents/${docId}/${sanitizedName}`;
      const storageRef = ref(storage, storageRefPath);

      // Define metadata for the upload
      const metadata = {
        contentType: file.type || getMimeTypeFromExtension(sanitizedName),
        contentDisposition: 'inline', // Suggest browser to display inline
      };

      // First upload the file with metadata
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        () => {
          // Progress tracking removed - we only care about completion
        },
        (err: StorageError) => {
          // Use helper to get user-friendly error message
          const errorMessage = getStorageErrorMessage(err);
          const enhancedError: EnhancedError = {
            name: err.name || 'StorageError',
            message: err.message || 'Upload failed',
            enhancedMessage: errorMessage,
            code: err.code,
          };
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
            addDocument(sanitizedName, docId)
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
   */
  const handleUpload = useCallback(
    async (
      files: FileList | File[],
      _updateDocumentOrder?: (
        orderedDocIds: string[]
      ) => Promise<{ success: boolean; error?: Error | unknown }>
    ): Promise<UploadResults> => {
      // ========== STEP 1: VALIDATE FILES ==========
      const validation = validateUploadBatch(files);
      if (!validation.isValid) {
        throw validation.error;
      }

      const { filesToUpload, heicFileCount } = validation;
      if (!filesToUpload) {
        throw new Error('No files to upload');
      }

      // ========== STEP 2: PREPARE UPLOAD PLAN ==========
      const plannedDocuments = prepareUploadPlan(
        filesToUpload,
        firestoreConfig as FirestoreConfig
      );

      // Set upload statuses BEFORE creating any documents to prevent UI flash
      const uploadStatuses: Record<string, UploadingFileStatus> = {};
      plannedDocuments.forEach(({ file, docId }) => {
        uploadStatuses[docId] = {
          file,
          uploadStatus: 'uploading',
        };
      });
      setUploadingFiles((prev) => ({ ...prev, ...uploadStatuses }));

      try {
        // ========== STEP 3: CREATE DOCUMENTS WITH ROLLBACK ==========
        // Wrap addDocument to match the expected signature
        const addDocumentWrapper = async (
          fileName: string,
          docId: string,
          order: number | null,
          fileExtension: string,
          fileSize: number
        ): Promise<void> => {
          await addDocument(fileName, docId, order, fileExtension, fileSize);
        };

        const createdDocuments = await createDocumentsWithRollback(
          plannedDocuments,
          addDocumentWrapper,
          firestoreConfig as FirestoreConfig
        );

        // ========== STEP 4: UPLOAD FILES TO STORAGE ==========
        // All documents created successfully in Firestore.
        // Now upload the actual files to Storage.
        // Documents are already visible in UI with "uploading" status
        const uploadPromises = createdDocuments.map(({ file, docId }) => {
          return new Promise<string>((resolve, reject) => {
            handleFileUpload(
              file,
              (id: string) => {
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
              (id: string, error: unknown) => {
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

  /**
   * Cancel an upload
   */
  const handleCancelUpload = useCallback((fileId: string) => {
    // Clear timeout if it exists
    if (timeoutRefs.current[fileId]) {
      clearTimeout(timeoutRefs.current[fileId]);
      delete timeoutRefs.current[fileId];
    }

    // Remove from uploading files
    setUploadingFiles((prev) => {
      const newUploadingFiles = { ...prev };
      delete newUploadingFiles[fileId];
      return newUploadingFiles;
    });
  }, []);

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
    handleCancelUpload,
  };
}
