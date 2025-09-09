import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import ImportBrowser from './ImportBrowser';

// Mock Firebase to prevent actual database calls
vi.mock('@/config/firebase', () => ({
  db: {},
  storage: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: 'col-1',
          data: () => ({ name: 'Technical Standards' }),
        },
      ],
    })
  ),
}));

// Mock child components with minimal functionality for integration testing
vi.mock('./CollectionsList', () => ({
  default: ({ collections, onCollectionClick }) => (
    <div data-testid="collections-list">
      {collections.map((col) => (
        <button
          key={col.id}
          onClick={() => onCollectionClick(col)}
          data-testid={`collection-${col.id}`}
        >
          {col.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./SectionsList', () => ({
  default: ({ sections, onSectionClick, onSelectItem, mode }) => (
    <div data-testid="sections-list">
      {sections.map((sec) => (
        <div key={sec.id}>
          <button
            onClick={() =>
              mode === 'document'
                ? onSectionClick(sec)
                : onSelectItem(sec, 'section')
            }
            data-testid={`section-${sec.id}`}
          >
            {sec.name}
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./DocumentsGrid', () => ({
  default: ({ documents, onSelectItem }) => (
    <div data-testid="documents-grid">
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onSelectItem(doc, 'document')}
          data-testid={`document-${doc.id}`}
        >
          {doc.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./BrowserBreadcrumb', () => ({
  default: ({ currentView, selectedCollection, selectedSection }) => (
    <div data-testid="breadcrumb">
      <span data-testid="current-view">{currentView}</span>
      {selectedCollection && <span>{selectedCollection.name}</span>}
      {selectedSection && <span>{selectedSection.name}</span>}
    </div>
  ),
}));

vi.mock('./SelectionToolbar', () => ({
  default: () => null, // Simplified for integration test
}));

vi.mock('./ImportFooter', () => ({
  default: ({ selectedItems, onCancel, onSubmit }) => (
    <div data-testid="import-footer">
      <span data-testid="selection-count">{selectedItems.length} selected</span>
      <button onClick={onCancel} data-testid="cancel-button">
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={selectedItems.length === 0}
        data-testid="submit-button"
      >
        Import
      </button>
    </div>
  ),
}));

// Mock hooks to provide controlled state
let mockState = {
  collections: [],
  selectedCollection: null,
  selectedSection: null,
  sections: [],
  documents: [],
  thumbnails: {},
  isLoading: false,
  currentView: 'collections',
};

let mockSelectedItems = [];
let mockDispatch = vi.fn();

vi.mock('@/hooks/documents/useImportBrowser', () => ({
  default: () => ({
    state: mockState,
    dispatch: mockDispatch,
    ACTIONS: {
      SET_VIEW: 'SET_VIEW',
      SET_SELECTED_COLLECTION: 'SET_SELECTED_COLLECTION',
      SET_SELECTED_SECTION: 'SET_SELECTED_SECTION',
      SET_SECTIONS: 'SET_SECTIONS',
      SET_DOCUMENTS: 'SET_DOCUMENTS',
      CLEAR_SELECTION: 'CLEAR_SELECTION',
      RESET_FOR_SOURCE_CHANGE: 'RESET_FOR_SOURCE_CHANGE',
      RESET_SECTIONS_AND_DOCUMENTS: 'RESET_SECTIONS_AND_DOCUMENTS',
    },
  }),
}));

vi.mock('@/hooks/documents/useImportDataFetching', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/documents/useImportSelection', () => ({
  default: () => ({
    handleSelectItem: (item, type) => {
      mockSelectedItems = [...mockSelectedItems, { ...item, type }];
    },
    isItemSelected: vi.fn(),
    areAllItemsSelected: vi.fn(),
    toggleAllItems: vi.fn(),
    clearSelection: () => {
      mockSelectedItems = [];
    },
    selectedItems: mockSelectedItems,
  }),
}));

describe('ImportBrowser', () => {
  const mockOnSelectItems = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    // Reset mocks and state before each test
    vi.clearAllMocks();
    mockSelectedItems = [];
    mockState = {
      collections: [
        { id: 'col-1', name: 'Technical Standards' },
        { id: 'col-2', name: 'Quality Documents' },
      ],
      selectedCollection: null,
      selectedSection: null,
      sections: [],
      documents: [],
      thumbnails: {},
      isLoading: false,
      currentView: 'collections',
    };
  });

  it('allows user to navigate through document hierarchy and select items', async () => {
    // Start with collections view
    const { rerender } = renderWithProviders(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
        mode="document"
      />
    );

    // User sees collections
    expect(screen.getByTestId('collections-list')).toBeInTheDocument();
    expect(screen.getByText('Technical Standards')).toBeInTheDocument();
    expect(screen.getByText('Quality Documents')).toBeInTheDocument();

    // User clicks a collection
    fireEvent.click(screen.getByTestId('collection-col-1'));

    // Should dispatch navigation to sections
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SELECTED_COLLECTION',
      payload: { id: 'col-1', name: 'Technical Standards' },
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_VIEW',
      payload: 'sections',
    });

    // Simulate state update to sections view
    mockState = {
      ...mockState,
      currentView: 'sections',
      selectedCollection: { id: 'col-1', name: 'Technical Standards' },
      sections: [
        { id: 'sec-1', name: 'Welding Procedures' },
        { id: 'sec-2', name: 'Testing Standards' },
      ],
    };

    rerender(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
        mode="document"
      />
    );

    // User now sees sections
    expect(screen.getByTestId('sections-list')).toBeInTheDocument();
    expect(screen.getByText('Welding Procedures')).toBeInTheDocument();

    // User clicks a section to view documents
    fireEvent.click(screen.getByTestId('section-sec-1'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SELECTED_SECTION',
      payload: { id: 'sec-1', name: 'Welding Procedures' },
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_VIEW',
      payload: 'documents',
    });
  });

  it('prevents import when no items are selected', () => {
    renderWithProviders(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
      />
    );

    // User sees import button is disabled
    const importButton = screen.getByTestId('submit-button');
    expect(importButton).toBeDisabled();

    // User tries to click import
    fireEvent.click(importButton);

    // Should not call onSelectItems
    expect(mockOnSelectItems).not.toHaveBeenCalled();
  });

  it('allows user to cancel and close the browser', () => {
    renderWithProviders(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
      />
    );

    // User clicks cancel
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    // Should call onCancel
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state while fetching data', () => {
    mockState = {
      ...mockState,
      isLoading: true,
    };

    const { container } = renderWithProviders(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
      />
    );

    // User sees loading indicator
    const loadingContainer = container.querySelector(
      '.flex.items-center.justify-center.py-8'
    );
    expect(loadingContainer).toBeInTheDocument();
  });

  it('handles project library source differently than document library', () => {
    renderWithProviders(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
        sourceType="projectLibrary"
        projectId="proj-123"
      />
    );

    // Should set up for project library navigation
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'RESET_SECTIONS_AND_DOCUMENTS',
    });
  });

  it('allows section-only selection mode', () => {
    mockState = {
      ...mockState,
      currentView: 'sections',
      selectedCollection: { id: 'col-1', name: 'Technical Standards' },
      sections: [{ id: 'sec-1', name: 'Welding Procedures' }],
    };

    renderWithProviders(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
        mode="section" // Section-only mode
      />
    );

    // User can select sections directly
    expect(screen.getByTestId('sections-list')).toBeInTheDocument();
    expect(screen.getByText('Welding Procedures')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation showing current location', () => {
    mockState = {
      ...mockState,
      currentView: 'sections',
      selectedCollection: { id: 'col-1', name: 'Technical Standards' },
    };

    renderWithProviders(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
      />
    );

    // User sees breadcrumb with current location
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    expect(screen.getByText('Technical Standards')).toBeInTheDocument();
    expect(screen.getByTestId('current-view')).toHaveTextContent('sections');
  });

  it('maintains scroll position and provides good UX for long lists', () => {
    const { container } = renderWithProviders(
      <ImportBrowser
        onSelectItems={mockOnSelectItems}
        onCancel={mockOnCancel}
      />
    );

    // Should have scroll area for long content
    const scrollArea = container.querySelector('.overflow-hidden');
    expect(scrollArea).toBeInTheDocument();

    // Should have container with constraints
    const mainContainer = container.querySelector('.bg-muted\\/30');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveStyle({ maxHeight: '550px' });
  });
});
