// Mock types for test files
import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

// DataTable mock props
export interface MockDataTableProps<TData = unknown> {
  columns: ColumnDef<TData>[];
  data: TData[];
  tabs?: Array<{ value: string; label: string }>;
  activeTab?: string;
  onTabChange?: (value: string) => void;
  actionButtons?: Array<{
    label: string;
    onClick: () => void;
  }>;
  bulkActionButtons?: Array<{
    label: string;
    onClick: (selectedData: TData[]) => void;
  }>;
  onRowClick?: (rowData: TData) => void;
  isLoading?: boolean;
  error?: { message?: string } | null;
}

// Column mock props
export interface MockColumnProps {
  column: {
    id?: string;
    getIsSorted?: () => false | 'asc' | 'desc';
    toggleSorting?: () => void;
  };
  title: string;
}

// Row mock props
export interface MockRowProps<TData = unknown> {
  row: {
    getValue: (key: string) => unknown;
    original: TData;
  };
}

// Cell mock props
export interface MockCellProps<TData = unknown> {
  row: MockRowProps<TData>['row'];
}

// Component mock props
export interface MockComponentProps {
  children?: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: (event: React.MouseEvent) => void;
  open?: boolean;
  onSubmit?: (data: unknown) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  title?: string;
  description?: string;
  actionLabel?: string;
  error?: Error | null;
  loading?: boolean;
  resourceName?: string;
}

// Hook mock return types
export interface MockSignOutHook {
  signOut: () => Promise<boolean>;
  loading: boolean;
  error: Error | undefined;
}

// Firebase mock types
export interface MockFirestoreDoc {
  id: string;
  data: () => Record<string, unknown>;
}

export interface MockFirestoreSnapshot {
  docs: MockFirestoreDoc[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: MockFirestoreDoc) => void) => void;
}

// Event mock types
export interface MockDragEvent {
  active: { id: string };
  over: { id: string } | null;
}

// File upload mock types
export interface MockFile extends Partial<File> {
  name: string;
  size?: number;
  type?: string;
}

// Form data mock types
export type MockFormData = Record<string, unknown>;

// Selection mock types
export interface MockSelectionItem {
  id: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
}
