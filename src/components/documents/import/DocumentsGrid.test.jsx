import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import DocumentsGrid from './DocumentsGrid';

// Mock Firebase storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  getDownloadURL: vi.fn(() => Promise.resolve('https://test-url.com')),
}));

// Mock Checkbox component
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, onClick }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      onClick={onClick}
      data-testid="checkbox"
      aria-label="Select document"
    />
  ),
}));

describe('DocumentsGrid', () => {
  const mockOnSelectItem = vi.fn();
  const mockIsItemSelected = vi.fn();

  const mockDocuments = [
    {
      id: 'doc-1',
      title: 'Welding Procedure Specification',
      storageRef: 'path/to/doc1.pdf',
      thumbStorageRef: 'path/to/thumb1.jpg',
    },
    {
      id: 'doc-2',
      title: 'Quality Control Manual',
      storageRef: 'path/to/doc2.pdf',
      thumbStorageRef: null,
    },
  ];

  const mockThumbnails = {
    'doc-1': 'https://thumb1.jpg',
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows user to select multiple documents for import', () => {
    mockIsItemSelected
      .mockReturnValueOnce(false) // doc-1 not selected initially
      .mockReturnValueOnce(false) // doc-2 not selected initially
      .mockReturnValueOnce(true) // doc-1 selected after click
      .mockReturnValueOnce(false); // doc-2 still not selected

    const { rerender } = renderWithProviders(
      <DocumentsGrid
        documents={mockDocuments}
        thumbnails={mockThumbnails}
        mode="document"
        onSelectItem={mockOnSelectItem}
        isItemSelected={mockIsItemSelected}
      />
    );

    // User sees both documents with their titles
    expect(
      screen.getByText('Welding Procedure Specification')
    ).toBeInTheDocument();
    expect(screen.getByText('Quality Control Manual')).toBeInTheDocument();

    // User clicks on first document to select it
    const firstDoc = screen
      .getByText('Welding Procedure Specification')
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstDoc);

    // System should register the selection
    expect(mockOnSelectItem).toHaveBeenCalledWith(mockDocuments[0], 'document');

    // After rerender, selected document should be visually distinct
    rerender(
      <DocumentsGrid
        documents={mockDocuments}
        thumbnails={mockThumbnails}
        mode="document"
        onSelectItem={mockOnSelectItem}
        isItemSelected={mockIsItemSelected}
      />
    );

    // Selected document should have visual indicator (border/ring)
    const selectedDoc = screen
      .getByText('Welding Procedure Specification')
      .closest('div[class*="cursor-pointer"]');
    expect(selectedDoc).toHaveClass('border-primary', 'ring-1', 'ring-primary');
  });

  it('shows document preview thumbnails to help user identify documents', () => {
    mockIsItemSelected.mockReturnValue(false);

    renderWithProviders(
      <DocumentsGrid
        documents={mockDocuments}
        thumbnails={mockThumbnails}
        mode="document"
        onSelectItem={mockOnSelectItem}
        isItemSelected={mockIsItemSelected}
      />
    );

    // User sees thumbnail for first document
    const thumbnail = screen.getByRole('img', { hidden: true });
    expect(thumbnail).toHaveAttribute('src', 'https://thumb1.jpg');
    expect(thumbnail).toHaveAttribute('alt', 'Welding Procedure Specification');

    // User sees placeholder icon for document without thumbnail
    // (FileIcon is rendered but not as an img element)
    const docWithoutThumb = screen
      .getByText('Quality Control Manual')
      .closest('div[class*="cursor-pointer"]');
    expect(docWithoutThumb).toBeInTheDocument();
  });

  it('allows user to preview full document by clicking thumbnail', async () => {
    mockIsItemSelected.mockReturnValue(false);
    const mockOpen = vi.fn();
    global.window.open = mockOpen;

    renderWithProviders(
      <DocumentsGrid
        documents={mockDocuments}
        thumbnails={mockThumbnails}
        mode="document"
        onSelectItem={mockOnSelectItem}
        isItemSelected={mockIsItemSelected}
      />
    );

    // User clicks on thumbnail to preview document
    const thumbnail = screen.getByRole('img', { hidden: true });
    fireEvent.click(thumbnail);

    // Should open document in new tab
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith('https://test-url.com', '_blank');
    });
  });

  it('prevents document selection when in section-only mode', () => {
    renderWithProviders(
      <DocumentsGrid
        documents={mockDocuments}
        thumbnails={mockThumbnails}
        mode="section"
        onSelectItem={mockOnSelectItem}
        isItemSelected={mockIsItemSelected}
      />
    );

    // User sees explanation that documents cannot be selected
    expect(
      screen.getByText(
        (content) =>
          content.includes('cannot select documents') ||
          content.includes('Section mode') ||
          content === 'documents.cannotSelectDocumentsInSectionMode'
      )
    ).toBeInTheDocument();

    // Documents should not be displayed
    expect(
      screen.queryByText('Welding Procedure Specification')
    ).not.toBeInTheDocument();
  });

  it('shows helpful message when no documents are available', () => {
    renderWithProviders(
      <DocumentsGrid
        documents={[]}
        thumbnails={{}}
        mode="document"
        onSelectItem={mockOnSelectItem}
        isItemSelected={mockIsItemSelected}
      />
    );

    // User sees clear message about no documents
    expect(
      screen.getByText(
        (content) =>
          content.includes('No documents found') ||
          content.includes('documents.noDocumentsFound')
      )
    ).toBeInTheDocument();

    // No selection UI should be present
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('allows user to toggle document selection with checkbox', () => {
    mockIsItemSelected.mockReturnValue(false);

    renderWithProviders(
      <DocumentsGrid
        documents={[mockDocuments[0]]}
        thumbnails={mockThumbnails}
        mode="document"
        onSelectItem={mockOnSelectItem}
        isItemSelected={mockIsItemSelected}
      />
    );

    // User can use checkbox to select document
    const checkbox = screen.getByRole('checkbox', { hidden: true });
    fireEvent.click(checkbox);

    // Should trigger selection without navigating
    expect(mockOnSelectItem).toHaveBeenCalledWith(mockDocuments[0], 'document');
  });

  it('displays documents in responsive grid layout', () => {
    mockIsItemSelected.mockReturnValue(false);

    const { container } = renderWithProviders(
      <DocumentsGrid
        documents={mockDocuments}
        thumbnails={mockThumbnails}
        mode="document"
        onSelectItem={mockOnSelectItem}
        isItemSelected={mockIsItemSelected}
      />
    );

    // Grid should be responsive with different column counts
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass(
      'grid-cols-3',
      'md:grid-cols-4',
      'lg:grid-cols-5',
      'xl:grid-cols-6'
    );
  });
});
