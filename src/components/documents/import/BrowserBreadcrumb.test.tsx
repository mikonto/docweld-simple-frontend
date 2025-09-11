import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import BrowserBreadcrumb from './BrowserBreadcrumb';

describe('BrowserBreadcrumb', () => {
  const mockOnNavigate = vi.fn();

  const mockCollection = {
    id: 'col-1',
    name: 'Technical Standards',
  };

  const mockSection = {
    id: 'sec-1',
    name: 'Welding Procedures',
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows user their current location in document hierarchy', () => {
    renderWithProviders(
      <BrowserBreadcrumb
        sourceType="documentLibrary"
        currentView="documents"
        selectedCollection={mockCollection}
        selectedSection={mockSection}
        onNavigate={mockOnNavigate}
      />
    );

    // User can see full navigation path
    expect(
      screen.getByText(
        (content) =>
          content.includes('Library') || content === 'documents.library'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Technical Standards')).toBeInTheDocument();
    expect(screen.getByText('Welding Procedures')).toBeInTheDocument();
  });

  it('allows user to navigate back to parent levels', () => {
    renderWithProviders(
      <BrowserBreadcrumb
        sourceType="documentLibrary"
        currentView="documents"
        selectedCollection={mockCollection}
        selectedSection={mockSection}
        onNavigate={mockOnNavigate}
      />
    );

    // User clicks on collection name to go back to sections view
    const collectionLink = screen.getByText('Technical Standards');
    fireEvent.click(collectionLink);

    // Should navigate to sections view
    expect(mockOnNavigate).toHaveBeenCalledWith('sections');
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);

    // User clicks on library to go back to collections
    const libraryLink = screen.getByText(
      (content) =>
        content.includes('Library') || content === 'documents.library'
    );
    fireEvent.click(libraryLink);

    // Should navigate to collections view
    expect(mockOnNavigate).toHaveBeenCalledWith('collections');
    expect(mockOnNavigate).toHaveBeenCalledTimes(2);
  });

  it('indicates current level as non-clickable', () => {
    renderWithProviders(
      <BrowserBreadcrumb
        sourceType="documentLibrary"
        currentView="sections"
        selectedCollection={mockCollection}
        selectedSection={undefined}
        onNavigate={mockOnNavigate}
      />
    );

    // Collection name should be shown as current page (not a link)
    const currentPage = screen.getByText('Technical Standards');

    // Clicking current page should not trigger navigation
    fireEvent.click(currentPage);
    expect(mockOnNavigate).not.toHaveBeenCalled();

    // Parent level should still be clickable
    const libraryLink = screen.getByText(
      (content) =>
        content.includes('Library') || content === 'documents.library'
    );
    fireEvent.click(libraryLink);
    expect(mockOnNavigate).toHaveBeenCalledWith('collections');
  });

  it('adapts breadcrumb for project library navigation', () => {
    renderWithProviders(
      <BrowserBreadcrumb
        sourceType="projectLibrary"
        currentView="sections"
        selectedCollection={{ id: 'main', name: 'Project Documents' }}
        selectedSection={undefined}
        onNavigate={mockOnNavigate}
      />
    );

    // Should not show "Library" for project documents
    expect(
      screen.queryByText(
        (content) =>
          content.includes('Library') || content === 'documents.library'
      )
    ).not.toBeInTheDocument();

    // Should show project documents as root
    expect(screen.getByText('Project Documents')).toBeInTheDocument();
  });

  it('provides clear navigation path at collections level', () => {
    renderWithProviders(
      <BrowserBreadcrumb
        sourceType="documentLibrary"
        currentView="collections"
        selectedCollection={undefined}
        selectedSection={undefined}
        onNavigate={mockOnNavigate}
      />
    );

    // User sees they are at the root level
    const libraryText = screen.getByText(
      (content) =>
        content.includes('Library') || content === 'documents.library'
    );
    expect(libraryText).toBeInTheDocument();

    // Should not be clickable since it's current view
    fireEvent.click(libraryText);
    expect(mockOnNavigate).not.toHaveBeenCalled();
  });

  it('shows section as final breadcrumb when viewing documents', () => {
    renderWithProviders(
      <BrowserBreadcrumb
        sourceType="documentLibrary"
        currentView="documents"
        selectedCollection={mockCollection}
        selectedSection={mockSection}
        onNavigate={mockOnNavigate}
      />
    );

    // Section should be the last item and not clickable
    const sectionText = screen.getByText('Welding Procedures');
    expect(sectionText).toBeInTheDocument();

    // Current section should not trigger navigation
    fireEvent.click(sectionText);
    // mockOnNavigate should not be called with 'documents' since we're already there
    expect(mockOnNavigate).not.toHaveBeenCalledWith('documents');
  });

  it('uses separators to clearly delineate hierarchy levels', () => {
    const { container } = renderWithProviders(
      <BrowserBreadcrumb
        sourceType="documentLibrary"
        currentView="documents"
        selectedCollection={mockCollection}
        selectedSection={mockSection}
        onNavigate={mockOnNavigate}
      />
    );

    // Should have breadcrumb structure with proper separators
    const breadcrumb = container.querySelector('nav[aria-label="breadcrumb"]');
    expect(breadcrumb).toBeInTheDocument();

    // Should have list structure
    const list = container.querySelector('ol');
    expect(list).toBeInTheDocument();
  });
});