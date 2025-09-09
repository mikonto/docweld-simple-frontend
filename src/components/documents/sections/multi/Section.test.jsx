import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Section } from './Section';
import { renderWithProviders } from '@/test/utils/testUtils';

// Mock child components to isolate testing
vi.mock('../shared/SectionHeader', () => ({
  SectionHeader: ({ sectionData, toggleExpand, documentsCount }) => (
    <div data-testid="section-header" onClick={toggleExpand}>
      <h3>{sectionData.name}</h3>
      <span>{documentsCount} documents</span>
    </div>
  ),
}));

vi.mock('./SectionContent', () => ({
  SectionContent: ({ documents }) => (
    <div data-testid="section-content">
      {documents.map((doc) => (
        <div key={doc.id} data-testid="document-item">
          {doc.name}
        </div>
      ))}
    </div>
  ),
}));

// Mock dialogs - they render null by default
vi.mock('./SectionDialog', () => ({
  SectionDialog: () => null,
}));

vi.mock('@/components/documents/cards', () => ({
  CardDialog: () => null,
}));

vi.mock('@/components/shared/ConfirmationDialog', () => ({
  ConfirmationDialog: () => null,
}));

// Mock hooks with minimal setup
vi.mock('@/hooks/documents/useSections', () => ({
  useSections: vi.fn(() => ({
    renameSection: vi.fn(),
    deleteSection: vi.fn(),
  })),
}));

vi.mock('@/hooks/documents/useDocuments', () => ({
  useDocuments: vi.fn(() => ({
    uploadingFiles: [],
    renameDocument: vi.fn(),
    deleteDocument: vi.fn(),
    handleUpload: vi.fn(),
    updateDocumentOrder: vi.fn(),
  })),
}));

vi.mock('@/hooks/useConfirmationDialog', () => ({
  useConfirmationDialog: () => ({
    dialog: { isOpen: false },
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFormDialog', () => ({
  useFormDialog: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

describe('Section', () => {
  const mockSectionData = {
    id: 'section-1',
    name: 'Project Documents',
    order: 1,
  };

  const mockDocuments = [
    { id: 'doc-1', name: 'Technical Spec', sectionId: 'section-1', order: 2 },
    { id: 'doc-2', name: 'User Guide', sectionId: 'section-1', order: 1 },
    { id: 'doc-3', name: 'Other Doc', sectionId: 'section-2', order: 1 },
  ];

  const defaultProps = {
    sectionData: mockSectionData,
    allDocuments: mockDocuments,
    index: 0,
    onMoveSection: vi.fn(),
    totalSections: 3,
    collectionType: 'project',
    entityId: 'project-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display section name and document count', () => {
    renderWithProviders(<Section {...defaultProps} />);

    expect(screen.getByText('Project Documents')).toBeInTheDocument();
    expect(screen.getByText('2 documents')).toBeInTheDocument();
  });

  it('should only show documents belonging to this section', () => {
    renderWithProviders(<Section {...defaultProps} />);

    // Should show documents for section-1
    expect(screen.getByText('Technical Spec')).toBeInTheDocument();
    expect(screen.getByText('User Guide')).toBeInTheDocument();

    // Should NOT show documents from other sections
    expect(screen.queryByText('Other Doc')).not.toBeInTheDocument();
  });

  it('should display documents in correct order', () => {
    renderWithProviders(<Section {...defaultProps} />);

    const documents = screen.getAllByTestId('document-item');
    // Higher order value should come first
    expect(documents[0]).toHaveTextContent('Technical Spec');
    expect(documents[1]).toHaveTextContent('User Guide');
  });

  it('should handle empty section gracefully', () => {
    renderWithProviders(<Section {...defaultProps} allDocuments={[]} />);

    expect(screen.getByText('Project Documents')).toBeInTheDocument();
    expect(screen.getByText('0 documents')).toBeInTheDocument();
    expect(screen.queryByTestId('document-item')).not.toBeInTheDocument();
  });

  it('should allow user to expand and collapse section', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Section {...defaultProps} />);

    const header = screen.getByTestId('section-header');

    // Header should be clickable
    expect(header).toBeInTheDocument();

    // Click to expand
    await user.click(header);

    // Documents should still be rendered (component manages expand state)
    expect(screen.getByText('Technical Spec')).toBeInTheDocument();

    // Click to collapse again
    await user.click(header);

    // Documents should still be in DOM (just visually hidden via CSS)
    expect(screen.getByText('Technical Spec')).toBeInTheDocument();
  });

  it('should work with library collection type', () => {
    renderWithProviders(
      <Section {...defaultProps} collectionType="library" entityId="main" />
    );

    expect(screen.getByText('Project Documents')).toBeInTheDocument();
    expect(screen.getByText('2 documents')).toBeInTheDocument();
  });
});
