import { useState } from 'react';

/**
 * Simple hook for managing form dialog state
 * Handles open/close state and entity data for create/edit forms
 *
 * @returns {Object} Dialog state and controls
 *
 * @example
 * const formDialog = useFormDialog();
 *
 * // Open form for creating new item
 * formDialog.open();
 *
 * // Open form for editing existing item
 * formDialog.open(existingItem);
 *
 * // Close form
 * formDialog.close();
 *
 * // Use in component
 * <FormDialog
 *   open={formDialog.isOpen}
 *   entity={formDialog.entity}
 *   onClose={formDialog.close}
 * />
 */
export function useFormDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [entity, setEntity] = useState(null);

  /**
   * Opens the form dialog
   * @param {Object|null} entity - Entity to edit, or null for create
   */
  const open = (entity = null) => {
    setEntity(entity);
    setIsOpen(true);
  };

  /**
   * Closes the form dialog and resets state
   */
  const close = () => {
    setIsOpen(false);
    setEntity(null);
  };

  return {
    isOpen,
    entity,
    open,
    close,
  };
}
