/**
 * Common UI component prop types
 * Shared props for React components
 */

import { ReactNode } from 'react';

/**
 * Dialog/Modal props
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Form props (generic)
 */
export interface FormProps<T> {
  initialData?: T;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

/**
 * Table props (generic)
 */
export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Table column definition
 */
export interface TableColumn<T> {
  key: keyof T | 'actions'; // Allow 'actions' as special column
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (item: T) => ReactNode;
}

/**
 * Card component props
 */
export interface CardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  actions?: ReactNode;
}

/**
 * Select/Dropdown option
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Common props for form fields
 */
export interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

/**
 * Loading state component props
 */
export interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Error state component props
 */
export interface ErrorProps {
  message: string;
  retry?: () => void;
  className?: string;
}

/**
 * Empty state component props
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

/**
 * Button props extension
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Breadcrumb navigation data
 * Used to display dynamic breadcrumb content
 */
export interface BreadcrumbData {
  projectName?: string;
  collectionName?: string;
  weldLogName?: string;
  weldNumber?: string;
}