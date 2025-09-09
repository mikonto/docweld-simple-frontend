import * as React from 'react';
import { X, ChevronsUpDown, Check, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

/**
 * Multi-select combobox component with support for "Add new" option
 *
 * @param {Array} options - Array of {value, label} objects
 * @param {Array} value - Array of selected values
 * @param {Function} onValueChange - Callback when selection changes
 * @param {string} placeholder - Placeholder text when no items selected
 * @param {string} emptyText - Text shown when no options match search
 * @param {string} searchPlaceholder - Placeholder for search input
 * @param {string} className - Additional CSS classes
 * @param {boolean} showAddNew - Whether to show "Add new" option
 * @param {Function} onAddNew - Callback when "Add new" is clicked
 * @param {string} addNewLabel - Label for "Add new" button
 */
export function MultiCombobox({
  options = [],
  value,
  onValueChange,
  placeholder,
  emptyText,
  searchPlaceholder,
  className,
  showAddNew = false,
  onAddNew,
  addNewLabel,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Ensure value is always an array
  const safeValue = value || [];

  // Use provided text or fall back to translations
  const placeholderText = placeholder || t('common.selectOptions');
  const emptyMessage = emptyText || t('common.noOptionsFound');
  const searchText = searchPlaceholder || t('common.search');
  const addNewText = addNewLabel || t('common.addNewItem');

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  // Handle removing a selected item
  const handleRemove = (itemValue) => {
    onValueChange(safeValue.filter((v) => v !== itemValue));
  };

  // Handle selecting an item
  const handleSelect = (selectedValue) => {
    if (selectedValue === 'add-new') {
      if (onAddNew) {
        onAddNew();
      }
      return;
    }

    // Toggle selection
    if (safeValue.includes(selectedValue)) {
      onValueChange(safeValue.filter((v) => v !== selectedValue));
    } else {
      onValueChange([...safeValue, selectedValue]);
    }

    // Close the popover after selection
    setOpen(false);
  };

  // Get display label for a value
  const getDisplayLabel = (itemValue) => {
    const option = options.find((o) => o.value === itemValue);
    return option ? option.label : itemValue;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={placeholderText}
          className={cn(
            'min-h-10 w-full justify-between',
            safeValue.length > 0 ? 'h-auto' : '',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {safeValue.length === 0 && (
              <span className="text-muted-foreground">{placeholderText}</span>
            )}
            {safeValue.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-0"
              >
                {getDisplayLabel(item)}
                <div
                  role="button"
                  aria-label={t('common.removeItem', {
                    item: getDisplayLabel(item),
                  })}
                  tabIndex={0}
                  className="ml-1 rounded-full ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      handleRemove(item);
                    }
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </div>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchText} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {showAddNew && (
              <>
                <CommandItem
                  value="add-new"
                  onSelect={() => handleSelect('add-new')}
                  className="cursor-pointer text-primary hover:bg-primary-foreground/10"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addNewText}
                </CommandItem>
                <CommandSeparator />
              </>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      safeValue.includes(option.value)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

MultiCombobox.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  value: PropTypes.array,
  onValueChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  emptyText: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  className: PropTypes.string,
  showAddNew: PropTypes.bool,
  onAddNew: PropTypes.func,
  addNewLabel: PropTypes.string,
};
