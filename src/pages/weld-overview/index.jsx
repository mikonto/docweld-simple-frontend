import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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

export default function WeldOverview() {
  const { t } = useTranslation();

  // Get the project ID, weld log ID, and weld ID from the URL parameters
  const { projectId, weldLogId, weldId } = useParams();

  // State for managing dialogs
  const [weldFormDialog, setWeldFormDialog] = useState({
    isOpen: false,
    weld: null,
  });

  // Fetch the project, weld log, and weld data
  const [project, projectLoading, projectError] = useProject(projectId);
  const [weldLog, weldLogLoading, weldLogError] = useWeldLog(weldLogId);
  const [weld, weldLoading, weldError] = useWeld(weldId);

  // Fetch the creator's user details
  const [creator] = useUser(weld?.createdBy);

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

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState({
    open: false,
    id: null,
    title: '',
  });
  const deleteDocumentDialog = useConfirmationDialog({});

  // State for drag-and-drop optimistic updates
  const [draggedDocuments, setDraggedDocuments] = useState(null);

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
  const handleDragEnd = (event) => {
    if (event.active && event.over) {
      const oldIndex = documentsToRender.findIndex(
        (doc) => doc.id === event.active.id.toString()
      );
      const newIndex = documentsToRender.findIndex(
        (doc) => doc.id === event.over.id.toString()
      );

      if (oldIndex !== newIndex) {
        // Create a new array with the updated order
        const newDocuments = Array.from(documentsToRender);
        const [movedItem] = newDocuments.splice(oldIndex, 1);
        newDocuments.splice(newIndex, 0, movedItem);

        // Update local state immediately for smooth animation
        setDraggedDocuments(newDocuments);

        // Update Firestore in the background
        updateDocumentOrder(newDocuments.map((doc) => doc.id))
          .then((result) => {
            if (result && result.success) {
              toast.success(t('documents.orderUpdateSuccess'));
              // Clear dragged state on success - Firestore will provide the new order
              setDraggedDocuments(null);
            } else if (result) {
              toast.error(result.error.message || t('errors.unknownError'), {
                description: t('documents.orderUpdateError'),
              });
              // Revert to original order on error
              setDraggedDocuments(null);
            }
          })
          .catch((error) => {
            toast.error(error.message || t('errors.unknownError'), {
              description: t('documents.orderUpdateError'),
            });
            // Revert to original order on error
            setDraggedDocuments(null);
          });
      }
    }
  };

  const handleOpenRenameDialog = (id, title) =>
    setRenameDialog({ open: true, id, title });
  const handleOpenDeleteDialog = (id, title) =>
    deleteDocumentDialog.open('delete', { id, title }, false);
  const handleRenameSubmit = async (newTitle) => {
    try {
      await renameDocument(renameDialog.id, newTitle);
      // Success toast is already shown by useFirestoreOperations
    } catch {
      // Error toast is already shown by useFirestoreOperations
    } finally {
      setRenameDialog({ open: false, id: null, title: '' });
    }
  };
  const handleDeleteSubmit = async () => {
    try {
      const result = await deleteDocument(deleteDocumentDialog.dialog.data.id);
      if (result && result.success) {
        // Success toast is already shown by useFirestoreOperations
      } else if (result) {
        // Error is already handled by useFirestoreOperations
      }
    } catch {
      // Error is already handled by useFirestoreOperations
    } finally {
      deleteDocumentDialog.close();
    }
  };

  // Import documents handler
  const { importItems, isImporting } = useDocumentImport('weld', weldId);

  const handleImportSubmit = async (items) => {
    try {
      const results = await importItems(items, { projectId, weldLogId });
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
      if (results.errors?.length > 0) {
        // Show specific error messages
        results.errors.forEach(({ item, error }) => {
          toast.error(`${item.title || item.name}: ${error}`);
        });
      }
    } catch (error) {
      toast.error(error.message || t('documents.importError'));
    }
  };

  // Handler for weld form submission
  const handleWeldSubmit = async (data) => {
    try {
      // Edit existing weld
      await updateWeld(weldId, data, weldLogId);
      setWeldFormDialog({ isOpen: false, weld: null });
      // Success toast is already handled by the hook
    } catch {
      // Error toast is already handled by the hook operations
    }
  };

  // Handler for weld dialog change
  const handleWeldDialogChange = (isOpen) => {
    setWeldFormDialog((prev) => ({ ...prev, isOpen }));
  };

  // Handler for delete confirmation dialog change
  const handleDeleteConfirmDialogChange = (isOpen) => {
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
          error={projectError || weldLogError || weldError}
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
              onEdit={(weld) =>
                setWeldFormDialog({
                  isOpen: true,
                  weld,
                })
              }
            />

            {/* Attachments Section - Collapsible accordion */}
            <WeldDocumentsSection
              documents={documentsToRender}
              documentsLoading={docsLoading}
              documentsError={docsError}
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
          documentName: deleteDocumentDialog.dialog.data?.title || '',
        })}
        actionLabel={t('common.delete')}
        actionVariant="destructive"
      />

      {/* Weld form dialog for editing */}
      <WeldFormDialog
        open={weldFormDialog.isOpen}
        onOpenChange={handleWeldDialogChange}
        weld={weldFormDialog.weld}
        projectId={projectId}
        weldLogId={weldLogId}
        onSubmit={handleWeldSubmit}
      />
    </>
  );
}
