import type { ReactElement } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { DragEndEvent } from '@dnd-kit/core';
import PageHeader from '@/components/layouts/PageHeader';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { WeldDetailsCard } from './WeldDetailsCard';
import { WeldDocumentsSection } from './WeldDocumentsSection';
import { WeldFormDialog } from '../weld-log-overview/WeldFormDialog';
import { useProject } from '@/hooks/useProjects';
import { useWeldLog } from '@/hooks/useWeldLogs';
import { useWeld, useWeldOperations } from '@/hooks/useWelds';
import { useUser } from '@/hooks/useUsers';
import { useDocuments, useDocumentImport } from '@/hooks/documents';
import { ImportDialog } from '@/components/documents/import';
import { CardDialog } from '@/components/documents/cards';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import type { Weld } from '@/types/models/welding';
import type { Document } from '@/types/api/firestore';
import type { SelectedItem } from '@/types/documents';
import type {
  SingleWeldFormData,
  MultipleWeldsFormData,
} from '@/types/forms/weld-forms';

interface WeldFormDialogState {
  isOpen: boolean;
  weld: Weld | null;
}

interface RenameDialogState {
  open: boolean;
  id: string | null;
  title: string;
}

interface RouteParams {
  projectId: string;
  weldLogId: string;
  weldId: string;
}

export default function WeldOverview(): ReactElement {
  const { t } = useTranslation();

  // Get the project ID, weld log ID, and weld ID from the URL parameters
  const { projectId, weldLogId, weldId } =
    useParams() as unknown as RouteParams;

  // State for managing dialogs
  const [weldFormDialog, setWeldFormDialog] = useState<WeldFormDialogState>({
    isOpen: false,
    weld: null,
  });

  // Fetch the project, weld log, and weld data
  const [project, projectLoading, projectError] = useProject(projectId);
  const [weldLog, weldLogLoading, weldLogError] = useWeldLog(weldLogId);
  const [weld, weldLoading, weldError] = useWeld(weldId);

  // Fetch the welder's user details
  const [creator] = useUser(weld?.welderId);

  // Weld operations
  const { updateWeld } = useWeldOperations();

  // --- Document logic for Documents section ---
  const documentsHook = useDocuments({
    entityType: 'weld',
    entityId: weldId,
    additionalForeignKeys: { projectId, weldLogId },
  });
  const {
    documents,
    documentsLoading: docsLoading,
    documentsError: docsError,
    handleUpload,
    uploadingFiles,
    renameDocument,
    deleteDocument,
    updateDocumentOrder,
  } = documentsHook;

  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    open: false,
    id: null,
    title: '',
  });
  const deleteDocumentDialog = useConfirmationDialog({});

  // State for drag-and-drop optimistic updates
  const [draggedDocuments, setDraggedDocuments] = useState<Document[] | null>(
    null
  );

  // Reset dragged state when documents change (e.g., after import, delete, or Firestore updates)
  // This follows the same pattern as MULTI sections for consistency
  useEffect(() => {
    setDraggedDocuments(null);
  }, [documents]);

  // Use dragged order if available, otherwise use original order
  const documentsToRender = useMemo(() => {
    return draggedDocuments || documents;
  }, [draggedDocuments, documents]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent): void => {
    if (event.active && event.over) {
      const oldIndex = documentsToRender.findIndex(
        (doc) => doc.id === event.active.id.toString()
      );
      const newIndex = documentsToRender.findIndex(
        (doc) => doc.id === event.over!.id.toString()
      );

      if (oldIndex !== newIndex) {
        // Create a new array with the updated order
        const newDocuments = Array.from(documentsToRender);
        const [movedItem] = newDocuments.splice(oldIndex, 1);
        newDocuments.splice(newIndex, 0, movedItem);

        // Update local state immediately for smooth animation
        setDraggedDocuments(newDocuments as Document[]);

        // Update Firestore in the background
        updateDocumentOrder(newDocuments.map((doc) => doc.id))
          .then((result) => {
            if (result && result.success) {
              toast.success(t('documents.orderUpdateSuccess'));
              // Clear dragged state on success - Firestore will provide the new order
              setDraggedDocuments(null);
            } else if (result) {
              const errorMessage =
                result.error instanceof Error
                  ? result.error.message
                  : String(result.error);
              toast.error(errorMessage || t('errors.unknownError'), {
                description: t('documents.orderUpdateError'),
              });
              // Revert to original order on error
              setDraggedDocuments(null);
            }
          })
          .catch((error: Error) => {
            toast.error(error.message || t('errors.unknownError'), {
              description: t('documents.orderUpdateError'),
            });
            // Revert to original order on error
            setDraggedDocuments(null);
          });
      }
    }
  };

  const handleOpenRenameDialog = (id: string, title: string): void =>
    setRenameDialog({ open: true, id, title });

  const handleOpenDeleteDialog = (id: string, title: string): void =>
    deleteDocumentDialog.open('delete', { id, title }, false);

  const handleRenameSubmit = async (newTitle: string): Promise<void> => {
    try {
      await renameDocument(renameDialog.id!, newTitle);
      // Success toast is already shown by useFirestoreOperations
    } catch {
      // Error toast is already shown by useFirestoreOperations
    } finally {
      setRenameDialog({ open: false, id: null, title: '' });
    }
  };

  const handleDeleteSubmit = async (): Promise<void> => {
    try {
      const data = deleteDocumentDialog.dialog.data;
      if (data && !Array.isArray(data) && 'id' in data) {
        const result = await deleteDocument(data.id as string);
        if (result && result.success) {
          // Success toast is already shown by useFirestoreOperations
        } else if (result) {
          // Error is already handled by useFirestoreOperations
        }
      }
    } catch {
      // Error is already handled by useFirestoreOperations
    } finally {
      deleteDocumentDialog.close();
    }
  };

  // Import documents handler
  const { importItems, isImporting } = useDocumentImport('weld', weldId);

  const handleImportSubmit = async (items: SelectedItem[]): Promise<void> => {
    try {
      // SelectedItem is compatible with ImportItem - both have the required fields
      const results = await importItems(
        items as Parameters<typeof importItems>[0],
        { projectId, weldLogId }
      );
      setImportDialogOpen(false);

      // Show success toast
      const successfulSections = results.sections?.length || 0;
      const successfulDocuments = results.documents?.length || 0;
      const totalSuccess = successfulSections + successfulDocuments;

      if (totalSuccess > 0) {
        if (successfulSections > 0 && successfulDocuments > 0) {
          toast.success(
            t('documents.importSuccessSectionsAndDocuments', {
              sectionCount: successfulSections,
              documentCount: successfulDocuments,
            })
          );
        } else if (successfulSections > 0) {
          toast.success(
            t('documents.importSuccessSections', {
              count: successfulSections,
            })
          );
        } else {
          toast.success(
            t('documents.importSuccessDocuments', {
              count: successfulDocuments,
            })
          );
        }
      }

      // Show error toast if there were any errors
      if (results.errors && results.errors.length > 0) {
        // Show specific error messages
        results.errors.forEach(({ item, error }) => {
          if (item) {
            toast.error(`${item.title || item.name}: ${error}`);
          }
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('documents.importError');
      toast.error(errorMessage);
    }
  };

  // Handler for weld form submission
  const handleWeldSubmit = async (
    data: SingleWeldFormData | MultipleWeldsFormData
  ): Promise<void> => {
    try {
      // Edit existing weld - only single weld data is relevant for editing
      if ('number' in data) {
        await updateWeld(weldId, data as SingleWeldFormData, weldLogId);
        setWeldFormDialog({ isOpen: false, weld: null });
      }
      // Success toast is already handled by the hook
    } catch {
      // Error toast is already handled by the hook operations
    }
  };

  // Handler for weld dialog change
  const handleWeldDialogChange = (isOpen: boolean): void => {
    setWeldFormDialog((prev) => ({ ...prev, isOpen }));
  };

  // Handler for delete confirmation dialog change
  const handleDeleteConfirmDialogChange = (isOpen: boolean): void => {
    if (!isOpen) deleteDocumentDialog.close();
  };

  return (
    <>
      {/* Main content with padding */}
      <div className="space-y-6">
        {!projectLoading &&
          !projectError &&
          !weldLogLoading &&
          !weldLogError &&
          !weldLoading &&
          !weldError &&
          project &&
          weldLog &&
          weld && (
            <PageHeader
              title={t('welds.weldOverview')}
              breadcrumbData={{
                projectName: project.projectName,
                weldLogName: weldLog.name,
                weldNumber: weld.number,
              }}
            />
          )}

        <ErrorLoadingWrapper
          error={projectError || weldLogError || weldError || null}
          loading={projectLoading || weldLogLoading || weldLoading}
          resourceName={
            projectError
              ? t('navigation.projects').toLowerCase()
              : weldLogError
                ? t('navigation.weldLogs').toLowerCase()
                : t('welds.weld').toLowerCase()
          }
        >
          <div className="space-y-4">
            {/* Weld Details Card */}
            <WeldDetailsCard
              weld={weld}
              creator={creator}
              onEdit={(weld: Weld) =>
                setWeldFormDialog({
                  isOpen: true,
                  weld,
                })
              }
            />

            {/* Attachments Section - Collapsible accordion */}
            <WeldDocumentsSection
              documents={documentsToRender as Document[]}
              documentsLoading={docsLoading}
              documentsError={docsError || null}
              onImportClick={() => setImportDialogOpen(true)}
              onDragEnd={handleDragEnd}
              onUpload={handleUpload}
              uploadingFiles={uploadingFiles}
              onRenameDocument={handleOpenRenameDialog}
              onDeleteDocument={handleOpenDeleteDialog}
            />
          </div>
        </ErrorLoadingWrapper>
      </div>

      {/* Document-related dialogs */}
      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSubmit={handleImportSubmit}
        isImporting={isImporting}
        mode="document"
        projectId={projectId}
      />
      <CardDialog
        open={renameDialog.open}
        onClose={() => setRenameDialog({ open: false, id: null, title: '' })}
        document={
          renameDialog.id
            ? { id: renameDialog.id, title: renameDialog.title }
            : null
        }
        onSubmit={handleRenameSubmit}
        dialogTitle={t('documents.editDocument')}
      />
      {/* Delete Document Confirmation Dialog - Direct use like other features */}
      <ConfirmationDialog
        isOpen={deleteDocumentDialog.dialog.isOpen}
        onOpenChange={handleDeleteConfirmDialogChange}
        onConfirm={handleDeleteSubmit}
        title={t('documents.deleteDocument')}
        description={t('documents.confirmDeleteDocument', {
          documentName:
            deleteDocumentDialog.dialog.data &&
            !Array.isArray(deleteDocumentDialog.dialog.data) &&
            'title' in deleteDocumentDialog.dialog.data
              ? (deleteDocumentDialog.dialog.data.title as string)
              : '',
        })}
        actionLabel={t('common.delete')}
        actionVariant="destructive"
      />

      {/* Weld form dialog for editing */}
      <WeldFormDialog
        open={weldFormDialog.isOpen}
        onOpenChange={handleWeldDialogChange}
        weld={weldFormDialog.weld}
        weldLogId={weldLogId}
        onSubmit={handleWeldSubmit}
      />
    </>
  );
}
