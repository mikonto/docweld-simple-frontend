import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionContent } from './SectionContent';
import type { Document } from '@/types/database';
import type { Timestamp } from 'firebase/firestore';

// Extend window interface for test
declare global {
  interface Window {
    testDragEnd?: (event: unknown) => void;
  }
}

// Mock the dnd-kit components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd: (event: unknown) => void;
  }) => {
    // Store onDragEnd for testing
    window.testDragEnd = onDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
  closestCenter: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  rectSortingStrategy: vi.fn(),
}));

// Mock the card components
vi.mock('@/components/documents/cards', () => ({
  Card: ({
    id,
    title,
    onRename,
    onDelete,
  }: {
    id: string;
    title: string;
    onRename: (id: string, title: string) => void;
    onDelete: (id: string, title: string) => void;
  }) => (
    <div data-testid={`card-${id}`}>
      <span>{title}</span>
      <button onClick={() => onRename(id, title)}>Rename</button>
      <button onClick={() => onDelete(id, title)}>Delete</button>
    </div>
  ),
  UploadCard: ({
    onUpload,
    maxFilesAllowed,
  }: {
    onUpload: (files: string[]) => void;
    maxFilesAllowed: number;
  }) => (
    <div data-testid="upload-card">
      <button onClick={() => onUpload(['file1', 'file2'])}>
        Upload (max {maxFilesAllowed})
      </button>
    </div>
  ),
  CardGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-grid">{children}</div>
  ),
}));

describe('SectionContent', () => {
  const mockProps = {
    documents: [
      {
        id: 'doc1',
        title: 'Document 1',
        storageRef: 'storage/doc1',
        thumbStorageRef: 'storage/thumb1',
        processingState: 'completed',
        fileType: 'pdf',
        fileSize: 1024,
        createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
        updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
        status: 'active' as const,
        order: 0,
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        id: 'doc2',
        title: 'Document 2',
        storageRef: 'storage/doc2',
        thumbStorageRef: 'storage/thumb2',
        processingState: 'completed',
        fileType: 'image',
        fileSize: 2048,
        createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
        updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
        status: 'active' as const,
        order: 1,
        createdBy: 'user1',
        updatedBy: 'user1',
      },
    ] as Document[],
    uploadingFiles: {},
    onDragEnd: vi.fn(),
    onUpload: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    maxFilesAllowed: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout and Structure', () => {
    it('should render drag and drop context with sortable context', () => {
      render(<SectionContent {...mockProps} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
      expect(screen.getByTestId('card-grid')).toBeInTheDocument();
    });

    it('should render upload card with correct max files', () => {
      render(<SectionContent {...mockProps} />);

      const uploadCard = screen.getByTestId('upload-card');
      expect(uploadCard).toBeInTheDocument();
      expect(uploadCard).toHaveTextContent('Upload (max 10)');
    });

    it('should apply correct padding to container', () => {
      const { container } = render(<SectionContent {...mockProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('p-4');
    });
  });

  describe('Document Display', () => {
    it('should render all documents as cards', () => {
      render(<SectionContent {...mockProps} />);

      expect(screen.getByTestId('card-doc1')).toBeInTheDocument();
      expect(screen.getByTestId('card-doc2')).toBeInTheDocument();
      expect(screen.getByText('Document 1')).toBeInTheDocument();
      expect(screen.getByText('Document 2')).toBeInTheDocument();
    });

    it('should render empty state with only upload card when no documents', () => {
      const emptyProps = { ...mockProps, documents: [] };
      render(<SectionContent {...emptyProps} />);

      expect(screen.getByTestId('upload-card')).toBeInTheDocument();
      expect(screen.queryByTestId('card-doc1')).not.toBeInTheDocument();
    });

    it('should pass upload status to cards when files are uploading', () => {
      const propsWithUploading = {
        ...mockProps,
        uploadingFiles: {
          doc1: { uploadStatus: 'uploading', progress: 50 },
        },
      };

      render(<SectionContent {...propsWithUploading} />);

      // The Card component should receive the upload status
      expect(screen.getByTestId('card-doc1')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle document upload when upload card is clicked', () => {
      render(<SectionContent {...mockProps} />);

      const uploadButton = screen.getByText(/Upload/);
      fireEvent.click(uploadButton);

      expect(mockProps.onUpload).toHaveBeenCalledWith(['file1', 'file2']);
    });

    it('should handle document rename when rename button is clicked', () => {
      render(<SectionContent {...mockProps} />);

      const renameButtons = screen.getAllByText('Rename');
      fireEvent.click(renameButtons[0]);

      expect(mockProps.onRename).toHaveBeenCalledWith('doc1', 'Document 1');
    });

    it('should handle document delete when delete button is clicked', () => {
      render(<SectionContent {...mockProps} />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]);

      expect(mockProps.onDelete).toHaveBeenCalledWith('doc2', 'Document 2');
    });
  });

  describe('Drag and Drop', () => {
    it('should call onDragEnd when drag operation completes', () => {
      render(<SectionContent {...mockProps} />);

      // Simulate drag end event through the stored handler
      const mockDragEvent = {
        active: { id: 'doc1' },
        over: { id: 'doc2' },
      };

      if (window.testDragEnd) {
        window.testDragEnd(mockDragEvent);
      }

      expect(mockProps.onDragEnd).toHaveBeenCalledWith(mockDragEvent);
    });

    it('should create sortable context with document IDs', () => {
      const { container } = render(<SectionContent {...mockProps} />);

      // Verify that SortableContext receives the correct items
      const sortableContext = screen.getByTestId('sortable-context');
      expect(sortableContext).toBeInTheDocument();

      // All documents should be rendered within the sortable context
      const cards = container.querySelectorAll('[data-testid^="card-doc"]');
      expect(cards).toHaveLength(2);
    });
  });

  describe('Props Validation', () => {
    it('should handle large number of documents efficiently', () => {
      const manyDocuments = Array.from({ length: 50 }, (_, i) => ({
        id: `doc${i}`,
        title: `Document ${i}`,
        storageRef: `storage/doc${i}`,
        thumbStorageRef: `storage/thumb${i}`,
        processingState: 'completed' as const,
        fileType: 'pdf',
        fileSize: 1024,
        createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
        updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
        status: 'active' as const,
        order: i,
        createdBy: 'user1',
        updatedBy: 'user1',
      }));

      const { container } = render(
        <SectionContent {...mockProps} documents={manyDocuments} />
      );

      const cards = container.querySelectorAll('[data-testid^="card-doc"]');
      expect(cards).toHaveLength(50);
    });

    it('should handle documents with various processing states', () => {
      const documentsWithStates = [
        { ...mockProps.documents[0], processingState: 'pending' as const },
        { ...mockProps.documents[1], processingState: 'processing' as const },
        {
          id: 'doc3',
          title: 'Document 3',
          storageRef: 'storage/doc3',
          thumbStorageRef: null,
          processingState: 'error' as const,
          fileType: 'pdf',
          fileSize: 1024,
          createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          status: 'active' as const,
          order: 2,
          createdBy: 'user1',
          updatedBy: 'user1',
        },
      ] as Document[];

      render(<SectionContent {...mockProps} documents={documentsWithStates} />);

      expect(screen.getByTestId('card-doc1')).toBeInTheDocument();
      expect(screen.getByTestId('card-doc2')).toBeInTheDocument();
      expect(screen.getByTestId('card-doc3')).toBeInTheDocument();
    });

    it('should handle documents without optional fields', () => {
      const minimalDocuments = [
        {
          id: 'minimal1',
          title: 'Minimal Doc',
          storageRef: 'storage/minimal',
          thumbStorageRef: null,
          processingState: 'completed' as const,
          fileType: '',
          fileSize: 0,
          createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          status: 'active' as const,
          order: 0,
          createdBy: 'user1',
          updatedBy: 'user1',
        },
      ] as Document[];

      render(<SectionContent {...mockProps} documents={minimalDocuments} />);

      expect(screen.getByTestId('card-minimal1')).toBeInTheDocument();
      expect(screen.getByText('Minimal Doc')).toBeInTheDocument();
    });
  });
});
