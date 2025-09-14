import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/useUsers';
import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useWeldLog, useWeldLogOperations } from '@/hooks/useWeldLogs';
import { useWelds, useWeldOperations } from '@/hooks/useWelds';
import PageHeader from '@/components/layouts/PageHeader';
import { WeldLogFormDialog } from '../weld-logs/WeldLogFormDialog';
import {
  WeldFormDialog,
  type SingleWeldFormData,
  type MultipleWeldsFormData,
} from './WeldFormDialog';
import { WeldLogDetailsCard } from './WeldLogDetailsCard';
import { WeldLogDocumentsSection } from './WeldLogDocumentsSection';
import { Welds } from './Welds';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import {
  useConfirmationDialog,
  type IdentifiableEntity,
} from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';
import { useDocuments, useDocumentImport } from '@/hooks/documents';
import { toast } from 'sonner';
import type { DragEndEvent } from '@dnd-kit/core';
import type { SelectedItem } from '@/hooks/documents';
import { ImportDialog } from '@/components/documents/import';
import { CardDialog } from '@/components/documents/cards';
import type { WeldLog, Weld, WeldLogFormData, WeldFormData } from '@/types/app';
import type { Document } from '@/types/database';

interface WeldLogFormDialogState {
  isOpen: boolean;
  weldLog: WeldLog | null;
}

interface RenameDialogState {
  open: boolean;
  id: string | null;
  title: string;
}

export default function WeldLogOverview(): React.ReactElement {
  const { t } = useTranslation();

  // Get the project ID and weld log ID from the URL parameters
  const { projectId, weldLogId } = useParams<{
    projectId: string;
    weldLogId: string;
  }>();

  // State for managing dialogs - MUST be before any conditional returns
  const [weldLogFormDialog, setWeldLogFormDialog] =
    useState<WeldLogFormDialogState>({
      isOpen: false,
      weldLog: null,
    });

  // Fetch the project and weld log data
  const [project, projectLoading, projectError] = useProject(projectId);
  const [weldLog, weldLogLoading, weldLogError] = useWeldLog(weldLogId);

  // Fetch the creator's user details
  // Pass undefined if weldLog is not loaded yet - the hook handles this gracefully
  const [creator] = useUser(weldLog?.createdBy || undefined);
  const [welds = [], weldsLoading, weldsError] = useWelds(weldLogId);
  const { updateWeldLog } = useWeldLogOperations();
  const { createWeld, createWeldsRange, updateWeld, deleteWeld } =
    useWeldOperations();

  // Hooks for managing weld dialogs
  const weldFormDialog = useFormDialog<Weld>();
  const weldConfirmDialog = useConfirmationDialog({
    delete: deleteWeld,
  });

  // --- Document logic for Documents section ---
  // Use empty string if IDs are undefined to satisfy type requirements
  // The hooks will handle invalid IDs gracefully
  const documentsHook = useDocuments({
    entityType: 'weldLog',
    entityId: weldLogId || '',
    additionalForeignKeys: { projectId: projectId || '' },
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
        (doc) => doc.id === event.over!.id.toString() // Using ! to tell TypeScript that over is not null here
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
      if (!data || Array.isArray(data)) return;
      const result = await deleteDocument(data.id);
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
  const { importItems, isImporting } = useDocumentImport(
    'weldLog',
    weldLogId || null
  );

  const handleImportSubmit = async (items: SelectedItem[]): Promise<void> => {
    try {
      // Convert SelectedItem[] to match ImportItem interface from useDocumentImport
      const itemsToImport = items.map((item) => ({
        ...item,
        type: item.type as 'section' | 'document',
        // Ensure collectionId is string | undefined (not null)
        collectionId: item.collectionId ?? undefined,
        sectionId: item.sectionId ?? undefined,
      }));
      const results = await importItems(itemsToImport, {
        projectId: projectId || '',
      });
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
          const itemName =
            item &&
            typeof item === 'object' &&
            ('title' in item || 'name' in item)
              ? (item as { title?: string; name?: string }).title ||
                (item as { title?: string; name?: string }).name
              : 'Unknown item';
          toast.error(`${itemName}: ${error}`);
        });
      }
    } catch (error) {
      toast.error((error as Error).message || t('documents.importError'));
    }
  };

  // Get confirmation content for the dialog
  const { type, isBulk, data } = weldConfirmDialog.dialog;
  const count = isBulk && Array.isArray(data) ? data.length : 1;
  const confirmContent = getConfirmationContent(
    type || 'delete', // Provide default value if type is null
    isBulk,
    count,
    t,
    'weldLogs'
  );

  // Handler for weld log form submission
  const handleWeldLogSubmit = async (data: WeldLogFormData): Promise<void> => {
    try {
      // Edit existing weld log
      await updateWeldLog(weldLogId!, data);
      setWeldLogFormDialog({ isOpen: false, weldLog: null });
      // Success toast is already handled by the hook
    } catch {
      // Error toast is already handled by the hook operations
    }
  };

  // Handler for weld form submission
  const handleWeldSubmit = async (
    data: SingleWeldFormData | MultipleWeldsFormData,
    mode?: string
  ): Promise<void> => {
    try {
      if (mode === 'multiple') {
        // Create multiple welds
        const multiData = data as MultipleWeldsFormData;
        // Extract only the WeldFormData properties, handle extras separately
        const baseWeldData: Partial<WeldFormData> = {
          welderId: '', // Will be filled by createWeldsRange
          type: 'production', // Default type - must be WeldType
          status: 'pending', // Default status
          notes: multiData.description,
        };

        // Pass additional data separately
        const positions =
          multiData.positionMode === 'manual' ||
          multiData.positionMode === 'same-as-number'
            ? ({} as Record<string, string>) // Positions will be handled by createWeldsRange based on mode
            : undefined;

        await createWeldsRange(
          projectId!,
          weldLogId!,
          multiData.startNumber,
          multiData.endNumber,
          baseWeldData,
          positions
        );
      } else if (weldFormDialog.entity) {
        // Edit existing weld
        const singleData = data as SingleWeldFormData;
        const weldData: WeldFormData = {
          number: singleData.number,
          welderId: '', // Will be filled by updateWeld
          type: 'production', // Default type - must be WeldType
          status: 'pending', // Default status
          notes: singleData.description,
        };
        await updateWeld(weldFormDialog.entity.id, weldData, weldLogId!);
      } else {
        // Create new single weld
        const singleData = data as SingleWeldFormData;
        const weldData: WeldFormData = {
          number: singleData.number,
          welderId: '', // Will be filled by createWeld
          type: 'production', // Default type - must be WeldType
          status: 'pending', // Default status
          notes: singleData.description,
        };
        await createWeld(projectId!, weldLogId!, weldData);
      }
      weldFormDialog.close();
    } catch {
      // Error toast is already handled by the hook operations
    }
  };

  // Handler for weld log dialog change
  const handleWeldLogDialogChange = (isOpen: boolean): void => {
    setWeldLogFormDialog((prev) => ({ ...prev, isOpen }));
  };

  // Handler for weld dialog change
  const handleWeldDialogChange = (isOpen: boolean): void => {
    if (!isOpen) weldFormDialog.close();
  };

  // Handler for delete confirmation dialog change
  const handleDeleteConfirmDialogChange = (isOpen: boolean): void => {
    if (!isOpen) deleteDocumentDialog.close();
  };

  // Handler for weld confirmation dialog change
  const handleWeldConfirmDialogChange = (isOpen: boolean): void => {
    if (!isOpen) weldConfirmDialog.close();
  };

  // Handle missing params AFTER all hooks have been called
  if (!projectId || !weldLogId) {
    return (
      <div className="space-y-6">
        <ErrorLoadingWrapper
          error={new Error('Invalid URL parameters')}
          loading={false}
          resourceName="page"
        >
          <div />
        </ErrorLoadingWrapper>
      </div>
    );
  }

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
          error={projectError || weldLogError || null}
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
              documents={documentsToRender as Document[]}
              documentsLoading={docsLoading}
              documentsError={docsError || null}
              onImportClick={() => setImportDialogOpen(true)}
              onDragEnd={handleDragEnd}
              onUpload={handleUpload}
              uploadingFiles={uploadingFiles.reduce(
                (acc, file) => ({ ...acc, [file.id]: file }),
                {}
              )}
              onRenameDocument={handleOpenRenameDialog}
              onDeleteDocument={handleOpenDeleteDialog}
            />

            {/* Welds Table */}
            <ErrorLoadingWrapper
              error={weldsError || null}
              loading={weldsLoading}
              resourceName={t('weldLogs.welds').toLowerCase()}
            >
              <Welds
                welds={welds}
                loading={false}
                onEdit={(weld) => weldFormDialog.open(weld)}
                onCreateNew={() => weldFormDialog.open()}
                onConfirmAction={(action, data, isBulk) =>
                  weldConfirmDialog.open(
                    action,
                    data as unknown as
                      | IdentifiableEntity
                      | IdentifiableEntity[],
                    isBulk
                  )
                }
                projectId={projectId!}
                weldLogId={weldLogId!}
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
          documentName:
            (deleteDocumentDialog.dialog.data &&
            !Array.isArray(deleteDocumentDialog.dialog.data)
              ? (deleteDocumentDialog.dialog.data as { title?: string }).title
              : '') || '',
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
