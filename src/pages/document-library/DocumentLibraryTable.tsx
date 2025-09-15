import { Plus, Trash, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createColumns,
  DataTable,
  DataTableColumnHeader,
} from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import type { DocumentLibrary } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

export interface DocumentLibraryTableProps {
  documents: DocumentLibrary[];
  loading: boolean;
  onEdit: (document: DocumentLibrary) => void;
  onCreateNew: () => void;
  onConfirmAction: (
    action: 'delete',
    data: DocumentLibrary | DocumentLibrary[],
    isBulk?: boolean
  ) => void;
  onRowClick: (document: DocumentLibrary) => void;
}

// Main document library table component for displaying document collections
export function DocumentLibraryTable({
  documents,
  loading,
  onEdit,
  onCreateNew,
  onConfirmAction,
  onRowClick,
}: DocumentLibraryTableProps) {
  const { t } = useTranslation();

  // Define document columns
  const documentColumns: ColumnDef<DocumentLibrary>[] = [
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
      icon: <Edit className="mr-2 h-4 w-4" />,
      action: (rowData: DocumentLibrary) => onEdit(rowData),
    },
    {
      label: t('common.delete'),
      icon: <Trash className="mr-2 h-4 w-4" />,
      separator: true,
      action: (rowData: DocumentLibrary) => onConfirmAction('delete', rowData),
    },
  ];

  // Create action buttons
  const actionButtons = [
    {
      label: t('documentLibrary.addDocumentCollection'),
      icon: <Plus className="h-4 w-4" />,
      onClick: onCreateNew,
      variant: 'default' as const,
    },
  ];

  // Defines the bulk action buttons that appear when rows are selected
  const bulkActionButtons = [
    {
      label: t('common.deleteSelected'),
      icon: <Trash className="h-4 w-4" />,
      onClick: (selectedRows: DocumentLibrary[]) => {
        onConfirmAction('delete', selectedRows, true);
      },
      variant: 'destructive' as const,
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
          isLoading={loading}
          actionButtons={actionButtons}
          bulkActionButtons={bulkActionButtons}
          onRowClick={onRowClick}
          tableKey="documentLibrary"
        />
      </CardContent>
    </Card>
  );
}
