import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeldLogDocumentsSection } from './WeldLogDocumentsSection';
import type { Document, UploadingFile } from '@/types/database';
import { mockTimestamp } from '@/test/utils/mockTimestamp';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

interface MockStandaloneSectionProps {
  title: string;
  documents: Document[];
  documentsLoading: boolean;
  documentsError: Error | null;
  onDragEnd: (event: {
    active?: { id: string };
    over?: { id: string };
  }) => void;
  onUpload: (files: File[]) => void;
  onRenameDocument: (id: string, title: string) => void;
  onDeleteDocument: (id: string, title: string) => void;
  dropdownActions: Array<{
    key: string;
    label: string;
    onSelect: () => void;
  }>;
}

// Mock StandaloneSection to test the integration
vi.mock('@/components/documents/sections', () => ({
  StandaloneSection: ({
    title,
    documents,
    documentsLoading,
    documentsError,
    onDragEnd,
    onUpload,
    onRenameDocument,
    onDeleteDocument,
    dropdownActions,
  }: MockStandaloneSectionProps) => (
    <div data-testid="standalone-section">
      <h3>{title}</h3>
      <div>Documents: {documents.length}</div>
      {documentsLoading && <div>Loading...</div>}
      {documentsError && <div>Error: {documentsError.message}</div>}
      {dropdownActions.map((action) => (
        <button key={action.key} onClick={action.onSelect}>
          {action.label}
        </button>
      ))}
      <button onClick={() => onDragEnd({ active: { id: 'doc1' } })}>
        Drag End
      </button>
      <button onClick={() => onUpload([new File([''], 'file')])}>Upload</button>
      <button onClick={() => onRenameDocument('doc1', 'New Name')}>
        Rename
      </button>
      <button onClick={() => onDeleteDocument('doc1', 'Title')}>Delete</button>
    </div>
  ),
}));

describe('WeldLogDocumentsSection', () => {
  const defaultProps = {
    documents: [] as Document[],
    documentsLoading: false,
    documentsError: null as Error | null,
    onImportClick: vi.fn(),
    onDragEnd: vi.fn(),
    onUpload: vi.fn(),
    uploadingFiles: {} as Record<string, UploadingFile>,
    onRenameDocument: vi.fn(),
    onDeleteDocument: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the section header with title', () => {
    render(<WeldLogDocumentsSection {...defaultProps} />);
    expect(screen.getByText('weldLogs.weldLogDocuments')).toBeInTheDocument();
  });

  it('should show document count', () => {
    const mockDocuments: Document[] = [
      {
        id: '1',
        title: 'Doc 1',
        fileType: 'pdf',
        fileSize: 1024,
        storageRef: 'path/to/doc1',
        thumbStorageRef: null,
        processingState: 'completed',
        status: 'active',
        order: 1,
        createdAt: mockTimestamp,
        createdBy: 'user1',
        updatedAt: mockTimestamp,
        updatedBy: 'user1',
      },
      {
        id: '2',
        title: 'Doc 2',
        fileType: 'pdf',
        fileSize: 2048,
        storageRef: 'path/to/doc2',
        thumbStorageRef: null,
        processingState: 'completed',
        status: 'active',
        order: 2,
        createdAt: mockTimestamp,
        createdBy: 'user1',
        updatedAt: mockTimestamp,
        updatedBy: 'user1',
      },
    ];

    const props = {
      ...defaultProps,
      documents: mockDocuments,
    };
    render(<WeldLogDocumentsSection {...props} />);
    expect(screen.getByText('Documents: 2')).toBeInTheDocument();
  });

  it('should pass documents to StandaloneSection', () => {
    const mockDocument: Document = {
      id: '1',
      title: 'Test Doc',
      fileType: 'pdf',
      fileSize: 1024,
      storageRef: 'path/to/doc',
      thumbStorageRef: null,
      processingState: 'completed',
      status: 'active',
      order: 1,
      createdAt: mockTimestamp,
      createdBy: 'user1',
      updatedAt: mockTimestamp,
      updatedBy: 'user1',
    };

    const props = {
      ...defaultProps,
      documents: [mockDocument],
    };
    render(<WeldLogDocumentsSection {...props} />);
    expect(screen.getByTestId('standalone-section')).toBeInTheDocument();
    expect(screen.getByText('Documents: 1')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const props = {
      ...defaultProps,
      documentsLoading: true,
    };
    render(<WeldLogDocumentsSection {...props} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const props = {
      ...defaultProps,
      documentsError: new Error('Failed to load'),
    };
    render(<WeldLogDocumentsSection {...props} />);
    expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
  });

  it('should handle drag end', () => {
    render(<WeldLogDocumentsSection {...defaultProps} />);

    const dragButton = screen.getByText('Drag End');
    fireEvent.click(dragButton);

    expect(defaultProps.onDragEnd).toHaveBeenCalledWith({
      active: { id: 'doc1' },
    });
  });

  it('should handle import documents click', () => {
    render(<WeldLogDocumentsSection {...defaultProps} />);

    // Find and click the import option (now directly rendered due to mock)
    const importOption = screen.getByText('documents.importDocuments');
    fireEvent.click(importOption);

    expect(defaultProps.onImportClick).toHaveBeenCalledTimes(1);
  });

  it('should handle document rename', () => {
    render(<WeldLogDocumentsSection {...defaultProps} />);

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    expect(defaultProps.onRenameDocument).toHaveBeenCalledWith(
      'doc1',
      'New Name'
    );
  });

  it('should handle document delete', () => {
    render(<WeldLogDocumentsSection {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(defaultProps.onDeleteDocument).toHaveBeenCalledWith('doc1', 'Title');
  });

  it('should handle file upload', () => {
    render(<WeldLogDocumentsSection {...defaultProps} />);

    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);

    expect(defaultProps.onUpload).toHaveBeenCalledWith([expect.any(File)]);
  });
});
