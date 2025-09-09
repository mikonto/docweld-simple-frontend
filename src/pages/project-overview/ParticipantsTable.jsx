import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash } from 'lucide-react';
import { createColumns } from '@/components/data-table/ColumnDef';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { Card, CardContent } from '@/components/ui/card';

// Main participants table component for displaying project participants with roles
export function ParticipantsTable({
  participants,
  users, // Add users prop to look up user details
  loading,
  onAddParticipant,
  onEdit,
  onConfirmAction,
}) {
  const { t } = useTranslation();

  // Create a memoized user lookup map for better performance
  const userMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  // Helper to format participant roles for display
  const formatRoles = (roles) => {
    if (!roles || roles.length === 0) return '—';

    // Map role ids to more readable format
    const roleMapping = {
      viewer: t('projects.roles.viewer'),
      projectLeader: t('projects.roles.projectLeader'),
      weldingCoordinator: t('projects.roles.weldingCoordinator'),
      responsibleWeldingCoordinator: t(
        'projects.roles.responsibleWeldingCoordinator'
      ),
      welder: t('projects.roles.welder'),
      heatTreatmentOperator: t('projects.roles.heatTreatmentOperator'),
      ndtOperator: t('projects.roles.ndtOperator'),
    };

    return roles.map((role) => roleMapping[role] || role).join(', ');
  };

  // Define participant columns
  const participantColumns = [
    {
      // Use accessorFn to create a searchable full name string
      accessorFn: (row) => {
        const user = userMap.get(row.userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
      },
      id: 'name', // Provide a unique ID when using accessorFn
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('common.name')} />
      ),
      cell: ({ row }) => {
        const user = userMap.get(row.original.userId);
        if (!user) {
          return (
            <div className="font-medium text-muted-foreground">
              Unknown User
            </div>
          );
        }
        return (
          <div className="font-medium">
            {user.firstName} {user.lastName}
          </div>
        );
      },
    },
    {
      accessorKey: 'participatingAs',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('projects.participatingAs')}
        />
      ),
      cell: ({ row }) => {
        return <div>{formatRoles(row.getValue('participatingAs'))}</div>;
      },
    },
  ];

  // Define row action menu items
  const getActionMenuItems = () => {
    return [
      {
        label: t('common.edit'),
        action: (rowData) => {
          onEdit(rowData);
        },
      },
      {
        label: t('projects.removeFromProject'),
        separator: true,
        action: (rowData) => {
          onConfirmAction('remove', rowData);
        },
      },
    ];
  };

  // Create action buttons
  const actionButtons = [
    {
      label: t('projects.addParticipant'),
      icon: <Plus className="h-4 w-4" />,
      onClick: onAddParticipant,
      variant: 'default',
    },
  ];

  // Define bulk action buttons
  const bulkActionButtons = [
    {
      label: t('projects.removeFromProject'),
      icon: <Trash className="h-4 w-4" />,
      onClick: (selectedRows) => {
        onConfirmAction('remove', selectedRows, true);
      },
      variant: 'destructive',
    },
  ];

  // Create columns for the table
  const columns = createColumns({
    enableSelection: true,
    enableRowActions: true,
    rowMenuItems: getActionMenuItems(),
    columns: participantColumns,
  });

  return (
    <Card className="h-full flex flex-col">
      <CardContent>
        <DataTable
          columns={columns}
          data={participants}
          isLoading={loading}
          actionButtons={actionButtons}
          bulkActionButtons={bulkActionButtons}
          title={t('projects.projectParticipants')}
          tableKey="participants"
        />
      </CardContent>
    </Card>
  );
}
