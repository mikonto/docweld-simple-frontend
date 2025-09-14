import { toast } from 'sonner';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Document } from '@/types/database';

/**
 * Document Section Operations
 * Extracted business logic and handlers from DocumentSection component
 * Keeps the component focused on UI while operations handle the logic
 */

export interface DialogData {
  id: string;
  title: string;
}

export interface Dialog<T = unknown> {
  open: (data?: T) => void;
  close: () => void;
  dialog?: { data: T };
}

export interface DeleteDialog {
  open: (type: string, data: DialogData, confirm: boolean) => void;
  close: () => void;
  dialog?: { data: DialogData };
}

export interface DeleteResult {
  success: boolean;
  deletedCount?: number;
  errorType?: string;
  error?: { message: string };
}

interface UploadResult {
  heicFileCount?: number;
}

type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>
) => string;

/**
 * Handle document rename initiation
 */
export const handleRename = (
  renameDocumentDialog: Dialog<DialogData>,
  docId: string,
  currentTitle: string
) => {
  renameDocumentDialog.open({ id: docId, title: currentTitle });
};

/**
 * Handle document delete initiation
 */
export const handleDelete = (
  deleteDocumentDialog: DeleteDialog,
  docId: string,
  title: string
) => {
  deleteDocumentDialog.open('delete', { id: docId, title }, false);
};

/**
 * Confirm and execute document deletion
 */
export const handleConfirmDocumentDelete = async (
  deleteDocument: (id: string) => Promise<DeleteResult>,
  deleteDocumentDialog: Dialog<DialogData> & { dialog: { data: DialogData } }
) => {
  try {
    const result = await deleteDocument(deleteDocumentDialog.dialog.data.id);
    if (result.success) {
      // Success toast is already shown by useFirestoreOperations
    } else {
      // Error is already handled by useFirestoreOperations
    }
  } catch {
    // Error is already handled by useFirestoreOperations
  } finally {
    deleteDocumentDialog.close();
  }
};

/**
 * Confirm and execute section deletion with document cleanup
 */
export const handleConfirmSectionDelete = async (
  deleteSection: (id: string) => Promise<DeleteResult>,
  deleteSectionDialog: Dialog,
  sectionId: string,
  t: TranslationFunction
) => {
  try {
    const result = await deleteSection(sectionId);
    if (result.success) {
      // Success toast is already shown by useFirestoreOperations
      // Show additional info if documents were deleted
      if (result.deletedCount && result.deletedCount > 1) {
        const deletedDocumentCount = result.deletedCount - 1; // Subtract 1 for the section itself
        toast.info(
          t('sections.deleteWithDocumentsInfo', {
            count: deletedDocumentCount,
          })
        );
      }
    } else {
      // Handle specific error types that useFirestoreOperations doesn't know about
      if (result.errorType === 'indexError') {
        toast.error(t('sections.deleteIndexError'));
      } else if (result.errorType === 'batchLimitError') {
        toast.error(t('sections.deleteBatchLimitError'));
      }
      // Generic errors are already handled by useFirestoreOperations
    }
  } catch {
    // Error is already handled by useFirestoreOperations
  } finally {
    deleteSectionDialog.close();
  }
};

/**
 * Handle drag-and-drop reordering of documents
 */
export const handleDragEnd = async (
  event: DragEndEvent,
  localDocuments: Document[],
  setDraggedDocuments: (documents: Document[] | null) => void,
  updateDocumentOrder: (ids: string[]) => Promise<DeleteResult | undefined>,
  t: TranslationFunction
) => {
  if (event.active && event.over) {
    const oldIndex = localDocuments.findIndex(
      (doc) => doc.id === event.active.id.toString()
    );
    const newIndex = localDocuments.findIndex(
      (doc) => doc.id === event.over!.id.toString()
    );

    if (oldIndex !== newIndex) {
      // Create a new array with the updated order
      const newDocuments = Array.from(localDocuments);
      const [movedItem] = newDocuments.splice(oldIndex, 1);
      newDocuments.splice(newIndex, 0, movedItem);

      // Update local state immediately for smooth animation
      setDraggedDocuments(newDocuments);

      // Update Firestore in the background
      updateDocumentOrder(newDocuments.map((doc) => doc.id))
        .then((result) => {
          if (result && result.success) {
            // Order update doesn't trigger toast from useFirestoreOperations
            // So we show our own success message
            toast.success(t('documents.orderUpdateSuccess'));
          } else if (result) {
            // Show error and revert
            toast.error(result.error?.message || t('errors.unknownError'), {
              description: t('documents.orderUpdateError'),
            });
            setDraggedDocuments(null);
          }
        })
        .catch((error: Error) => {
          // Show error and revert
          toast.error(error.message || t('errors.unknownError'), {
            description: t('documents.orderUpdateError'),
          });
          setDraggedDocuments(null);
        });
    }
  }
};

/**
 * Handle file upload with HEIC conversion support
 */
export const handleUploadFiles = async (
  files: File[],
  handleUpload: (files: File[]) => Promise<UploadResult>,
  t: TranslationFunction
) => {
  try {
    const result = await handleUpload(files);

    // Don't show success toast here - it will be shown when processing completes
    // Only show HEIC conversion info if applicable
    if (result && result.heicFileCount && result.heicFileCount > 0) {
      toast.info(
        t('documents.heicConversionInfo', { count: result.heicFileCount })
      );
    }
  } catch (error: unknown) {
    // Provide more user-friendly error messages for common upload issues
    let errorMessage = t('documents.uploadError');

    // Type guard for error with message and code properties
    const isErrorWithDetails = (
      err: unknown
    ): err is { message?: string; code?: string } => {
      return (
        err !== null &&
        typeof err === 'object' &&
        ('message' in err || 'code' in err)
      );
    };

    if (isErrorWithDetails(error)) {
      if (error.message?.includes('Max')) {
        errorMessage = error.message; // Already has a good message for max files
      } else if (error.message?.includes('exceed size limit')) {
        errorMessage = t('documents.uploadSizeError');
      } else if (error.message?.includes('unsupported formats')) {
        errorMessage = t('documents.uploadFormatError');
      } else if (error.code === 'storage/unauthorized') {
        errorMessage = t('documents.uploadPermissionError');
      } else if (error.code === 'storage/canceled') {
        errorMessage = t('documents.uploadCanceledError');
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    toast.error(errorMessage);
  }
};
