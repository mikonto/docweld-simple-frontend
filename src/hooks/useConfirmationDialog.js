import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Hook for managing confirmation dialogs with operation execution
 * Handles confirmation state, executes operations, and shows toast notifications
 *
 * @param {Object} operations - Object containing operation functions (e.g., { delete: deleteUser, archive: archiveUser })
 * @returns {Object} Dialog state and controls
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
export function useConfirmationDialog(operations = {}) {
  const { t } = useTranslation();

  const [dialog, setDialog] = useState({
    isOpen: false,
    type: null, // Operation type: 'delete', 'archive', etc.
    data: null, // Single entity or array of entities
    isBulk: false, // Whether it's a bulk operation
  });

  /**
   * Opens the confirmation dialog
   * @param {string} type - Operation type (must match a key in operations object)
   * @param {Object|Array} data - Single entity or array of entities
   * @param {boolean} isBulk - Whether this is a bulk operation
   */
  const open = (type, data, isBulk = false) => {
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

    // Get the operation function for this type
    const operation = operations[type];
    if (!operation) {
      toast.error(t('crud.operationNotConfigured'));
      close();
      return;
    }

    try {
      if (isBulk) {
        // Bulk operation - process all items
        await Promise.all(data.map((item) => operation(item.id)));
        toast.success(
          t('crud.bulkOperationSuccess', {
            operation: type,
            count: data.length,
          })
        );
      } else {
        // Single operation
        await operation(data.id);
        toast.success(t('crud.operationSuccess', { operation: type }));
      }
    } catch (error) {
      // Error handling with user-friendly message
      const errorMessage = error.message || t('crud.unknownError');
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
