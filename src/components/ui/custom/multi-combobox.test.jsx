import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MultiCombobox } from './multi-combobox';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (key === 'common.removeItem' && params?.item) {
        return `Remove ${params.item}`;
      }
      return key;
    },
  }),
}));

// Mock scrollIntoView which is used by cmdk but not available in jsdom
Element.prototype.scrollIntoView = vi.fn();

describe('MultiCombobox', () => {
  const mockOnValueChange = vi.fn();
  const mockOnAddNew = vi.fn();

  const defaultProps = {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    value: [],
    onValueChange: mockOnValueChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render with default placeholder', () => {
      render(<MultiCombobox {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('common.selectOptions')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <MultiCombobox {...defaultProps} placeholder="Select materials" />
      );
      expect(screen.getByText('Select materials')).toBeInTheDocument();
    });

    it('should display selected values as badges', () => {
      const props = {
        ...defaultProps,
        value: ['option1', 'option2'],
      };
      render(<MultiCombobox {...props} />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  // Interaction Tests
  describe('Selection behavior', () => {
    it('should open dropdown when clicked', async () => {
      render(<MultiCombobox {...defaultProps} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);

      expect(screen.getByPlaceholderText('common.search')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should select an option when clicked', async () => {
      render(<MultiCombobox {...defaultProps} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);
      const option = screen.getByText('Option 1');
      await userEvent.click(option);

      expect(mockOnValueChange).toHaveBeenCalledWith(['option1']);
    });

    it('should deselect an already selected option', async () => {
      const props = {
        ...defaultProps,
        value: ['option1'],
      };
      render(<MultiCombobox {...props} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);
      // Use getAllByText since Option 1 appears both in badge and dropdown
      const options = screen.getAllByText('Option 1');
      // Click the one in the dropdown (should be the second one)
      const dropdownOption = options.find((el) =>
        el.closest('[role="option"]')
      );
      await userEvent.click(dropdownOption);

      expect(mockOnValueChange).toHaveBeenCalledWith([]);
    });

    it('should select multiple options', async () => {
      const { rerender } = render(<MultiCombobox {...defaultProps} />);
      const trigger = screen.getByRole('combobox');

      // First selection
      await userEvent.click(trigger);
      await userEvent.click(screen.getByText('Option 1'));
      expect(mockOnValueChange).toHaveBeenCalledWith(['option1']);

      // Clear mock and update props to reflect the change
      mockOnValueChange.mockClear();
      rerender(<MultiCombobox {...defaultProps} value={['option1']} />);

      // Second selection
      await userEvent.click(trigger);
      await userEvent.click(screen.getByText('Option 2'));
      expect(mockOnValueChange).toHaveBeenCalledWith(['option1', 'option2']);
    });
  });

  // Badge Removal Tests
  describe('Badge removal', () => {
    it('should remove item when X is clicked on badge', async () => {
      const props = {
        ...defaultProps,
        value: ['option1', 'option2'],
      };
      render(<MultiCombobox {...props} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      await userEvent.click(removeButtons[0]);

      expect(mockOnValueChange).toHaveBeenCalledWith(['option2']);
    });

    it('should remove item when Enter is pressed on remove button', async () => {
      const props = {
        ...defaultProps,
        value: ['option1'],
      };
      render(<MultiCombobox {...props} />);

      const removeButton = screen.getByRole('button', {
        name: /Remove Option 1/i,
      });
      removeButton.focus();
      fireEvent.keyDown(removeButton, { key: 'Enter' });

      expect(mockOnValueChange).toHaveBeenCalledWith([]);
    });
  });

  // Search Functionality Tests
  describe('Search functionality', () => {
    it('should filter options based on search input', async () => {
      render(<MultiCombobox {...defaultProps} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);
      const searchInput = screen.getByPlaceholderText('common.search');

      await userEvent.type(searchInput, '1');

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
    });

    it('should show empty message when no options match', async () => {
      render(<MultiCombobox {...defaultProps} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);
      const searchInput = screen.getByPlaceholderText('common.search');

      await userEvent.type(searchInput, 'xyz');

      expect(screen.getByText('common.noOptionsFound')).toBeInTheDocument();
    });

    it('should use custom empty text', async () => {
      render(
        <MultiCombobox {...defaultProps} emptyText="No materials found" />
      );
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);
      const searchInput = screen.getByPlaceholderText('common.search');

      await userEvent.type(searchInput, 'xyz');

      expect(screen.getByText('No materials found')).toBeInTheDocument();
    });
  });

  // Add New Functionality Tests
  describe('Add new functionality', () => {
    it('should show add new option when enabled', async () => {
      const props = {
        ...defaultProps,
        showAddNew: true,
        onAddNew: mockOnAddNew,
      };
      render(<MultiCombobox {...props} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);

      expect(screen.getByText('common.addNewItem')).toBeInTheDocument();
    });

    it('should use custom add new label', async () => {
      const props = {
        ...defaultProps,
        showAddNew: true,
        onAddNew: mockOnAddNew,
        addNewLabel: 'Add new material',
      };
      render(<MultiCombobox {...props} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);

      expect(screen.getByText('Add new material')).toBeInTheDocument();
    });

    it('should call onAddNew when add new is clicked', async () => {
      const props = {
        ...defaultProps,
        showAddNew: true,
        onAddNew: mockOnAddNew,
      };
      render(<MultiCombobox {...props} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);
      const addNewButton = screen.getByText('common.addNewItem');
      await userEvent.click(addNewButton);

      expect(mockOnAddNew).toHaveBeenCalled();
    });

    it('should not show add new when showAddNew is false', async () => {
      render(<MultiCombobox {...defaultProps} showAddNew={false} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);

      expect(screen.queryByText('common.addNewItem')).not.toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<MultiCombobox {...defaultProps} />);
      const trigger = screen.getByRole('combobox');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should update aria-expanded when opened', async () => {
      render(<MultiCombobox {...defaultProps} />);
      const trigger = screen.getByRole('combobox');

      await userEvent.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper aria-label on remove buttons', () => {
      const props = {
        ...defaultProps,
        value: ['option1'],
      };
      render(<MultiCombobox {...props} />);

      const removeButton = screen.getByRole('button', {
        name: /Remove Option 1/i,
      });
      expect(removeButton).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge cases', () => {
    it('should handle empty options array', () => {
      const props = {
        ...defaultProps,
        options: [],
      };
      render(<MultiCombobox {...props} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle null value prop', () => {
      const props = {
        ...defaultProps,
        value: null,
      };
      // Should default to empty array internally
      render(<MultiCombobox {...props} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('common.selectOptions')).toBeInTheDocument();
    });

    it('should display value even if not in options', () => {
      const props = {
        ...defaultProps,
        value: ['unknown-value'],
      };
      render(<MultiCombobox {...props} />);

      // Should show the raw value if no matching option
      expect(screen.getByText('unknown-value')).toBeInTheDocument();
    });
  });
});
