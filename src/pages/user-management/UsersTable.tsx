import React from 'react';
import { Plus, UserCog, UserMinus, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createColumns, DataTable, DataTableColumnHeader } from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import type { User } from '@/types';

interface UsersTableProps {
  users: User[];
  loading?: boolean;
  activeTab: 'active' | 'inactive';
  onTabChange: (tab: 'active' | 'inactive') => void;
  onEdit: (user: User) => void;
  onCreateNew: () => void;
  onConfirmAction: (action: string, data: User | User[], isBulk: boolean) => void;
}

// Main users table component with tabs for active/inactive users
export function UsersTable({
  users,
  loading,
  activeTab,
  onTabChange,
  onEdit,
  onCreateNew,
  onConfirmAction,
}: UsersTableProps) {
  const { t } = useTranslation();
  
  // Map User to display format
  const displayUsers = users.map(user => ({
    ...user,
    name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
  }));
  
  // Define user columns
  const userColumns = [
    {
      accessorKey: 'name',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title={t('common.name')} />
      ),
      cell: ({ row }: any) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title={t('users.email')} />
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title={t('users.role')} />
      ),
      cell: ({ row }: any) => {
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
      action: (rowData: any) => onEdit(rowData),
    },
    {
      label: t('users.promoteOrDemote'),
      action: (rowData: any) => {
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
      action: (rowData: any) => {
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
      variant: 'default' as const,
    },
  ];

  // Creates the bulk action buttons that appear when rows are selected
  const bulkActionButtons = [
    {
      label: t('users.promoteSelectedToAdmin'),
      icon: <UserCog className="h-4 w-4" />,
      onClick: (selectedRows: any[]) => {
        const usersToPromote = selectedRows.filter(
          (row) => row.role === 'user'
        );
        if (usersToPromote.length > 0) {
          onConfirmAction('promote', usersToPromote, true);
        }
      },
      variant: 'outline' as const,
    },
    {
      label: t('users.demoteSelectedToUser'),
      icon: <UserMinus className="h-4 w-4" />,
      onClick: (selectedRows: any[]) => {
        const usersToDemote = selectedRows.filter(
          (row) => row.role === 'admin'
        );
        if (usersToDemote.length > 0) {
          onConfirmAction('demote', usersToDemote, true);
        }
      },
      variant: 'outline' as const,
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
      onClick: (selectedRows: any[]) => {
        if (selectedRows.length > 0) {
          onConfirmAction(
            activeTab === 'active' ? 'deactivate' : 'activate',
            selectedRows,
            true
          );
        }
      },
      variant: 'outline' as const,
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
          data={displayUsers}
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