/**
 * Common UI component prop types
 * Shared props for React components
 */

// Only export what's actually used
export interface BreadcrumbData {
  projectName?: string;
  collectionName?: string;
  weldLogName?: string;
  weldNumber?: string;
}

/*
// Generic UI prop interfaces - preserved for future use
// Currently components use their own specific prop interfaces

import { ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export interface FormProps<T> {
  initialData?: T;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export interface TableColumn<T> {
  key: keyof T | 'actions';
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (item: T) => ReactNode;
}

export interface CardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  actions?: ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

export interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface ErrorProps {
  message: string;
  retry?: () => void;
  className?: string;
}

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

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
*/