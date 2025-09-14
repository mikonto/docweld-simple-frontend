import { Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createColumns,
  DataTable,
  DataTableColumnHeader,
} from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import type { Material } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

interface MaterialsTableProps {
  materials: Material[];
  loading?: boolean;
  activeTab: 'parent' | 'filler' | 'alloy';
  onTabChange: (tab: 'parent' | 'filler' | 'alloy') => void;
  onEdit: (material: Material) => void;
  onCreateNew: () => void;
  onConfirmAction: (
    action: string,
    data: Material | Material[],
    isBulk?: boolean
  ) => void;
}

// Main materials table component with tabs for different material types
export function MaterialsTable({
  materials,
  loading,
  activeTab,
  onTabChange,
  onEdit,
  onCreateNew,
  onConfirmAction,
}: MaterialsTableProps) {
  const { t } = useTranslation();

  // Define tabs for the material table
  const tabs = [
    { value: 'parent' as const, label: t('materials.parentMaterialTab') },
    { value: 'filler' as const, label: t('materials.fillerMaterialsTab') },
    { value: 'alloy' as const, label: t('materials.alloyMaterialsTab') },
  ];

  // Define material columns based on active tab
  const getMaterialColumns = (): ColumnDef<Material>[] => {
    switch (activeTab) {
      case 'parent':
        return [
          {
            accessorKey: 'type',
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title={t('materials.type')}
              />
            ),
          },
          {
            accessorKey: 'dimensions',
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title={t('materials.dimensions')}
              />
            ),
          },
          {
            accessorKey: 'thickness',
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title={t('materials.thickness')}
              />
            ),
          },
          {
            accessorKey: 'alloyMaterial',
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title={t('materials.alloyMaterial')}
              />
            ),
          },
        ];
      case 'filler':
        return [
          {
            accessorKey: 'name',
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title={t('materials.fillerMaterial')}
              />
            ),
            cell: ({ row }) => (
              <div className="font-medium">{row.getValue('name')}</div>
            ),
          },
        ];
      case 'alloy':
        return [
          {
            accessorKey: 'name',
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title={t('materials.alloyMaterial')}
              />
            ),
            cell: ({ row }) => (
              <div className="font-medium">{row.getValue('name')}</div>
            ),
          },
        ];
      default:
        return [];
    }
  };

  // Get row action menu items
  const getActionMenuItems = () => {
    return [
      {
        label: t('common.edit'),
        action: (rowData: Material) => {
          onEdit(rowData);
        },
      },
      {
        label: t('common.delete'),
        separator: true,
        action: (rowData: Material) => {
          onConfirmAction('delete', rowData);
        },
      },
    ];
  };

  // Create action button based on active tab
  const getActionButton = () => {
    const labels = {
      parent: t('materials.addParentMaterial'),
      filler: t('materials.addFillerMaterial'),
      alloy: t('materials.addAlloyMaterial'),
    };

    return [
      {
        label: labels[activeTab],
        icon: <Plus className="h-4 w-4" />,
        onClick: onCreateNew,
        variant: 'default' as const,
      },
    ];
  };

  // Define bulk action buttons
  const bulkActionButtons = [
    {
      label: t('materials.deleteSelected'),
      icon: <Trash className="h-4 w-4" />,
      onClick: (selectedRows: Material[]) => {
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
    columns: getMaterialColumns(),
  });

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={columns}
          data={materials}
          tabs={tabs}
          activeTab={activeTab}
          isLoading={loading}
          onTabChange={(value: string) =>
            onTabChange(value as 'parent' | 'filler' | 'alloy')
          }
          actionButtons={getActionButton()}
          bulkActionButtons={bulkActionButtons}
          tableKey={`materials_${activeTab}`}
        />
      </CardContent>
    </Card>
  );
}
