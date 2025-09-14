import React from 'react';
import { Plus, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createColumns } from '@/components/data-table/ColumnDef';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useMaterials } from '@/hooks/useMaterials';
import { useTranslation } from 'react-i18next';
import type { Weld, Material } from '@/types/app';
import type { ColumnDef } from '@tanstack/react-table';

// Extended Weld type with additional Firestore fields
interface ExtendedWeld extends Weld {
  parentMaterials?: string[];
  fillerMaterials?: string[];
  heatTreatment?: boolean;
}

interface WeldsProps {
  welds: Weld[];
  loading: boolean;
  onEdit: (weld: Weld) => void;
  onCreateNew: () => void;
  onConfirmAction: (
    action: string,
    data: Weld | Weld[],
    isBulk?: boolean
  ) => void;
  projectId: string;
  weldLogId: string;
}

// Format an array of materials to a comma-separated string with tooltip
const formatMaterialsWithTooltip = (
  materialIds: string[] | undefined,
  materialsList: Material[] | undefined,
  useTooltip = true
): React.ReactNode | string => {
  if (!materialIds || materialIds.length === 0 || !materialsList) return '—';

  // Map IDs to material names/info
  const materialInfos = materialIds.map((id) => {
    const material = materialsList.find((m) => m.id === id);
    if (!material) return id; // Fallback to ID if material not found

    // Format based on material type
    const materialWithType = material as Material & {
      type?: string;
      dimensions?: string;
      alloyMaterial?: string;
    };

    if (materialWithType.type) {
      // Parent material with more details
      return `${materialWithType.type} - ${materialWithType.dimensions || 'N/A'} - ${
        materialWithType.alloyMaterial || 'N/A'
      }`;
    } else {
      // Filler material with just name
      return material.name;
    }
  });

  const displayText = materialInfos.join(', ');

  // If tooltip is not needed or the text is short enough, return plain text
  if (!useTooltip || displayText.length < 50) {
    return displayText;
  }

  // If text is too long, use tooltip
  return (
    <Tooltip delayDuration={700}>
      <TooltipTrigger asChild>
        <span className="truncate max-w-[200px] inline-block">
          {displayText.substring(0, 50)}...
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-md">
        {displayText}
      </TooltipContent>
    </Tooltip>
  );
};

// Main welds component for displaying and managing individual welds
export function Welds({
  welds,
  loading,
  onEdit,
  onCreateNew,
  onConfirmAction,
  projectId,
  weldLogId,
}: WeldsProps): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch parent and filler materials for display
  const [parentMaterials, parentLoading] = useMaterials('parent');
  const [fillerMaterials, fillerLoading] = useMaterials('filler');

  // Define weld columns
  const weldColumns: ColumnDef<ExtendedWeld>[] = [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('weldLogs.weldNumber')}
        />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('number')}</div>
      ),
    },
    {
      accessorKey: 'position',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('weldLogs.position')} />
      ),
    },
    {
      accessorKey: 'parentMaterials',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('weldLogs.parentMaterials')}
        />
      ),
      cell: ({ row }) => (
        <div className="max-w-md">
          {formatMaterialsWithTooltip(
            row.original.parentMaterials,
            parentMaterials,
            true
          )}
        </div>
      ),
    },
    {
      accessorKey: 'fillerMaterials',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('weldLogs.fillerMaterials')}
        />
      ),
      cell: ({ row }) => (
        <div className="max-w-md">
          {formatMaterialsWithTooltip(
            row.original.fillerMaterials,
            fillerMaterials,
            true
          )}
        </div>
      ),
    },
    {
      accessorKey: 'heatTreatment',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('weldLogs.heatTreatment')}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.heatTreatment ? t('common.yes') : t('common.no')}
        </div>
      ),
    },
  ];

  // Get row action menu items
  const getActionMenuItems = () => {
    return [
      {
        label: t('common.edit'),
        action: (rowData: Weld) => {
          onEdit(rowData);
        },
      },
      {
        label: t('common.delete'),
        separator: true,
        action: (rowData: Weld) => {
          onConfirmAction('delete', rowData);
        },
      },
    ];
  };

  // Create action buttons
  const actionButtons = [
    {
      label: t('weldLogs.addWeld'),
      icon: <Plus className="h-4 w-4" />,
      onClick: onCreateNew,
      variant: 'default' as const,
    },
  ];

  // Define bulk action buttons
  const bulkActionButtons = [
    {
      label: t('common.deleteSelected'),
      icon: <Trash className="h-4 w-4" />,
      onClick: (selectedRows: Weld[]) => {
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
    columns: weldColumns,
  });

  // Handle row click to navigate to weld overview
  const handleRowClick = (weld: Weld): void => {
    navigate(`/projects/${projectId}/weld-logs/${weldLogId}/welds/${weld.id}`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent>
        <DataTable
          columns={columns}
          data={welds}
          isLoading={loading || parentLoading || fillerLoading}
          actionButtons={actionButtons}
          bulkActionButtons={bulkActionButtons}
          title={t('weldLogs.welds')}
          tableKey="welds"
          onRowClick={handleRowClick}
        />
      </CardContent>
    </Card>
  );
}
