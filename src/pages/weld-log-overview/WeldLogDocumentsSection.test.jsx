import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeldLogDocumentsSection } from './WeldLogDocumentsSection';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

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
  }) => (
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
      <button onClick={() => onUpload(['file'])}>Upload</button>
      <button onClick={() => onRenameDocument('doc1', 'New Name')}>
        Rename
      </button>
      <button onClick={() => onDeleteDocument('doc1', 'Title')}>Delete</button>
    </div>
  ),
}));

describe('WeldLogDocumentsSection', () => {
  const defaultProps = {
    documents: [],
    documentsLoading: false,
    documentsError: null,
    onImportClick: vi.fn(),
    onDragEnd: vi.fn(),
    onUpload: vi.fn(),
    uploadingFiles: [],
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
    const props = {
      ...defaultProps,
      documents: [
        { id: '1', title: 'Doc 1' },
        { id: '2', title: 'Doc 2' },
      ],
    };
    render(<WeldLogDocumentsSection {...props} />);
    expect(screen.getByText('Documents: 2')).toBeInTheDocument();
  });

  it('should pass documents to StandaloneSection', () => {
    const props = {
      ...defaultProps,
      documents: [{ id: '1', title: 'Test Doc' }],
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
      documentsError: { message: 'Failed to load' },
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

    expect(defaultProps.onUpload).toHaveBeenCalledWith(['file']);
  });
});
