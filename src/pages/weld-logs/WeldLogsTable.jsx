import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash } from 'lucide-react';
import { createColumns } from '@/components/data-table/ColumnDef';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { Card, CardContent } from '@/components/ui/card';

// Main weld logs table component for displaying and managing weld logs
export function WeldLogsTable({
  weldLogs,
  loading,
  onEdit,
  onCreateNew,
  onConfirmAction,
  onRowClick,
}) {
  const { t } = useTranslation();
  // Define weld log columns
  const weldLogColumns = [
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
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('common.description')}
        />
      ),
    },
  ];

  // Get row action menu items
  const getActionMenuItems = () => {
    return [
      {
        label: t('common.edit'),
        action: (rowData) => {
          onEdit(rowData);
        },
      },
      {
        label: t('common.delete'),
        separator: true,
        action: (rowData) => {
          onConfirmAction('delete', rowData);
        },
      },
    ];
  };

  // Create action buttons
  const actionButtons = [
    {
      label: t('weldLogs.addWeldLog'),
      icon: <Plus className="h-4 w-4" />,
      onClick: onCreateNew,
      variant: 'default',
    },
  ];

  // Defines the bulk action buttons that appear when rows are selected
  const bulkActionButtons = [
    {
      label: t('common.deleteSelected'),
      icon: <Trash className="h-4 w-4" />,
      onClick: (selectedRows) => {
        onConfirmAction('delete', selectedRows, true);
      },
      variant: 'destructive',
    },
  ];

  // Create columns for the table
  const columns = createColumns({
    enableSelection: true,
    enableRowActions: true,
    rowMenuItems: getActionMenuItems(),
    columns: weldLogColumns,
  });

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={columns}
          data={weldLogs}
          loading={loading}
          actionButtons={actionButtons}
          bulkActionButtons={bulkActionButtons}
          onRowClick={onRowClick}
          tableKey="weldLogs"
        />
      </CardContent>
    </Card>
  );
}
