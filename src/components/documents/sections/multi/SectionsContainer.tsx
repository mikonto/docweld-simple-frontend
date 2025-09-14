import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { useSections } from '@/hooks/documents/useSections';
import { useDocumentImport } from '@/hooks/documents';
import { useFormDialog } from '@/hooks/useFormDialog';
import { SectionDialog } from './SectionDialog';
import { ImportDialog } from '@/components/documents/import';
import { SectionsList } from './SectionsList';
import type { Section, Document } from '@/types/database';

interface ImportSource {
  collectionType: 'project' | 'library';
  entityId?: string;
}

interface ImportDialogEntity {
  mode: 'section' | 'document';
  targetSectionId: string | null;
  targetSectionName: string | null;
}

interface ImportItem {
  id: string;
  type: 'section' | 'document';
  targetSectionId?: string;
  title?: string;
  name?: string;
  order?: number;
  [key: string]: unknown;
}

interface ImportResults {
  sections: Array<{ original: ImportItem; imported: string }>;
  documents: Array<{ original: ImportItem; imported: string }>;
  errors: Array<{ item?: ImportItem; error: string }>;
}

interface SectionsContainerProps {
  collectionType: 'project' | 'library';
  entityId?: string; // Required for project, not needed for library
  showImportMenu?: boolean;
  importSource?: ImportSource;
}

export function SectionsContainer({
  collectionType,
  entityId,
  showImportMenu = false,
  importSource,
}: SectionsContainerProps) {
  const { t } = useTranslation();

  const sectionsHook = useSections({
    entityType: collectionType,
    entityId: collectionType === 'project' ? entityId! : entityId || 'main',
  });

  const documentsHook = useDocuments({
    entityType: collectionType,
    entityId: collectionType === 'project' ? entityId! : entityId || 'main',
  });

  const { sections, sectionsLoading, sectionsError, moveSection, addSection } =
    sectionsHook;
  const {
    documents: allDocuments,
    documentsLoading,
    documentsError,
  } = documentsHook;

  const isLoading = sectionsLoading || documentsLoading;
  const error = sectionsError || documentsError;

  const { importItems, isImporting } = useDocumentImport(
    collectionType,
    entityId || null
  );

  // Dialog state management using unified pattern
  const addSectionDialog = useFormDialog<null>();
  const importDialog = useFormDialog<ImportDialogEntity>();

  // Event Handlers
  const handleMoveSection = async (
    sectionId: string,
    direction: 'up' | 'down'
  ) => {
    try {
      await moveSection(sectionId, direction, sections as Section[]);
      toast.success(t('sections.orderUpdateSuccess'));
    } catch {
      toast.error(t('sections.orderUpdateError'));
    }
  };

  const handleAddSection = () => {
    addSectionDialog.open();
  };

  const handleOpenImportSections = () => {
    importDialog.open({
      mode: 'section',
      targetSectionId: null,
      targetSectionName: null,
    });
  };

  const handleOpenImportDocuments = (
    sectionId: string,
    sectionName: string
  ) => {
    importDialog.open({
      mode: 'document',
      targetSectionId: sectionId,
      targetSectionName: sectionName,
    });
  };

  const handleImportSubmit = async (imports: ImportItem[]) => {
    if (!imports || imports.length === 0) {
      toast.error(t('documents.noItemsSelectedForImport'));
      return;
    }

    try {
      // Prepare items for import
      const itemsToImport = imports.map((item) => ({
        ...item,
        // For documents, add the target section ID if we're importing to a specific section
        ...(item.type === 'document' && importDialog.entity?.targetSectionId
          ? { targetSectionId: importDialog.entity.targetSectionId }
          : {}),
      }));

      // Start the import process with progress tracking
      const results = (await importItems(itemsToImport)) as ImportResults;

      // Silently handle errors - they are already shown in toasts

      // Calculate totals from the results
      const successfulSections = results.sections.length;
      const successfulDocuments = results.documents.length;
      const totalSuccess = successfulSections + successfulDocuments;
      const totalFailed = results.errors.length;

      // Display appropriate success message
      if (totalSuccess === 0) {
        toast.error(t('documents.noItemsImported'));
      } else if (totalFailed === 0) {
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
      } else {
        // Some failures occurred
        toast.warning(
          t('documents.importPartialSuccess', {
            success: totalSuccess,
            failed: totalFailed,
          }),
          { description: t('documents.checkConsoleForDetails') }
        );
      }

      importDialog.close();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('errors.unknownError');
      toast.error(
        t('documents.importFailed', {
          error: errorMessage,
        })
      );
    }
  };

  return (
    <div className="w-full">
      {/* Use the presentational component for the view */}
      <SectionsList
        sections={sections as Section[]}
        allDocuments={allDocuments as Document[]}
        isLoading={isLoading}
        error={error}
        onMoveSection={handleMoveSection}
        onAddSection={handleAddSection}
        onImportSections={handleOpenImportSections}
        onImportDocuments={handleOpenImportDocuments}
        collectionType={collectionType}
        entityId={entityId}
        showImportMenu={showImportMenu}
      />

      <SectionDialog
        mode="add"
        open={addSectionDialog.isOpen}
        onClose={addSectionDialog.close}
        onSubmit={async (sectionName: string) => {
          try {
            const result = await addSection(sectionName);
            if (result) {
              // Success toast is handled by useFirestoreOperations
              addSectionDialog.close();
            }
          } catch (error: unknown) {
            // Error toast is handled by useFirestoreOperations
            // Only show custom error messages for specific error codes
            const isErrorWithCode = (err: unknown): err is { code: string } => {
              return err !== null && typeof err === 'object' && 'code' in err;
            };

            if (isErrorWithCode(error)) {
              if (error.code === 'permission-denied') {
                toast.error(t('documents.noPermissionToAddSections'));
              } else if (error.code === 'not-found') {
                toast.error(t('documents.parentDocumentNotFound'));
              }
            }
            // Generic errors are already handled by useFirestoreOperations
          }
        }}
      />

      {showImportMenu && importSource && (
        <ImportDialog
          open={importDialog.isOpen}
          onClose={importDialog.close}
          onSubmit={handleImportSubmit}
          mode={importDialog.entity?.mode || 'section'}
          isImporting={isImporting}
          projectId={collectionType === 'project' ? entityId || null : null}
          hideProjectDocuments={collectionType === 'project'}
        />
      )}
    </div>
  );
}
