import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { ActionsCell, RowMenuItem } from './ActionsCell';

export interface CreateColumnsOptions<TData = unknown> {
  enableSelection?: boolean;
  enableRowActions?: boolean;
  rowMenuItems?: RowMenuItem<TData>[];
  columns?: ColumnDef<TData, unknown>[];
}

/**
 * Creates a set of column definitions for the data table
 * Following shadcn/ui and TanStack Table v8 conventions
 */
export function createColumns<TData = unknown>({
  enableSelection = true,
  enableRowActions = true,
  rowMenuItems = [],
  columns = [],
}: CreateColumnsOptions<TData>): ColumnDef<TData, unknown>[] {
  const generatedColumns: ColumnDef<TData, unknown>[] = [];

  // Add selection column with checkboxes
  if (enableSelection) {
    generatedColumns.push({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
    });
  }

  // Add user-defined data columns
  generatedColumns.push(...columns);

  // Add actions dropdown menu column
  if (enableRowActions && rowMenuItems.length > 0) {
    generatedColumns.push({
      id: 'actions',
      cell: ({ row }) => <ActionsCell row={row} rowMenuItems={rowMenuItems} />,
      enableSorting: false,
    });
  }

  return generatedColumns;
}
