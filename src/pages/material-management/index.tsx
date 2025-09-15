import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layouts/PageHeader';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';
import { useMaterials, useMaterialOperations } from '@/hooks/useMaterials';
import { MaterialFormDialog } from './MaterialFormDialog';
import { MaterialsTable } from './MaterialsTable';
import type { Material, MaterialFormData } from '@/types';
import type { IdentifiableEntity } from '@/hooks/useConfirmationDialog';

export default function MaterialManagement() {
  const { t } = useTranslation();

  // State for active tab (parent, filler, or alloys)
  const [activeTab, setActiveTab] = useState<'parent' | 'filler' | 'alloy'>(
    'parent'
  );

  // Fetch materials based on active tab
  const [materials = [], loading, error] = useMaterials(activeTab);

  // Get CRUD operations for materials
  const { createMaterial, updateMaterial, deleteMaterial } =
    useMaterialOperations();

  // Hooks for managing dialogs
  const formDialog = useFormDialog<Material>();
  const confirmDialog = useConfirmationDialog({
    delete: (id: string) => deleteMaterial(activeTab, id),
  });

  // Get confirmation content for the dialog
  const { type, isBulk, data } = confirmDialog.dialog;
  const count = isBulk && Array.isArray(data) ? data.length : 1;
  const confirmContent = type
    ? getConfirmationContent(type, isBulk, count, t, 'materials')
    : { title: '', description: '', actionLabel: '', actionVariant: 'default' as const };

  // Handler for material form submission
  const handleMaterialSubmit = async (data: Partial<Material>) => {
    try {
      // Check if we have an existing material to update
      const existingMaterial = formDialog.entity;

      if (existingMaterial && existingMaterial.id) {
        // For updates, use Partial<Material>
        await updateMaterial(activeTab, existingMaterial.id, data);
      } else {
        // For creation, pass the data as MaterialFormData (they now have the same structure)
        await createMaterial(activeTab, data as MaterialFormData);
      }

      // Close the dialog on success
      formDialog.close();
    } catch {
      // Errors are handled by the operation hooks (toast notifications)
      // We don't need to do anything here
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('navigation.materialManagement')} />

      <ErrorLoadingWrapper
        error={error || null}
        loading={loading}
        resourceName={t('navigation.materials').toLowerCase()}
      >
        <MaterialsTable
          materials={materials}
          loading={loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onEdit={formDialog.open}
          onCreateNew={() => formDialog.open()}
          onConfirmAction={(action, data, isBulk) =>
            confirmDialog.open(
              action,
              data as unknown as IdentifiableEntity | IdentifiableEntity[],
              isBulk
            )
          }
        />
      </ErrorLoadingWrapper>

      {/* Material form dialog for create/edit */}
      <MaterialFormDialog
        open={formDialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) formDialog.close();
        }}
        material={formDialog.entity}
        materialType={activeTab}
        onSubmit={handleMaterialSubmit}
      />

      {/* Unified Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.dialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) confirmDialog.close();
        }}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmContent.title}
        description={confirmContent.description}
        actionLabel={confirmContent.actionLabel}
        actionVariant={confirmContent.actionVariant}
      />
    </div>
  );
}
