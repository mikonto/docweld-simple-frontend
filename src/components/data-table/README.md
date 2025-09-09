# Data Table Component

A ready-to-use, customizable data table component for React applications.

## Features

- 📊 Sortable columns
- 🔍 Global search
- 📑 Pagination
- ✅ Row selection with checkboxes
- 📂 Filtering tabs
- 🔘 Custom action buttons
- 📝 Row action menus
- 🔗 Row click navigation
- 🗑️ Bulk actions for selected rows
- 🎨 Shadcn/ui styling
- 🔄 Loading states

## Quick Start

```jsx
import { DataTable } from '@/components/data-table/DataTable';
import { createColumns } from '@/components/data-table/ColumnDef';
import { DataTableColumnHeader } from '@/components/data-table/Columns';

// Step 1: Define your base columns
const baseColumns = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('title')}</div>
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
  },
];

// Step 2: Create the full column configuration
const columns = createColumns({
  enableSelection: true, // Include checkboxes
  enableRowActions: true, // Include row actions menu
  columns: baseColumns, // Your data columns
});

// Step 3: Your component with the DataTable
function MyTable() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <DataTable
        columns={columns}
        data={myData}
        loading={false} // Show loading state
      />
    </div>
  );
}
```

## Adding Tabs

Add filtering tabs at the top of your table:

```jsx
// Define your tabs
const tabs = [
  { value: 'all', label: 'All Items' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

// Handle tab changes
function handleTabChange(value) {
  setActiveTab(value);
  // Filter your data based on the tab
}

// Use in your DataTable
<DataTable
  columns={columns}
  data={data}
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={handleTabChange}
/>;
```

For better user experience, changing tabs automatically resets any active row selections. This follows standard behavior in data tables, as selections typically shouldn't persist when switching between different data views.

## Adding Action Buttons

Add action buttons at the top-right of your table:

```jsx
import { Plus } from 'lucide-react';

// Define your action buttons
const actionButtons = [
  {
    label: 'Add New',
    icon: <Plus className="h-4 w-4" />,
    onClick: () => {
      // Handle new item creation
    },
    variant: 'default', // "default", "outline", "ghost", etc.
  },
];

// Use in your DataTable
<DataTable columns={columns} data={data} actionButtons={actionButtons} />;
```

## Customizing Row Actions

Customize the dropdown menu that appears for each row:

```jsx
// Define custom row actions
const rowMenuItems = [
  {
    label: 'View details',
    action: (rowData) => {
      // Handle view action
      console.log('View:', rowData);
    },
  },
  { separator: true }, // Add a separator line
  {
    label: 'Edit',
    action: (rowData) => {
      // Handle edit action
      console.log('Edit:', rowData);
    },
  },
];

// Create columns with custom row actions
const columns = createColumns({
  enableSelection: true,
  enableRowActions: true,
  rowMenuItems: rowMenuItems, // Your custom actions
  columns: baseColumns,
});
```

## Row Click Navigation

Enable navigation when clicking on a row:

```jsx
// Handle row click navigation
const handleRowClick = (rowData) => {
  console.log('Clicked on row:', rowData);
  // Navigate to detail page
  // router.push(`/items/${rowData.id}`);
};

// Use in your DataTable
<DataTable columns={columns} data={data} onRowClick={handleRowClick} />;
```

When `onRowClick` is provided, rows will show a pointer cursor on hover and trigger the callback when clicked.

## Bulk Actions

Add actions that appear when rows are selected:

```jsx
import { Download, Share } from 'lucide-react';

// Define bulk action buttons
const bulkActionButtons = [
  {
    label: 'Export Selected',
    icon: <Download className="h-4 w-4" />,
    onClick: (selectedRows) => {
      console.log('Export selected items:', selectedRows);
      // Handle bulk export
    },
    variant: 'default',
  },
  {
    label: 'Share Selected',
    icon: <Share className="h-4 w-4" />,
    onClick: (selectedRows) => {
      console.log('Share selected items:', selectedRows);
      // Handle bulk sharing
    },
    variant: 'outline',
  },
];

// Use in your DataTable
<DataTable
  columns={columns}
  data={data}
  bulkActionButtons={bulkActionButtons}
/>;
```

When rows are selected via checkboxes, the bulk action buttons will appear in the top-right area of the table, replacing the regular action buttons. For a cleaner interface focused on bulk operations, the search field is also hidden during this state. The buttons receive an array of the selected row data as a parameter. After a bulk action is performed, the row selections are automatically cleared to maintain a clean state for the next operation.

## Complete Example

Here's a complete example showing all features:

```jsx
import React, { useState } from 'react';
import { Plus, Download, Share } from 'lucide-react';
import { DataTable } from '@/components/data-table/DataTable';
import { createColumns } from '@/components/data-table/ColumnDef';
import { DataTableColumnHeader } from '@/components/data-table/Columns';

export default function DataTableExample() {
  const [activeTab, setActiveTab] = useState('all');

  // Data columns
  const baseColumns = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
    },
  ];

  // Row actions menu items
  const rowMenuItems = [
    {
      label: 'View details',
      action: (rowData) => console.log('View', rowData),
    },
    { separator: true },
    { label: 'Edit', action: (rowData) => console.log('Edit', rowData) },
  ];

  // Tabs for filtering
  const tabs = [
    { value: 'all', label: 'All Items' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  // Action buttons
  const actionButtons = [
    {
      label: 'Add New',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => console.log('Create new item'),
      variant: 'default',
    },
  ];

  // Bulk action buttons
  const bulkActionButtons = [
    {
      label: 'Export Selected',
      icon: <Download className="h-4 w-4" />,
      onClick: (selectedRows) => console.log('Export:', selectedRows),
      variant: 'default',
    },
    {
      label: 'Share Selected',
      icon: <Share className="h-4 w-4" />,
      onClick: (selectedRows) => console.log('Share:', selectedRows),
      variant: 'outline',
    },
  ];

  // Generate columns with all features
  const columns = createColumns({
    enableSelection: true,
    enableRowActions: true,
    rowMenuItems: rowMenuItems,
    columns: baseColumns,
  });

  // Handle tab changes
  function handleTabChange(value) {
    setActiveTab(value);
    // Filter data based on selected tab
  }

  // Handle row click for navigation
  const handleRowClick = (rowData) => {
    console.log(`Navigating to item: ${rowData.title}`);
    // router.push(`/items/${rowData.id}`);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <DataTable
        columns={columns}
        data={data}
        loading={false}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        actionButtons={actionButtons}
        bulkActionButtons={bulkActionButtons}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
```
