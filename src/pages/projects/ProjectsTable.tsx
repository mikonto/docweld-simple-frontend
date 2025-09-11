import React from 'react';
import { Plus, Trash, Archive, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { createColumns, DataTable, DataTableColumnHeader } from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import type { Project } from '@/types/database';
import type { ColumnDef } from '@tanstack/react-table';

export interface ProjectsTableProps {
  projects: Project[];
  loading: boolean;
  activeTab: 'active' | 'archived';
  onTabChange: (tab: 'active' | 'archived') => void;
  onEdit: (project: Project) => void;
  onCreateNew: () => void;
  onConfirmAction: (
    action: 'delete' | 'archive' | 'restore',
    data: Project | Project[],
    isBulk?: boolean
  ) => void;
  onRowClick: (project: Project) => void;
}

// Main projects table component with tabs for active/archived projects
export function ProjectsTable({
  projects,
  loading,
  activeTab,
  onTabChange,
  onEdit,
  onCreateNew,
  onConfirmAction,
  onRowClick,
}: ProjectsTableProps) {
  const { t } = useTranslation();

  // Define project columns
  const projectColumns: ColumnDef<Project>[] = [
    {
      accessorKey: 'projectName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('common.name')} />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('projectName')}</div>
      ),
    },
    {
      accessorKey: 'projectNumber',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('projects.projectNumber')}
        />
      ),
    },
    {
      accessorKey: 'customer',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('projects.customer')} />
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

  // Define tabs for the project table
  const tabs = [
    { value: 'active', label: t('projects.active') },
    { value: 'archived', label: t('projects.archived') },
  ];

  // Get row action menu items
  const getActionMenuItems = () => {
    const editItem = {
      label: t('common.edit'),
      action: (rowData: Project) => {
        onEdit(rowData);
      },
    };

    const activeTabItems = [
      {
        label: t('projects.archive'),
        action: (rowData: Project) => {
          onConfirmAction('archive', rowData);
        },
      },
    ];

    const archivedTabItems = [
      {
        label: t('projects.restoreToActive'),
        action: (rowData: Project) => {
          onConfirmAction('restore', rowData);
        },
      },
    ];

    const deleteItem = {
      label: t('common.delete'),
      separator: true,
      action: (rowData: Project) => {
        onConfirmAction('delete', rowData);
      },
    };

    return [
      editItem,
      ...(activeTab === 'active' ? activeTabItems : archivedTabItems),
      deleteItem,
    ];
  };

  // Create action buttons
  const actionButtons = [
    {
      label: t('projects.addProject'),
      icon: <Plus className="h-4 w-4" />,
      onClick: onCreateNew,
      variant: 'default' as const,
    },
  ];

  // Creates the bulk action button for archive/restore
  const archiveRestoreButton =
    activeTab === 'archived'
      ? {
          label: t('projects.restoreSelected'),
          icon: <RotateCcw className="h-4 w-4" />,
          onClick: (selectedRows: Project[]) => {
            onConfirmAction('restore', selectedRows, true);
          },
          variant: 'outline' as const,
        }
      : {
          label: t('projects.archiveSelected'),
          icon: <Archive className="h-4 w-4" />,
          onClick: (selectedRows: Project[]) => {
            onConfirmAction('archive', selectedRows, true);
          },
          variant: 'outline' as const,
        };

  // Defines the bulk action buttons that appear when rows are selected
  const bulkActionButtons = [
    archiveRestoreButton,
    {
      label: t('projects.deleteSelected'),
      icon: <Trash className="h-4 w-4" />,
      onClick: (selectedRows: Project[]) => {
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
    columns: projectColumns,
  });

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={columns}
          data={projects}
          tabs={tabs}
          activeTab={activeTab}
          isLoading={loading}
          onTabChange={onTabChange}
          actionButtons={actionButtons}
          bulkActionButtons={bulkActionButtons}
          onRowClick={onRowClick}
          tableKey="projects"
        />
      </CardContent>
    </Card>
  );
}