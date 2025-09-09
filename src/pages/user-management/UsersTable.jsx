import React from 'react';
import { Plus, UserCog, UserMinus, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createColumns } from '@/components/data-table/ColumnDef';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { Card, CardContent } from '@/components/ui/card';

// Main users table component with tabs for active/inactive users
export function UsersTable({
  users,
  loading,
  activeTab,
  onTabChange,
  onEdit,
  onCreateNew,
  onConfirmAction,
}) {
  const { t } = useTranslation();
  // Define user columns
  const userColumns = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('common.name')} />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('users.email')} />
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('users.role')} />
      ),
      cell: ({ row }) => {
        const role = row.getValue('role');
        return (
          <div className="capitalize">
            {role === 'admin' ? t('users.admin') : t('users.user')}
          </div>
        );
      },
    },
  ];

  // Define tabs for the user table
  const tabs = [
    { value: 'active', label: t('users.active') },
    { value: 'inactive', label: t('users.inactive') },
  ];

  // Get row action menu items
  const getActionMenuItems = () => [
    {
      label: t('common.edit'),
      action: (rowData) => onEdit(rowData),
    },
    {
      label: t('users.promoteOrDemote'),
      action: (rowData) => {
        onConfirmAction(
          rowData.role === 'admin' ? 'demote' : 'promote',
          rowData,
          false
        );
      },
    },
    {
      separator: true,
      label:
        activeTab === 'active'
          ? t('users.deactivateUser')
          : t('users.activateUser'),
      action: (rowData) => {
        onConfirmAction(
          activeTab === 'active' ? 'deactivate' : 'activate',
          rowData,
          false
        );
      },
    },
  ];

  // Create action buttons
  const actionButtons = [
    {
      label: t('users.addUser'),
      icon: <Plus className="h-4 w-4" />,
      onClick: onCreateNew,
      variant: 'default',
    },
  ];

  // Creates the bulk action buttons that appear when rows are selected
  const bulkActionButtons = [
    {
      label: t('users.promoteSelectedToAdmin'),
      icon: <UserCog className="h-4 w-4" />,
      onClick: (selectedRows) => {
        const usersToPromote = selectedRows.filter(
          (row) => row.role === 'user'
        );
        if (usersToPromote.length > 0) {
          onConfirmAction('promote', usersToPromote, true);
        }
      },
      variant: 'outline',
    },
    {
      label: t('users.demoteSelectedToUser'),
      icon: <UserMinus className="h-4 w-4" />,
      onClick: (selectedRows) => {
        const usersToDemote = selectedRows.filter(
          (row) => row.role === 'admin'
        );
        if (usersToDemote.length > 0) {
          onConfirmAction('demote', usersToDemote, true);
        }
      },
      variant: 'outline',
    },
    {
      label:
        activeTab === 'active'
          ? t('users.deactivateSelected')
          : t('users.activateSelected'),
      icon:
        activeTab === 'active' ? (
          <UserMinus className="h-4 w-4" />
        ) : (
          <UserCheck className="h-4 w-4" />
        ),
      onClick: (selectedRows) => {
        if (selectedRows.length > 0) {
          onConfirmAction(
            activeTab === 'active' ? 'deactivate' : 'activate',
            selectedRows,
            true
          );
        }
      },
      variant: 'outline',
    },
  ];

  // Create columns for the table
  const columns = createColumns({
    enableSelection: true,
    enableRowActions: true,
    rowMenuItems: getActionMenuItems(), // Call the function to get the array of items
    columns: userColumns,
  });

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={columns}
          data={users}
          tabs={tabs}
          activeTab={activeTab}
          loading={loading}
          onTabChange={onTabChange}
          actionButtons={actionButtons}
          bulkActionButtons={bulkActionButtons}
          tableKey="users"
        />
      </CardContent>
    </Card>
  );
}
