import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash } from 'lucide-react';
import { createColumns, DataTable, DataTableColumnHeader } from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import type { WeldLog } from '@/types/app';

// Define prop types for the component
interface WeldLogsTableProps {
  weldLogs: WeldLog[];
  loading: boolean;
  onEdit: (weldLog: WeldLog) => void;
  onCreateNew: () => void;
  onConfirmAction: (action: string, data: WeldLog | WeldLog[], isBulk?: boolean) => void;
  onRowClick: (rowData: WeldLog) => void;
}

// Define action button interface
interface ActionButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

// Define bulk action button interface
interface BulkActionButton {
  label: string;
  icon: React.ReactNode;
  onClick: (selectedRows: WeldLog[]) => void;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

// Define menu item interface
interface MenuItemAction {
  label: string;
  separator?: boolean;
  action: (rowData: WeldLog) => void;
}

// Main weld logs table component for displaying and managing weld logs
export function WeldLogsTable({
  weldLogs,
  loading,
  onEdit,
  onCreateNew,
  onConfirmAction,
  onRowClick,
}: WeldLogsTableProps) {
  const { t } = useTranslation();
  
  // Define weld log columns
  const weldLogColumns = [
    {
      accessorKey: 'name',
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title={t('common.name')} className="" />
      ),
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader
          column={column}
          title={t('common.description')}
          className=""
        />
      ),
    },
  ];

  // Get row action menu items
  const getActionMenuItems = (): MenuItemAction[] => {
    return [
      {
        label: t('common.edit'),
        action: (rowData: WeldLog) => {
          onEdit(rowData);
        },
      },
      {
        label: t('common.delete'),
        separator: true,
        action: (rowData: WeldLog) => {
          onConfirmAction('delete', rowData);
        },
      },
    ];
  };

  // Create action buttons
  const actionButtons: ActionButton[] = [
    {
      label: t('weldLogs.addWeldLog'),
      icon: <Plus className="h-4 w-4" />,
      onClick: onCreateNew,
      variant: 'default',
    },
  ];

  // Defines the bulk action buttons that appear when rows are selected
  const bulkActionButtons: BulkActionButton[] = [
    {
      label: t('common.deleteSelected'),
      icon: <Trash className="h-4 w-4" />,
      onClick: (selectedRows: WeldLog[]) => {
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
          isLoading={loading}
          actionButtons={actionButtons}
          bulkActionButtons={bulkActionButtons}
          onRowClick={onRowClick}
          tableKey="weldLogs"
        />
      </CardContent>
    </Card>
  );
}