import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Section } from './Section';
import { renderWithProviders } from '@/test/utils/testUtils';
import type { Section as SectionType, Document } from '@/types/database';
import type { Timestamp } from 'firebase/firestore';

// Mock child components to isolate testing
vi.mock('../shared/SectionHeader', () => ({
  SectionHeader: ({
    sectionData,
    toggleExpand,
    documentsCount,
  }: {
    sectionData: { name: string };
    toggleExpand: () => void;
    documentsCount: number;
  }) => (
    <div data-testid="section-header" onClick={toggleExpand}>
      <h3>{sectionData.name}</h3>
      <span>{documentsCount} documents</span>
    </div>
  ),
}));

vi.mock('./SectionContent', () => ({
  SectionContent: ({
    documents,
  }: {
    documents: Array<{ id: string; title: string }>;
  }) => (
    <div data-testid="section-content">
      {documents.map((doc) => (
        <div key={doc.id} data-testid="document-item">
          {doc.title}
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
    uploadingFiles: {},
    renameDocument: vi.fn(),
    deleteDocument: vi.fn(),
    handleUpload: vi.fn(),
    updateDocumentOrder: vi.fn(),
  })),
}));

vi.mock('@/hooks/useConfirmationDialog', () => ({
  useConfirmationDialog: () => ({
    dialog: { isOpen: false, data: null },
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFormDialog', () => ({
  useFormDialog: () => ({
    isOpen: false,
    entity: null,
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

describe('Section', () => {
  const mockSectionData: SectionType = {
    id: 'section-1',
    name: 'Project Documents',
    description: 'Test section',
    status: 'active',
    order: 1,
    projectId: 'project-123',
    createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
    updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
    createdBy: 'user1',
    updatedBy: 'user1',
  };

  const mockDocuments: Document[] = [
    {
      id: 'doc-1',
      title: 'Technical Spec',
      sectionId: 'section-1',
      order: 2,
      storageRef: 'ref1',
      thumbStorageRef: null,
      processingState: 'completed',
      fileType: 'pdf',
      fileSize: 1000,
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
    {
      id: 'doc-2',
      title: 'User Guide',
      sectionId: 'section-1',
      order: 1,
      storageRef: 'ref2',
      thumbStorageRef: null,
      processingState: 'completed',
      fileType: 'pdf',
      fileSize: 2000,
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
    {
      id: 'doc-3',
      title: 'Other Doc',
      sectionId: 'section-2',
      order: 1,
      storageRef: 'ref3',
      thumbStorageRef: null,
      processingState: 'completed',
      fileType: 'pdf',
      fileSize: 3000,
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
  ];

  const defaultProps = {
    sectionData: mockSectionData,
    allDocuments: mockDocuments,
    index: 0,
    onMoveSection: vi.fn(),
    totalSections: 3,
    collectionType: 'project' as const,
    entityId: 'project-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render section header with correct data', () => {
      renderWithProviders(<Section {...defaultProps} />);

      expect(screen.getByTestId('section-header')).toBeInTheDocument();
      expect(screen.getByText('Project Documents')).toBeInTheDocument();
      expect(screen.getByText('2 documents')).toBeInTheDocument(); // Only shows docs from this section
    });

    it('should filter and display only documents belonging to this section', () => {
      renderWithProviders(<Section {...defaultProps} />);

      // Section content should be hidden initially (not expanded)
      const sectionContent = screen.getByTestId('section-content');
      expect(sectionContent).toBeInTheDocument();

      // Should have 2 documents from section-1, not the one from section-2
      const documentItems = screen.getAllByTestId('document-item');
      expect(documentItems).toHaveLength(2);
      expect(screen.getByText('Technical Spec')).toBeInTheDocument();
      expect(screen.getByText('User Guide')).toBeInTheDocument();
      expect(screen.queryByText('Other Doc')).not.toBeInTheDocument();
    });

    it('should render with library collection type', () => {
      const libraryProps = {
        ...defaultProps,
        collectionType: 'library' as const,
        entityId: undefined,
      };

      renderWithProviders(<Section {...libraryProps} />);

      expect(screen.getByTestId('section-header')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('should toggle expanded state when header is clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<Section {...defaultProps} />);

      const header = screen.getByTestId('section-header');

      // Initially collapsed - look for max-h-0 class
      let animatedDiv = container.querySelector(
        '.overflow-hidden.transition-all'
      );
      expect(animatedDiv).toHaveClass('max-h-0');

      // Click to expand
      await user.click(header);

      // Should now be expanded - look for max-h-[5000px] class
      animatedDiv = container.querySelector('.overflow-hidden.transition-all');
      expect(animatedDiv).toHaveClass('max-h-[5000px]');

      // Click to collapse
      await user.click(header);

      // Should be collapsed again
      animatedDiv = container.querySelector('.overflow-hidden.transition-all');
      expect(animatedDiv).toHaveClass('max-h-0');
    });
  });

  describe('Document Sorting', () => {
    it('should sort documents by order field in descending order', () => {
      renderWithProviders(<Section {...defaultProps} />);

      const documentItems = screen.getAllByTestId('document-item');

      // Documents should be sorted by order desc (2, 1)
      expect(documentItems[0]).toHaveTextContent('Technical Spec'); // order: 2
      expect(documentItems[1]).toHaveTextContent('User Guide'); // order: 1
    });
  });

  describe('Props handling', () => {
    it('should handle empty documents array', () => {
      const emptyProps = {
        ...defaultProps,
        allDocuments: [],
      };

      renderWithProviders(<Section {...emptyProps} />);

      expect(screen.getByText('0 documents')).toBeInTheDocument();
    });

    it('should show import menu when showImportMenu is true', () => {
      const importProps = {
        ...defaultProps,
        showImportMenu: true,
        onImportDocuments: vi.fn(),
      };

      renderWithProviders(<Section {...importProps} />);

      expect(screen.getByTestId('section-header')).toBeInTheDocument();
    });
  });
});
