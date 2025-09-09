import React from 'react';
import { Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createColumns } from '@/components/data-table/ColumnDef';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { Card, CardContent } from '@/components/ui/card';

// Main document library table component for displaying document collections
export function DocumentLibraryTable({
  documents,
  loading,
  onEdit,
  onCreateNew,
  onConfirmAction,
  onRowClick,
}) {
  const { t } = useTranslation();

  // Define document columns
  const documentColumns = [
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
  const getActionMenuItems = () => [
    {
      label: t('common.edit'),
      action: (rowData) => onEdit(rowData),
    },
    {
      label: t('common.delete'),
      separator: true,
      action: (rowData) => onConfirmAction('delete', rowData),
    },
  ];

  // Create action buttons
  const actionButtons = [
    {
      label: t('documentLibrary.addDocumentCollection'),
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
    columns: documentColumns,
  });

  return (
    <Card>
      <CardContent>
        <DataTable
          title={t('documentLibrary.documentCollections')}
          columns={columns}
          data={documents}
          loading={loading}
          actionButtons={actionButtons}
          bulkActionButtons={bulkActionButtons}
          onRowClick={onRowClick}
          tableKey="documentLibrary"
        />
      </CardContent>
    </Card>
  );
}
