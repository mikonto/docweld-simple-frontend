import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash, Edit, UserMinus } from 'lucide-react';
import {
  createColumns,
  DataTable,
  DataTableColumnHeader,
} from '@/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import type { User, ProjectParticipant } from '@/types';
import type { Column, Row } from '@tanstack/react-table';

interface ParticipantsTableProps {
  participants: ProjectParticipant[];
  users?: User[];
  loading?: boolean;
  onAddParticipant: () => void;
  onEdit: (participant: ProjectParticipant) => void;
  onConfirmAction: (
    action: string,
    data: ProjectParticipant | ProjectParticipant[],
    isBulk?: boolean
  ) => void;
}

// Main participants table component for displaying project participants with roles
export function ParticipantsTable({
  participants,
  users,
  loading,
  onAddParticipant,
  onEdit,
  onConfirmAction,
}: ParticipantsTableProps) {
  const { t } = useTranslation();

  // Create a memoized user lookup map for better performance
  const userMap = useMemo(() => {
    if (!users) return new Map<string, User>();
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  // Helper to format participant roles for display
  const formatRoles = (roles?: string[]) => {
    if (!roles || roles.length === 0) return '—';

    // Map role ids to more readable format
    const roleMapping: Record<string, string> = {
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
      accessorFn: (row: ProjectParticipant) => {
        const user = userMap.get(row.userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
      },
      id: 'name', // Provide a unique ID when using accessorFn
      header: ({ column }: { column: Column<ProjectParticipant> }) => (
        <DataTableColumnHeader column={column} title={t('common.name')} />
      ),
      cell: ({ row }: { row: Row<ProjectParticipant> }) => {
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
      header: ({ column }: { column: Column<ProjectParticipant> }) => (
        <DataTableColumnHeader
          column={column}
          title={t('projects.participatingAs')}
        />
      ),
      cell: ({ row }: { row: Row<ProjectParticipant> }) => {
        const participatingAs = row.getValue('participatingAs') as
          | string[]
          | undefined;
        return <div>{formatRoles(participatingAs)}</div>;
      },
    },
  ];

  // Define row action menu items
  const getActionMenuItems = () => {
    return [
      {
        label: t('common.edit'),
        icon: <Edit className="mr-2 h-4 w-4" />,
        action: (rowData: ProjectParticipant) => {
          onEdit(rowData);
        },
      },
      {
        label: t('projects.removeFromProject'),
        icon: <UserMinus className="mr-2 h-4 w-4" />,
        separator: true,
        action: (rowData: ProjectParticipant) => {
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
      variant: 'default' as const,
    },
  ];

  // Define bulk action buttons
  const bulkActionButtons = [
    {
      label: t('projects.removeFromProject'),
      icon: <Trash className="h-4 w-4" />,
      onClick: (selectedRows: ProjectParticipant[]) => {
        onConfirmAction('remove', selectedRows, true);
      },
      variant: 'destructive' as const,
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
