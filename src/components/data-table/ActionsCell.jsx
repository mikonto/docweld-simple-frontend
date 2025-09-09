import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Separate component for the actions cell to properly use hooks
export function ActionsCell({ row, rowMenuItems }) {
  // Extract the original data object from the table row
  const rowData = row.original;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()} // Prevent row click when menu button is clicked
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Render each menu item with optional separator */}
          {rowMenuItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.separator && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click when menu item is clicked
                  item.action(rowData); // Execute the menu item's action with row data
                }}
                disabled={item.disabled}
              >
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
