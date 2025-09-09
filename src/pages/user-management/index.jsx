import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layouts/PageHeader';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';
import { useUsers, useUserOperations } from '@/hooks/useUsers';
import { UserFormDialog } from './UserFormDialog';
import { UsersTable } from './UsersTable';

export default function UserManagement() {
  const { t } = useTranslation();

  // State for active tab (active or inactive users)
  const [activeTab, setActiveTab] = useState('active');

  // Fetch users based on active tab
  const [users = [], loading, error] = useUsers(activeTab);

  // Get CRUD operations for users
  const {
    createUser,
    updateUser,
    promoteToAdmin,
    demoteToUser,
    activateUser,
    deactivateUser,
  } = useUserOperations();

  // Hooks for managing dialogs
  const formDialog = useFormDialog();
  const confirmDialog = useConfirmationDialog({
    promote: promoteToAdmin,
    demote: demoteToUser,
    activate: activateUser,
    deactivate: deactivateUser,
  });

  // Get confirmation content for the dialog
  const { type, isBulk, data } = confirmDialog.dialog;
  const count = isBulk ? data?.length : 1;
  const confirmContent = getConfirmationContent(
    type,
    isBulk,
    count,
    t,
    'users'
  );

  // Handler for user form submission
  const handleUserSubmit = async (data) => {
    try {
      // Check if we have an existing user to update
      const existingUser = formDialog.entity;

      if (existingUser) {
        await updateUser(existingUser.id, data);
      } else {
        await createUser(data);
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
      <PageHeader title={t('navigation.userManagement')} />

      <ErrorLoadingWrapper
        error={error}
        loading={loading}
        resourceName={t('navigation.userManagement').toLowerCase()}
      >
        <UsersTable
          users={users}
          loading={loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onEdit={formDialog.open}
          onCreateNew={() => formDialog.open()}
          onConfirmAction={confirmDialog.open}
        />
      </ErrorLoadingWrapper>

      {/* User form dialog for create/edit */}
      <UserFormDialog
        open={formDialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) formDialog.close();
        }}
        user={formDialog.entity}
        onSubmit={handleUserSubmit}
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
