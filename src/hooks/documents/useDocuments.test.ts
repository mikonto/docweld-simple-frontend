import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, MockedFunction } from 'vitest';
import { useDocuments } from './useDocuments';

// Mock dependencies
vi.mock('./useBaseDocumentOperations');
vi.mock('./useDocumentData');

import { useBaseDocumentOperations } from './useBaseDocumentOperations';
import { useDocumentData } from './useDocumentData';

const mockUseBaseDocumentOperations = useBaseDocumentOperations as MockedFunction<typeof useBaseDocumentOperations>;
const mockUseDocumentData = useDocumentData as MockedFunction<typeof useDocumentData>;

describe('useDocuments', () => {
  const mockOperations = {
    documents: [],
    loading: false,
    error: undefined,
    addDocument: vi.fn(),
    renameDocument: vi.fn(),
    deleteDocument: vi.fn(),
    updateDocumentOrder: vi.fn(),
    updateProcessingState: vi.fn(),
    handleFileUpload: vi.fn(),
    uploadingFiles: [],
    handleUpload: vi.fn(),
    handleCancelUpload: vi.fn(),
  };

  const mockData = {
    documents: [
      { id: 'doc1', title: 'Document 1' },
      { id: 'doc2', title: 'Document 2' },
    ],
    loading: false,
    error: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBaseDocumentOperations.mockReturnValue(mockOperations);
    mockUseDocumentData.mockReturnValue(mockData);
  });

  describe('Entity Type Support', () => {
    it('should work with project documents', () => {
      const { result } = renderHook(() =>
        useDocuments({
          entityType: 'project',
          entityId: 'project-123',
        })
      );

      expect(useBaseDocumentOperations).toHaveBeenCalledWith(
        'project-documents',
        { projectId: 'project-123' }
      );
      expect(useDocumentData).toHaveBeenCalledWith('project-documents', {
        projectId: 'project-123',
      });

      expect(result.current).toEqual({
        addDocument: mockOperations.addDocument,
        renameDocument: mockOperations.renameDocument,
        deleteDocument: mockOperations.deleteDocument,
        updateDocumentOrder: mockOperations.updateDocumentOrder,
        updateProcessingState: mockOperations.updateProcessingState,
        handleFileUpload: mockOperations.handleFileUpload,
        uploadingFiles: mockOperations.uploadingFiles,
        handleUpload: mockOperations.handleUpload,
        handleCancelUpload: mockOperations.handleCancelUpload,
        documents: mockData.documents,
        documentsLoading: mockData.loading,
        documentsError: mockData.error,
      });
    });

    it('should work with library documents', () => {
      const { result } = renderHook(() =>
        useDocuments({
          entityType: 'library',
          entityId: 'main',
        })
      );

      expect(useBaseDocumentOperations).toHaveBeenCalledWith(
        'library-documents',
        { libraryId: 'main' }
      );
      expect(result.current.documents).toEqual(mockData.documents);
    });

    it('should work with weld log documents including additional foreign keys', () => {
      renderHook(() =>
        useDocuments({
          entityType: 'weldLog',
          entityId: 'weld-123',
          additionalForeignKeys: { projectId: 'project-456' },
        })
      );

      expect(useBaseDocumentOperations).toHaveBeenCalledWith(
        'weld-log-documents',
        { weldLogId: 'weld-123', projectId: 'project-456' }
      );
    });

    it('should include sectionId when provided', () => {
      renderHook(() =>
        useDocuments({
          entityType: 'project',
          entityId: 'project-123',
          sectionId: 'section-456',
        })
      );

      expect(useBaseDocumentOperations).toHaveBeenCalledWith(
        'project-documents',
        { projectId: 'project-123', sectionId: 'section-456' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when entityType is missing', () => {
      expect(() => {
        renderHook(() =>
          useDocuments({
            entityId: '123',
          } as any)
        );
      }).toThrow('useDocuments requires entityType and entityId');
    });

    it('should throw error when entityId is missing', () => {
      expect(() => {
        renderHook(() =>
          useDocuments({
            entityType: 'project',
          } as any)
        );
      }).toThrow('useDocuments requires entityType and entityId');
    });

    it('should throw error for unsupported entity type', () => {
      expect(() => {
        renderHook(() =>
          useDocuments({
            entityType: 'invalid' as any,
            entityId: '123',
          })
        );
      }).toThrow('Unsupported entity type: invalid');
    });
  });

  describe('Operations', () => {
    it('should expose all operations from base hook', () => {
      const { result } = renderHook(() =>
        useDocuments({
          entityType: 'project',
          entityId: 'project-123',
        })
      );

      expect(result.current.addDocument).toBe(mockOperations.addDocument);
      expect(result.current.renameDocument).toBe(mockOperations.renameDocument);
      expect(result.current.deleteDocument).toBe(mockOperations.deleteDocument);
      expect(result.current.updateDocumentOrder).toBe(
        mockOperations.updateDocumentOrder
      );
      expect(result.current.handleUpload).toBe(mockOperations.handleUpload);
    });
  });

  // Integration test
  it('should be a function', () => {
    expect(typeof useDocuments).toBe('function');
  });
});