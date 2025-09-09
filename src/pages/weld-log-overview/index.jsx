import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/useUsers';
import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useWeldLog, useWeldLogOperations } from '@/hooks/useWeldLogs';
import { useWelds, useWeldOperations } from '@/hooks/useWelds';
import PageHeader from '@/components/layouts/PageHeader';
import { WeldLogFormDialog } from '../weld-logs/WeldLogFormDialog';
import { WeldFormDialog } from './WeldFormDialog';
import { WeldLogDetailsCard } from './WeldLogDetailsCard';
import { WeldLogDocumentsSection } from './WeldLogDocumentsSection';
import { Welds } from './Welds';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';
import { useDocuments, useDocumentImport } from '@/hooks/documents';
import { toast } from 'sonner';
import { ImportDialog } from '@/components/documents/import';
import { CardDialog } from '@/components/documents/cards';

export default function WeldLogOverview() {
  const { t } = useTranslation();

  // Get the project ID and weld log ID from the URL parameters
  const { projectId, weldLogId } = useParams();

  // State for managing dialogs
  const [weldLogFormDialog, setWeldLogFormDialog] = useState({
    isOpen: false,
    weldLog: null,
  });

  // Fetch the project and weld log data
  const [project, projectLoading, projectError] = useProject(projectId);
  const [weldLog, weldLogLoading, weldLogError] = useWeldLog(weldLogId);

  // Fetch the creator's user details
  const [creator] = useUser(weldLog?.createdBy);
  const [welds = [], weldsLoading, weldsError] = useWelds(weldLogId);
  const { updateWeldLog } = useWeldLogOperations();
  const { createWeld, createWeldsRange, updateWeld, deleteWeld } =
    useWeldOperations();

  // Hooks for managing weld dialogs
  const weldFormDialog = useFormDialog();
  const weldConfirmDialog = useConfirmationDialog({
    delete: deleteWeld,
  });

  // --- Document logic for Documents section ---
  const documentsHook = useDocuments({
    entityType: 'weldLog',
    entityId: weldLogId,
    additionalForeignKeys: { projectId },
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
  const { importItems, isImporting } = useDocumentImport('weldLog', weldLogId);

  const handleImportSubmit = async (items) => {
    try {
      const results = await importItems(items, { projectId });
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

  // Get confirmation content for the dialog
  const { type, isBulk, data } = weldConfirmDialog.dialog;
  const count = isBulk ? data?.length : 1;
  const confirmContent = getConfirmationContent(
    type,
    isBulk,
    count,
    t,
    'weldLogs'
  );

  // Handler for weld log form submission
  const handleWeldLogSubmit = async (data) => {
    try {
      // Edit existing weld log
      await updateWeldLog(weldLogId, data);
      setWeldLogFormDialog({ isOpen: false });
      // Success toast is already handled by the hook
    } catch {
      // Error toast is already handled by the hook operations
    }
  };

  // Handler for weld form submission
  const handleWeldSubmit = async (data, mode) => {
    try {
      if (mode === 'multiple') {
        // Create multiple welds
        await createWeldsRange(
          projectId,
          weldLogId,
          data.startNumber,
          data.endNumber,
          {
            position: data.position,
            parentMaterials: data.parentMaterials,
            fillerMaterials: data.fillerMaterials,
            description: data.description,
            heatTreatment: data.heatTreatment,
          },
          data.positions // Pass positions object
        );
      } else if (weldFormDialog.entity) {
        // Edit existing weld
        await updateWeld(weldFormDialog.entity.id, data, weldLogId);
      } else {
        // Create new single weld
        await createWeld(projectId, weldLogId, data);
      }
      weldFormDialog.close();
    } catch {
      // Error toast is already handled by the hook operations
    }
  };

  // Handler for weld log dialog change
  const handleWeldLogDialogChange = (isOpen) => {
    setWeldLogFormDialog((prev) => ({ ...prev, isOpen }));
  };

  // Handler for weld dialog change
  const handleWeldDialogChange = (isOpen) => {
    if (!isOpen) weldFormDialog.close();
  };

  // Handler for delete confirmation dialog change
  const handleDeleteConfirmDialogChange = (isOpen) => {
    if (!isOpen) deleteDocumentDialog.close();
  };

  // Handler for weld confirmation dialog change
  const handleWeldConfirmDialogChange = (isOpen) => {
    if (!isOpen) weldConfirmDialog.close();
  };

  return (
    <>
      {/* Main content with padding */}
      <div className="space-y-6">
        {!projectLoading &&
          !projectError &&
          !weldLogLoading &&
          !weldLogError &&
          project &&
          weldLog && (
            <PageHeader
              title={t('weldLogs.weldLogOverview')}
              breadcrumbData={{
                projectName: project.projectName,
                weldLogName: weldLog.name,
              }}
            />
          )}

        <ErrorLoadingWrapper
          error={projectError || weldLogError}
          loading={projectLoading || weldLogLoading}
          resourceName={
            projectError
              ? t('navigation.projects').toLowerCase()
              : t('navigation.weldLogs').toLowerCase()
          }
        >
          <div className="space-y-4">
            {/* Weld Log Details Card */}
            <WeldLogDetailsCard
              weldLog={weldLog}
              creator={creator}
              onEdit={(weldLog) =>
                setWeldLogFormDialog({
                  isOpen: true,
                  weldLog,
                })
              }
            />

            {/* Attachments Section - Collapsible accordion */}
            <WeldLogDocumentsSection
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

            {/* Welds Table */}
            <ErrorLoadingWrapper
              error={weldsError}
              loading={weldsLoading}
              resourceName={t('weldLogs.welds').toLowerCase()}
            >
              <Welds
                welds={welds}
                loading={false}
                onEdit={(weld) => weldFormDialog.open(weld)}
                onCreateNew={() => weldFormDialog.open()}
                onConfirmAction={weldConfirmDialog.open}
                projectId={projectId}
                weldLogId={weldLogId}
              />
            </ErrorLoadingWrapper>
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

      {/* Weld log form dialog for editing */}
      <WeldLogFormDialog
        open={weldLogFormDialog.isOpen}
        onOpenChange={handleWeldLogDialogChange}
        weldLog={weldLogFormDialog.weldLog}
        onSubmit={handleWeldLogSubmit}
      />

      {/* Weld form dialog for adding/editing welds */}
      <WeldFormDialog
        open={weldFormDialog.isOpen}
        onOpenChange={handleWeldDialogChange}
        weld={weldFormDialog.entity}
        projectId={projectId}
        weldLogId={weldLogId}
        onSubmit={handleWeldSubmit}
      />

      {/* Confirmation Dialog for delete actions */}
      <ConfirmationDialog
        isOpen={weldConfirmDialog.dialog.isOpen}
        onOpenChange={handleWeldConfirmDialogChange}
        onConfirm={weldConfirmDialog.handleConfirm}
        title={confirmContent.title}
        description={confirmContent.description}
        actionLabel={confirmContent.actionLabel}
        actionVariant={confirmContent.actionVariant}
      />
    </>
  );
}
