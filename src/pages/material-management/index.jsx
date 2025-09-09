import React, { useState } from 'react';
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

export default function MaterialManagement() {
  const { t } = useTranslation();

  // State for active tab (parent, filler, or alloys)
  const [activeTab, setActiveTab] = useState('parent');

  // Fetch materials based on active tab
  const [materials = [], loading, error] = useMaterials(activeTab);

  // Get CRUD operations for materials
  const { createMaterial, updateMaterial, deleteMaterial } =
    useMaterialOperations();

  // Hooks for managing dialogs
  const formDialog = useFormDialog();
  const confirmDialog = useConfirmationDialog({
    delete: (id) => deleteMaterial(activeTab, id),
  });

  // Get confirmation content for the dialog
  const { type, isBulk, data } = confirmDialog.dialog;
  const count = isBulk ? data?.length : 1;
  const confirmContent = getConfirmationContent(
    type,
    isBulk,
    count,
    t,
    'materials'
  );

  // Handler for material form submission
  const handleMaterialSubmit = async (data) => {
    try {
      // Check if we have an existing material to update
      const existingMaterial = formDialog.entity;

      // Transform data based on material type (parent has additional fields)
      const transformedData =
        activeTab === 'parent' ? data : { name: data.name };

      if (existingMaterial) {
        await updateMaterial(activeTab, existingMaterial.id, transformedData);
      } else {
        await createMaterial(activeTab, transformedData);
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
        error={error}
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
          onConfirmAction={confirmDialog.open}
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
