import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import SelectionToolbar from './SelectionToolbar';
import type { Document, Section } from '@/types/database';
import { mockTimestamp } from '@/test/utils/mockTimestamp';

// Mock Checkbox component
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
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

  const mockSections: Section[] = [
    {
      id: 'sec-1',
      name: 'Welding Procedures',
      description: 'Welding procedures documentation',
      projectId: 'proj-1',
      order: 0,
      documentOrder: [],
      status: 'active',
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
      createdBy: 'user-1',
      updatedBy: 'user-1',
    },
    {
      id: 'sec-2',
      name: 'Quality Standards',
      description: 'Quality standards documentation',
      projectId: 'proj-1',
      order: 1,
      documentOrder: [],
      status: 'active',
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
      createdBy: 'user-1',
      updatedBy: 'user-1',
    },
  ];

  const mockDocuments: Document[] = [
    {
      id: 'doc-1',
      title: 'WPS-001',
      fileType: 'pdf',
      fileSize: 1024,
      storageRef: 'documents/doc1.pdf',
      thumbStorageRef: null,
      processingState: 'completed' as const,
      order: 0,
      status: 'active' as const,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
      createdBy: 'user-1',
      updatedBy: 'user-1',
    },
    {
      id: 'doc-2',
      title: 'WPS-002',
      fileType: 'pdf',
      fileSize: 2048,
      storageRef: 'documents/doc2.pdf',
      thumbStorageRef: null,
      processingState: 'completed' as const,
      order: 1,
      status: 'active' as const,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
      createdBy: 'user-1',
      updatedBy: 'user-1',
    },
    {
      id: 'doc-3',
      title: 'WPS-003',
      fileType: 'pdf',
      fileSize: 3072,
      storageRef: 'documents/doc3.pdf',
      thumbStorageRef: null,
      processingState: 'completed' as const,
      order: 2,
      status: 'active' as const,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
      createdBy: 'user-1',
      updatedBy: 'user-1',
    },
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
        sections={[]}
        documents={mockDocuments}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // User sees select all option when multiple documents available
    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    expect(selectAllCheckbox).toBeInTheDocument();

    // User clicks to select all documents at once
    fireEvent.click(selectAllCheckbox);
    expect(mockToggleAllItems).toHaveBeenCalledWith('document');
  });

  it('shows select all for sections when in section mode', () => {
    mockAreAllItemsSelected.mockReturnValue(false);

    renderWithProviders(
      <SelectionToolbar
        mode="section"
        currentView="sections"
        sections={mockSections}
        documents={[]}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    expect(selectAllCheckbox).toBeInTheDocument();

    fireEvent.click(selectAllCheckbox);
    expect(mockToggleAllItems).toHaveBeenCalledWith('section');
  });

  it('shows checked state when all items are selected', () => {
    mockAreAllItemsSelected.mockReturnValue(true);

    renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[]}
        documents={mockDocuments}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    const selectAllCheckbox = screen.getByTestId(
      'select-all-checkbox'
    ) as HTMLInputElement;
    expect(selectAllCheckbox.checked).toBe(true);
  });

  it('hides select all when multiple selection is not allowed', () => {
    renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[]}
        documents={mockDocuments}
        allowMultiple={false}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    const selectAllCheckbox = screen.queryByTestId('select-all-checkbox');
    expect(selectAllCheckbox).not.toBeInTheDocument();
  });

  it('hides select all when no items available', () => {
    renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[]}
        documents={[]} // No documents
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    const selectAllCheckbox = screen.queryByTestId('select-all-checkbox');
    expect(selectAllCheckbox).not.toBeInTheDocument();
  });

  it('supports both section and document selection in both mode', () => {
    mockAreAllItemsSelected.mockReturnValue(false);

    renderWithProviders(
      <SelectionToolbar
        mode="both"
        currentView="documents"
        sections={mockSections}
        documents={mockDocuments}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    expect(selectAllCheckbox).toBeInTheDocument();

    fireEvent.click(selectAllCheckbox);
    expect(mockToggleAllItems).toHaveBeenCalledWith('document');
  });

  it('disables checkbox when in collections view', () => {
    renderWithProviders(
      <SelectionToolbar
        mode="section"
        currentView="collections"
        sections={[]}
        documents={mockDocuments}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    // Should not show checkbox in collections view
    const selectAllCheckbox = screen.queryByTestId('select-all-checkbox');
    expect(selectAllCheckbox).not.toBeInTheDocument();
  });

  it('correctly identifies when in sections view', () => {
    mockAreAllItemsSelected.mockReturnValue(false);

    renderWithProviders(
      <SelectionToolbar
        mode="both"
        currentView="sections"
        sections={mockSections}
        documents={[]}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    fireEvent.click(selectAllCheckbox);

    // Should call with 'section' when in sections view
    expect(mockToggleAllItems).toHaveBeenCalledWith('section');
  });

  it('displays proper label for select all checkbox', () => {
    renderWithProviders(
      <SelectionToolbar
        mode="document"
        currentView="documents"
        sections={[]}
        documents={mockDocuments}
        allowMultiple={true}
        areAllItemsSelected={mockAreAllItemsSelected}
        toggleAllItems={mockToggleAllItems}
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select all items');
    expect(selectAllCheckbox).toBeInTheDocument();
  });
});
