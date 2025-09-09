import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from './DataTablePagination';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PropTypes from 'prop-types';

// Main reusable data table component with filtering, sorting, pagination, and bulk actions
export function DataTable({
  columns,
  data,
  tabs = null,
  activeTab = null,
  onTabChange = null,
  actionButtons = null,
  bulkActionButtons = null,
  onRowClick = null,
  isLoading = false,
  error = null,
  tableKey = null, // Optional key for table-specific localStorage
  title = null, // Optional title to display in the header
}) {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  // Load saved page size from localStorage, default to 10 if not found
  const getSavedPageSize = () => {
    if (!tableKey) return 10; // No persistence without tableKey
    const saved = localStorage.getItem(`tablePageSize_${tableKey}`);
    return saved ? parseInt(saved, 10) : 10;
  };

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: getSavedPageSize(),
  });

  // Debounced filter to improve performance
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] =
    React.useState(globalFilter);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  // Create the table instance
  const table = useReactTable({
    data: data || [],
    columns: columns,
    state: {
      sorting,
      rowSelection,
      globalFilter: debouncedGlobalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // Save page size to localStorage when it changes (only if tableKey provided)
        if (tableKey && next.pageSize !== prev.pageSize) {
          localStorage.setItem(
            `tablePageSize_${tableKey}`,
            next.pageSize.toString()
          );
        }
        return next;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString', // Case-insensitive string matching
  });

  // Handle row click
  const handleRowClick = React.useCallback(
    (row) => {
      if (onRowClick) {
        onRowClick(row.original);
      }
    },
    [onRowClick]
  );

  // Handle table row click with event filtering
  const handleTableRowClick = React.useCallback(
    (e, row) => {
      // Don't trigger row click when clicking on checkboxes or action buttons
      if (
        e.target.closest('[role="checkbox"]') ||
        e.target.closest('[role="menuitem"]') ||
        e.target.closest('button')
      ) {
        return;
      }
      if (onRowClick) {
        handleRowClick(row);
      }
    },
    [onRowClick, handleRowClick]
  );

  // Handle tab change and reset selection
  const handleTabChange = React.useCallback(
    (value) => {
      setRowSelection({});
      if (onTabChange) {
        onTabChange(value);
      }
    },
    [onTabChange]
  );

  // Get the selected rows
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  // Reset selection after any action
  const handleBulkAction = React.useCallback(
    (actionFn) => {
      const selectedData = selectedRows.map((row) => row.original);
      setRowSelection({}); // Reset selection immediately after getting selected data
      actionFn(selectedData);
    },
    [selectedRows]
  );

  // Search and action buttons content
  const searchAndActions = (
    <div className="flex items-center gap-2">
      {/* Search input - Only shown when no rows are selected */}
      {!hasSelectedRows && (
        <div className="relative">
          <label htmlFor="table-search" className="sr-only">
            {t('table.searchData')}
          </label>
          <Input
            id="table-search"
            placeholder={t('common.search') + '...'}
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            autoComplete="off"
            className="h-9 w-[150px] lg:w-[250px]"
            aria-label={t('table.searchData')}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Bulk Action Buttons - Only shown when rows are selected */}
      {hasSelectedRows && bulkActionButtons ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">
            {selectedRows.length} selected
          </span>
          {bulkActionButtons.map((actionBtn, index) => (
            <Button
              key={index}
              variant={actionBtn.variant || 'outline'}
              size={actionBtn.size || 'sm'}
              onClick={() => handleBulkAction(actionBtn.onClick)}
              disabled={actionBtn.disabled || isLoading}
              className={actionBtn.className}
              aria-label={actionBtn.label}
            >
              {actionBtn.icon && (
                <span className="mr-2" aria-hidden="true">
                  {actionBtn.icon}
                </span>
              )}
              {actionBtn.label}
            </Button>
          ))}
        </div>
      ) : (
        /* Regular Action Buttons - Only shown when no rows are selected */
        actionButtons &&
        actionButtons.length > 0 && (
          <div className="flex items-center gap-2">
            {actionButtons.map((actionBtn, index) => (
              <Button
                key={index}
                variant={actionBtn.variant || 'default'}
                size={actionBtn.size || 'sm'}
                onClick={actionBtn.onClick}
                disabled={actionBtn.disabled || isLoading}
                className={actionBtn.className}
                aria-label={actionBtn.label}
              >
                {actionBtn.icon && (
                  <span className="mr-2" aria-hidden="true">
                    {actionBtn.icon}
                  </span>
                )}
                {actionBtn.label}
              </Button>
            ))}
          </div>
        )
      )}
    </div>
  );

  // Error state
  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-4">
        <div className="flex flex-col items-center justify-center space-y-2 text-destructive">
          <p className="text-sm font-medium">
            {t('errors.errorLoadingTableData')}
          </p>
          <p className="text-xs">
            {error.message || t('common.unexpectedError')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header with Tabs, Search, and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left side: Tabs or Title */}
        {tabs && tabs.length > 0 ? (
          <Tabs
            defaultValue={activeTab || tabs[0].value}
            onValueChange={handleTabChange}
            className="w-auto"
          >
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          title &&
          !hasSelectedRows && (
            <div className="leading-none font-semibold">{title}</div>
          )
        )}

        {/* Right side: Search and actions */}
        <div className="sm:ml-auto">{searchAndActions}</div>
      </div>

      {/* Table Content */}
      <div className="rounded-md border overflow-x-auto">
        <Table role="table" aria-label="Data table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                    <p className="text-sm text-muted-foreground">
                      {t('common.loading')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={
                    onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined
                  }
                  onClick={(e) => handleTableRowClick(e, row)}
                  aria-selected={row.getIsSelected()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <p className="text-sm">{t('table.noResults')}.</p>
                    {globalFilter && (
                      <p className="text-xs">{t('table.tryAdjusting')}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && <DataTablePagination table={table} />}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  actionButtons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.string,
      size: PropTypes.string,
      disabled: PropTypes.bool,
      className: PropTypes.string,
      icon: PropTypes.node,
    })
  ),
  bulkActionButtons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.string,
      size: PropTypes.string,
      disabled: PropTypes.bool,
      className: PropTypes.string,
      icon: PropTypes.node,
    })
  ),
  onRowClick: PropTypes.func,
  isLoading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  tableKey: PropTypes.string,
  title: PropTypes.string,
};
