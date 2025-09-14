import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layouts/PageHeader';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';

import {
  useDocumentCollections,
  useDocumentCollectionOperations,
} from '@/hooks/useDocumentLibrary';
import { DocumentFormDialog } from './DocumentFormDialog';
import { DocumentLibraryTable } from './DocumentLibraryTable';
import type { DocumentLibrary, DocumentLibraryFormData } from '@/types';
import type { IdentifiableEntity } from '@/hooks/useConfirmationDialog';

export default function DocumentLibraryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch active documents (soft delete filtering is handled by the hook)
  const [documents, loading, error] = useDocumentCollections();
  const {
    createDocumentCollection,
    updateDocumentCollection,
    deleteDocumentCollection,
  } = useDocumentCollectionOperations();

  // Hooks for managing dialogs
  const formDialog = useFormDialog<DocumentLibrary>();
  const confirmDialog = useConfirmationDialog({
    delete: async (id: string) => {
      await deleteDocumentCollection(id);
    },
  });

  // Navigate to collection details when a row is clicked
  const handleRowClick = (rowData: DocumentLibrary) => {
    navigate(`/document-library/collection/${rowData.id}`);
  };

  // Get confirmation content for the dialog
  const { type, isBulk, data } = confirmDialog.dialog;
  const count = isBulk && Array.isArray(data) ? data.length : 1;
  const confirmationContent = getConfirmationContent(
    type || 'delete',
    isBulk,
    count,
    t,
    'documentLibrary'
  );

  // Handler for document form submission
  const handleDocumentSubmit = async (data: DocumentLibraryFormData) => {
    try {
      if (formDialog.entity) {
        // Edit existing document collection
        await updateDocumentCollection(formDialog.entity.id, data);
      } else {
        // Create new document collection
        await createDocumentCollection(data);
      }
      formDialog.close();
    } catch {
      // Error toast is already handled by the hook operations
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('documentLibrary.title')}
        // subtitle="Manage and access document collections."
      />

      <ErrorLoadingWrapper
        error={error || null}
        loading={loading}
        resourceName={t('navigation.documentLibrary').toLowerCase()}
      >
        <DocumentLibraryTable
          documents={documents}
          loading={loading}
          onEdit={(document) => formDialog.open(document)}
          onCreateNew={() => formDialog.open()}
          onConfirmAction={(type, data, isBulk) =>
            confirmDialog.open(
              type,
              data as unknown as IdentifiableEntity | IdentifiableEntity[],
              isBulk
            )
          }
          onRowClick={handleRowClick}
        />
      </ErrorLoadingWrapper>

      {/* Document form dialog for create/edit */}
      <DocumentFormDialog
        open={formDialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) formDialog.close();
        }}
        document={formDialog.entity}
        onSubmit={handleDocumentSubmit}
      />

      {/* Unified Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.dialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) confirmDialog.close();
        }}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmationContent.title}
        description={confirmationContent.description}
        actionLabel={confirmationContent.actionLabel}
        actionVariant={confirmationContent.actionVariant}
      />
    </div>
  );
}
