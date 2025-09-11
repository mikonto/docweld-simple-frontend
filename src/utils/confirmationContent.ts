/**
 * Confirmation dialog content type
 */
interface ConfirmationContent {
  title: string;
  description: string;
  actionLabel: string;
  actionVariant: 'default' | 'destructive';
}

/**
 * Translation function type (from i18next)
 */
type TFunction = (key: string, options?: Record<string, any>) => string;

/**
 * Operation types for confirmation dialogs
 */
type ConfirmationOperationType = 
  | 'delete'
  | 'archive'
  | 'restore'
  | 'remove'
  | 'promote'
  | 'demote'
  | 'activate'
  | 'deactivate'
  | string; // Allow custom types

/**
 * Utility function to generate confirmation dialog content
 * Centralizes all confirmation messages to reduce repetition across pages
 *
 * @param type - Operation type (delete, archive, restore, etc.)
 * @param isBulk - Whether it's a bulk operation
 * @param count - Number of items (for bulk operations)
 * @param t - Translation function from react-i18next
 * @param entityType - Type of entity (projects, users, etc.) for translation keys
 * @returns Confirmation dialog content with title, description, actionLabel, and actionVariant
 *
 * @example
 * const content = getConfirmationContent('delete', false, 1, t, 'projects');
 * // Returns: { title: 'Delete Project', description: '...', actionLabel: 'Delete', actionVariant: 'destructive' }
 *
 * const content = getConfirmationContent('archive', true, 3, t, 'users');
 * // Returns: { title: 'Archive Selected Users', description: '...', actionLabel: 'Archive', actionVariant: 'default' }
 */
export function getConfirmationContent(
  type: ConfirmationOperationType,
  isBulk: boolean,
  count: number,
  t: TFunction,
  entityType: string
): ConfirmationContent {
  // Helper function to build translation keys
  const getKey = (suffix: string): string => `${entityType}.${suffix}`;

  switch (type) {
    case 'delete':
      return {
        title: isBulk ? t(getKey('deleteSelected')) : t(getKey('deleteItem')),
        description: isBulk
          ? t(getKey('confirmDeleteMultiple'), { count })
          : t(getKey('confirmDelete')),
        actionLabel: t('common.delete'),
        actionVariant: 'destructive',
      };

    case 'archive':
      return {
        title: isBulk ? t(getKey('archiveSelected')) : t(getKey('archiveItem')),
        description: isBulk
          ? t(getKey('confirmArchiveMultiple'), { count })
          : t(getKey('confirmArchive')),
        actionLabel: t(getKey('archive')),
        actionVariant: 'default',
      };

    case 'restore':
      return {
        title: isBulk ? t(getKey('restoreSelected')) : t(getKey('restoreItem')),
        description: isBulk
          ? t(getKey('confirmRestoreMultiple'), { count })
          : t(getKey('confirmRestore')),
        actionLabel: t('common.confirm'),
        actionVariant: 'default',
      };

    case 'remove':
      return {
        title: isBulk
          ? t(getKey('removeSelectedParticipants'))
          : t(getKey('removeFromProject')),
        description: isBulk
          ? t(getKey('confirmRemoveSelectedParticipants'))
          : t(getKey('confirmRemoveParticipant')),
        actionLabel: t('common.remove'),
        actionVariant: 'destructive',
      };

    case 'promote':
      return {
        title: isBulk ? t(getKey('promoteSelected')) : t(getKey('promoteItem')),
        description: t(getKey('promoteDescription'), { count }),
        actionLabel: t(getKey('promote')),
        actionVariant: 'default',
      };

    case 'demote':
      return {
        title: isBulk ? t(getKey('demoteSelected')) : t(getKey('demoteItem')),
        description: t(getKey('demoteDescription'), { count }),
        actionLabel: t(getKey('demote')),
        actionVariant: 'destructive',
      };

    case 'activate':
      return {
        title: isBulk
          ? t(getKey('activateSelected'))
          : t(getKey('activateItem')),
        description: t(getKey('activateDescription'), { count }),
        actionLabel: t(getKey('activate')),
        actionVariant: 'default',
      };

    case 'deactivate':
      return {
        title: isBulk
          ? t(getKey('deactivateSelected'))
          : t(getKey('deactivateItem')),
        description: t(getKey('deactivateDescription'), { count }),
        actionLabel: t(getKey('deactivate')),
        actionVariant: 'destructive',
      };

    default:
      // Fallback for custom operation types
      return {
        title: isBulk
          ? t('common.confirmBulkAction', { action: type, count })
          : t('common.confirmAction', { action: type }),
        description: isBulk
          ? t('common.bulkActionDescription', { action: type, count })
          : t('common.actionDescription', { action: type }),
        actionLabel: t('common.confirm'),
        actionVariant: 'default',
      };
  }
}