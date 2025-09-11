import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import SelectionToolbar from './SelectionToolbar';

// Mock Checkbox component
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onCheckedChange?.(true)}
      onClick={() => onCheckedChange?.(true)}
      data-testid="select-all-checkbox"
      aria-label="Select all items"
    />
  ),
}));

describe('SelectionToolbar', () => {
  const mockAreAllItemsSelected = vi.fn();
  const mockToggleAllItems = vi.fn();

  const mockSections = [
    { id: 'sec-1', name: 'Welding Procedures' },
    { id: 'sec-2', name: 'Quality Standards' },
  ];

  const mockDocuments = [
    { id: 'doc-1', title: 'WPS-001' },
    { id: 'doc-2', title: 'WPS-002' },
    { id: 'doc-3', title: 'WPS-003' },
  ];

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('enables bulk selection for efficiency when user has many items', () => {
    mockAreAllItemsSelected.mockReturnValue(false);

    renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[] as any}
        documents={mockDocuments as any}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // User sees select all option when multiple documents available
    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    expect(selectAllCheckbox).toBeInTheDocument();

    // User sees clear label indicating what will be selected
    expect(
      screen.getByText(
        (content) =>
          content.includes('Select all documents') ||
          content === 'documents.selectAllDocuments'
      )
    ).toBeInTheDocument();

    // User clicks to select all documents at once
    fireEvent.click(selectAllCheckbox);

    // System should toggle all documents
    expect(mockToggleAllItems).toHaveBeenCalledWith('document');
  });

  it('allows user to select all sections when importing by section', () => {
    mockAreAllItemsSelected.mockReturnValue(false);

    renderWithProviders(
      <SelectionToolbar
        mode="section"
        currentView="sections"
        sections={mockSections as any}
        documents={[] as any}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // User sees option to select all sections
    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    expect(selectAllCheckbox).toBeInTheDocument();

    // Label clearly indicates sections will be selected
    expect(
      screen.getByText(
        (content) =>
          content.includes('Select all sections') ||
          content === 'documents.selectAllSections'
      )
    ).toBeInTheDocument();

    // User triggers bulk selection
    fireEvent.click(selectAllCheckbox);
    expect(mockToggleAllItems).toHaveBeenCalledWith('section');
  });

  it('shows checked state when all items are already selected', () => {
    mockAreAllItemsSelected.mockReturnValue(true);

    renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[] as any}
        documents={mockDocuments as any}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // User sees checkbox is checked when all selected
    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    expect(selectAllCheckbox).toBeChecked();

    // Clicking again would deselect all
    fireEvent.click(selectAllCheckbox);
    expect(mockToggleAllItems).toHaveBeenCalledWith('document');
  });

  it('hides bulk selection when single selection mode is enforced', () => {
    renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[] as any}
        documents={mockDocuments as any}
        allowMultiple={false} // Single selection only
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // No select all option when multiple selection disabled
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Select All Documents')).not.toBeInTheDocument();
  });

  it('hides toolbar when no items are available to select', () => {
    renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[] as any}
        documents={[] as any} // No documents
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // No toolbar when nothing to select
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Select All Documents')).not.toBeInTheDocument();
  });

  it('only shows in appropriate views where selection makes sense', () => {
    renderWithProviders(
      <SelectionToolbar
        mode="both"
        currentView="collections" // Collections can't be selected
        sections={mockSections as any}
        documents={mockDocuments as any}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // No selection toolbar at collections level
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Select All Sections')).not.toBeInTheDocument();
    expect(screen.queryByText('Select All Documents')).not.toBeInTheDocument();
  });

  it('respects mode restrictions for what can be selected', () => {
    // In section-only mode, viewing documents
    renderWithProviders(
      <SelectionToolbar
        mode="section" // Only sections can be selected
        currentView="documents" // But we're viewing documents
        sections={[] as any}
        documents={mockDocuments as any}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // No select all for documents when in section-only mode
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Select All Documents')).not.toBeInTheDocument();
  });

  it('provides visual feedback for bulk operations', () => {
    mockAreAllItemsSelected
      .mockReturnValueOnce(false) // Initial render
      .mockReturnValueOnce(true); // After selection

    const { rerender } = renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[] as any}
        documents={mockDocuments as any}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // Initially unchecked
    let selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    expect(selectAllCheckbox).not.toBeChecked();

    // After user selects all, checkbox updates
    rerender(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[] as any}
        documents={mockDocuments as any}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    expect(selectAllCheckbox).toBeChecked();
  });
});