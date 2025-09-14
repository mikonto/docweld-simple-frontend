import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Entity with an ID that can be operated on
 */
export interface IdentifiableEntity {
  id: string;
  [key: string]: unknown;
}

/**
 * Dialog state for confirmation operations
 */
interface ConfirmationDialogState {
  isOpen: boolean;
  type: string | null;
  data: IdentifiableEntity | IdentifiableEntity[] | null;
  isBulk: boolean;
}

/**
 * Operation function type
 */
export type OperationFunction = (id: string) => Promise<void>;

/**
 * Operations object mapping operation types to functions
 */
interface Operations {
  [key: string]: OperationFunction;
}

/**
 * Return type for useConfirmationDialog hook
 */
interface UseConfirmationDialogReturn {
  dialog: ConfirmationDialogState;
  open: (
    type: string,
    data: IdentifiableEntity | IdentifiableEntity[],
    isBulk?: boolean
  ) => void;
  close: () => void;
  handleConfirm: () => Promise<void>;
}

/**
 * Hook for managing confirmation dialogs with operation execution
 * Handles confirmation state, executes operations, and shows toast notifications
 *
 * @param operations - Object containing operation functions (e.g., { delete: deleteUser, archive: archiveUser })
 * @returns Dialog state and controls
 *
 * @example
 * const confirmDialog = useConfirmationDialog({
 *   delete: deleteUser,
 *   archive: archiveUser,
 * });
 *
 * // Open confirmation for single item
 * confirmDialog.open('delete', userObject);
 *
 * // Open confirmation for bulk operation
 * confirmDialog.open('archive', selectedUsers, true);
 *
 * // Use in component
 * <ConfirmationDialog
 *   isOpen={confirmDialog.dialog.isOpen}
 *   onConfirm={confirmDialog.handleConfirm}
 *   onCancel={confirmDialog.close}
 * />
 */
export function useConfirmationDialog(
  operations: Operations = {}
): UseConfirmationDialogReturn {
  const { t } = useTranslation();

  const [dialog, setDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    type: null,
    data: null,
    isBulk: false,
  });

  /**
   * Opens the confirmation dialog
   * @param type - Operation type (must match a key in operations object)
   * @param data - Single entity or array of entities
   * @param isBulk - Whether this is a bulk operation
   */
  const open = (
    type: string,
    data: IdentifiableEntity | IdentifiableEntity[],
    isBulk = false
  ) => {
    setDialog({
      isOpen: true,
      type,
      data,
      isBulk,
    });
  };

  /**
   * Closes the confirmation dialog and resets state
   */
  const close = () => {
    setDialog({
      isOpen: false,
      type: null,
      data: null,
      isBulk: false,
    });
  };

  /**
   * Handles the confirmation action
   * Executes the appropriate operation and shows toast notifications
   */
  const handleConfirm = async () => {
    const { type, isBulk, data } = dialog;

    if (!type || !data) {
      close();
      return;
    }

    // Get the operation function for this type
    const operation = operations[type];
    if (!operation) {
      toast.error(t('crud.operationNotConfigured'));
      close();
      return;
    }

    try {
      if (isBulk && Array.isArray(data)) {
        // Bulk operation - process all items
        await Promise.all(data.map((item) => operation(item.id)));
        toast.success(
          t('crud.bulkOperationSuccess', {
            operation: type,
            count: data.length,
          })
        );
      } else if (!Array.isArray(data)) {
        // Single operation
        await operation(data.id);
        toast.success(t('crud.operationSuccess', { operation: type }));
      }
    } catch (error) {
      // Error handling with user-friendly message
      const errorMessage =
        error instanceof Error ? error.message : t('crud.unknownError');
      toast.error(
        t('crud.operationFailedWithMessage', {
          operation: type,
          message: errorMessage,
        })
      );
    } finally {
      // Always close dialog after operation
      close();
    }
  };

  return {
    dialog,
    open,
    close,
    handleConfirm,
  };
}
