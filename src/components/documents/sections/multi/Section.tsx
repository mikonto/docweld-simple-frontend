import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { DragEndEvent } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useDocuments } from '@/hooks/documents/useDocuments';
import { useSections } from '@/hooks/documents/useSections';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { CardDialog } from '@/components/documents/cards';
import { SectionDialog } from './SectionDialog';
import { SectionHeader } from '../shared/SectionHeader';
import { SectionContent } from './SectionContent';
import {
  UPLOAD_CONFIG,
  SECTION_SIZE_CONFIG,
} from '@/types/documents';
import * as operations from './sectionOperations';
import type {
  Section as SectionType,
  Document,
  UploadingFile,
} from '@/types/api/firestore';

interface SectionProps {
  sectionData: SectionType;
  allDocuments: Document[];
  index: number;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  totalSections: number;
  collectionType: 'project' | 'library';
  entityId?: string;
  showImportMenu?: boolean;
  onImportDocuments?: (sectionId: string, sectionName: string) => void;
}

export function Section({
  sectionData,
  allDocuments,
  index,
  onMoveSection,
  totalSections,
  collectionType,
  entityId,
  showImportMenu = false,
  onImportDocuments,
}: SectionProps) {
  const { t } = useTranslation();

  // DnD setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionData.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedDocuments, setDraggedDocuments] = useState<Document[] | null>(
    null
  );

  const deleteDocumentDialog = useConfirmationDialog({});
  const deleteSectionDialog = useConfirmationDialog({});
  const renameDocumentDialog = useFormDialog();
  const renameSectionDialog = useFormDialog();

  // Toggle expand callback
  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const sectionsHook = useSections({
    entityType: collectionType,
    entityId: collectionType === 'project' ? entityId! : entityId || 'main',
  });

  const documentsHook = useDocuments({
    entityType: collectionType,
    entityId: collectionType === 'project' ? entityId! : entityId || 'main',
    sectionId: sectionData.id,
  });

  // Extract operations from hooks
  const { renameSection, deleteSection } = sectionsHook;
  const {
    uploadingFiles,
    renameDocument,
    deleteDocument,
    handleUpload,
    updateDocumentOrder,
  } = documentsHook;

  // Process documents for this section
  const localDocuments = React.useMemo(() => {
    // If we have dragged state, use that instead
    if (draggedDocuments !== null) {
      return draggedDocuments;
    }

    // Data comes via props now, ensure they are valid arrays
    if (!sectionData || !Array.isArray(allDocuments)) {
      return []; // Return empty if props are not ready/valid
    }

    // Filter documents by sectionId (flat structure)
    const sectionDocuments = allDocuments.filter(
      (doc) => doc.sectionId === sectionData.id
    );

    // Sort by order field descending (highest order first, matching Firestore query)
    return sectionDocuments.sort((a, b) => (b.order || 0) - (a.order || 0));
  }, [sectionData, allDocuments, draggedDocuments]); // Include draggedDocuments in deps

  // Reset dragged state when props change
  React.useEffect(() => {
    setDraggedDocuments(null);
  }, [sectionData, allDocuments]);

  // Track previous document processing states to detect transitions
  const prevDocumentStates = useRef<Record<string, string>>({});

  // Monitor document processing state changes
  useEffect(() => {
    // Check for documents that just completed processing
    localDocuments.forEach((doc) => {
      const prevState = prevDocumentStates.current[doc.id];
      const currentState = doc.processingState;

      // Document just finished processing successfully
      if (prevState === 'pending' && currentState === 'completed') {
        // Toast is already shown by useFirestoreOperations when upload completes
        // No need for duplicate toast here
      }

      // Update tracked state for next comparison
      if (currentState) {
        prevDocumentStates.current[doc.id] = currentState;
      }
    });

    // Clean up deleted documents from tracking
    const currentIds = new Set(localDocuments.map((d) => d.id));
    Object.keys(prevDocumentStates.current).forEach((id) => {
      if (!currentIds.has(id)) {
        delete prevDocumentStates.current[id];
      }
    });
  }, [localDocuments, t]);

  // Event handlers are now imported from operations file

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="w-full border-b"
      >
        {/* Section Header */}
        <SectionHeader
          sectionData={sectionData}
          index={index}
          totalSections={totalSections}
          isExpanded={isExpanded}
          toggleExpand={toggleExpand}
          dragHandleProps={{ ...attributes, ...listeners }}
          isDragging={isDragging}
          onMoveSection={onMoveSection}
          onRenameSection={() => renameSectionDialog.open(sectionData)}
          onDeleteSection={() =>
            deleteSectionDialog.open(
              'delete',
              { id: sectionData.id, title: sectionData.name },
              false
            )
          }
          showImportMenu={showImportMenu}
          onImportDocuments={onImportDocuments}
          documentsCount={localDocuments.length}
        />

        {/* Section Content with Expand/Collapse Animation */}
        <div
          className={`overflow-hidden transition-all ease-in-out ${
            isExpanded ? 'max-h-[5000px]' : 'max-h-0'
          }`}
          style={{
            transitionDuration: `${SECTION_SIZE_CONFIG.MULTI.ANIMATION_DURATION}ms`,
          }}
        >
          <SectionContent
            documents={localDocuments}
            uploadingFiles={uploadingFiles.reduce(
              (acc, file) => {
                acc[file.id] = file;
                return acc;
              },
              {} as Record<string, UploadingFile>
            )}
            onDragEnd={(event: DragEndEvent) =>
              operations.handleDragEnd(
                event,
                localDocuments,
                setDraggedDocuments,
                updateDocumentOrder as (
                  ids: string[]
                ) => Promise<operations.DeleteResult | undefined>,
                t
              )
            }
            onUpload={(files: File[]) =>
              operations.handleUploadFiles(files, handleUpload, t)
            }
            onRename={(docId: string, currentTitle: string) =>
              operations.handleRename(renameDocumentDialog, docId, currentTitle)
            }
            onDelete={(docId: string, title: string) =>
              operations.handleDelete(
                deleteDocumentDialog as unknown as operations.DeleteDialog,
                docId,
                title
              )
            }
            maxFilesAllowed={UPLOAD_CONFIG.MAX_FILES}
          />
        </div>
      </div>

      {/* Dialogs - Using unified pattern like other features */}

      {/* Document Rename Dialog */}
      <CardDialog
        document={renameDocumentDialog.entity as Document | null | undefined}
        open={renameDocumentDialog.isOpen}
        onClose={renameDocumentDialog.close}
        onSubmit={async (newTitle: string) => {
          try {
            await renameDocument(
              (renameDocumentDialog.entity as Document).id,
              newTitle
            );
            // Success toast is already shown by useFirestoreOperations
          } catch (error: unknown) {
            // Show specific error messages only for known error codes
            const isErrorWithCode = (err: unknown): err is { code: string } => {
              return err !== null && typeof err === 'object' && 'code' in err;
            };

            if (isErrorWithCode(error)) {
              if (error.code === 'permission-denied') {
                toast.error(t('documents.renamePermissionError'));
              } else if (error.code === 'not-found') {
                toast.error(t('documents.renameNotFoundError'));
              }
            }
            // Generic errors are already handled by useFirestoreOperations
          } finally {
            renameDocumentDialog.close();
          }
        }}
      />

      {/* Section Rename Dialog */}
      <SectionDialog
        mode="edit"
        section={renameSectionDialog.entity as SectionType | null | undefined}
        open={renameSectionDialog.isOpen}
        onClose={renameSectionDialog.close}
        onSubmit={async (newName: string) => {
          try {
            await renameSection(
              (renameSectionDialog.entity as SectionType).id,
              newName
            );
            // Success toast is already shown by useFirestoreOperations
          } catch (error: unknown) {
            // Show specific error messages only for known error codes
            const isErrorWithCode = (err: unknown): err is { code: string } => {
              return err !== null && typeof err === 'object' && 'code' in err;
            };

            if (isErrorWithCode(error)) {
              if (error.code === 'permission-denied') {
                toast.error(t('sections.renamePermissionError'));
              } else if (error.code === 'not-found') {
                toast.error(t('sections.renameNotFoundError'));
              }
            }
            // Generic errors are already handled by useFirestoreOperations
          } finally {
            renameSectionDialog.close();
          }
        }}
      />

      {/* Delete Document Confirmation Dialog - Direct use like other features */}
      <ConfirmationDialog
        isOpen={deleteDocumentDialog.dialog.isOpen}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) deleteDocumentDialog.close();
        }}
        onConfirm={() =>
          operations.handleConfirmDocumentDelete(
            deleteDocument as (id: string) => Promise<operations.DeleteResult>,
            deleteDocumentDialog as unknown as operations.Dialog<operations.DialogData> & {
              dialog: { data: operations.DialogData };
            }
          )
        }
        title={t('documents.deleteDocument')}
        description={t('documents.confirmDeleteDocument', {
          documentName:
            (deleteDocumentDialog.dialog.data as operations.DialogData | null)
              ?.title || '',
        })}
        actionLabel={t('common.delete')}
        actionVariant="destructive"
      />

      {/* Delete Section Confirmation Dialog - Direct use like other features */}
      <ConfirmationDialog
        isOpen={deleteSectionDialog.dialog.isOpen}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) deleteSectionDialog.close();
        }}
        onConfirm={() =>
          operations.handleConfirmSectionDelete(
            deleteSection as (id: string) => Promise<operations.DeleteResult>,
            deleteSectionDialog as unknown as operations.Dialog<unknown>,
            sectionData.id,
            t
          )
        }
        title={t('documents.deleteSection')}
        description={t('documents.deleteSectionWarning', {
          name: sectionData.name,
        })}
        actionLabel={t('common.delete')}
        actionVariant="destructive"
      />
    </>
  );
}
