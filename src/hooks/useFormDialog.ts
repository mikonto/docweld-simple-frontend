import { useState } from 'react';

/**
 * Return type for useFormDialog hook
 */
interface UseFormDialogReturn<T = any> {
  isOpen: boolean;
  entity: T | null;
  open: (entity?: T | null) => void;
  close: () => void;
}

/**
 * Simple hook for managing form dialog state
 * Handles open/close state and entity data for create/edit forms
 *
 * @returns Dialog state and controls
 *
 * @example
 * const formDialog = useFormDialog<User>();
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
export function useFormDialog<T = any>(): UseFormDialogReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [entity, setEntity] = useState<T | null>(null);

  /**
   * Opens the form dialog
   * @param entity - Entity to edit, or null/undefined for create
   */
  const open = (entity: T | null = null) => {
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