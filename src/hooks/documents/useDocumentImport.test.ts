import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { useDocumentImport } from './useDocumentImport';
import { setDoc, writeBatch, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase
vi.mock('@/firebase', () => ({
  db: {},
  functions: {},
}));

vi.mock('firebase/firestore', () => ({
  setDoc: vi.fn(),
  writeBatch: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-doc-ref' })),
  collection: vi.fn(() => ({ id: 'mock-collection-ref' })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

// Mock file utilities
vi.mock('@/components/documents/utils/fileUtils', () => ({
  generateStoragePath: vi.fn(
    (type: string, id: string, filename: string) => `${type}/${id}/${filename}`
  ),
  getFileExtension: vi.fn((filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }),
}));

// Mock App Provider
vi.mock('@/contexts/AppProvider', () => ({
  useApp: vi.fn(() => ({
    loggedInUser: { id: 'test-user-id' },
  })),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSetDoc = setDoc as unknown as MockedFunction<typeof setDoc>;
const mockWriteBatch = writeBatch as unknown as MockedFunction<
  typeof writeBatch
>;
const mockGetDocs = getDocs as unknown as MockedFunction<typeof getDocs>;
const mockHttpsCallable = httpsCallable as unknown as MockedFunction<
  typeof httpsCallable
>;

describe('useDocumentImport', () => {
  let mockCopyFunction: ReturnType<typeof vi.fn>;
  let mockBatch: {
    set: ReturnType<typeof vi.fn>;
    commit: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful copy function
    mockCopyFunction = vi.fn().mockResolvedValue({
      data: { success: true },
    });
    mockHttpsCallable.mockReturnValue(
      mockCopyFunction as unknown as ReturnType<typeof httpsCallable>
    );

    // Mock batch operations
    mockBatch = {
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    mockWriteBatch.mockReturnValue(
      mockBatch as unknown as ReturnType<typeof writeBatch>
    );

    // Mock getDocs to return empty for order calculations
    const emptyDocsArray: unknown[] = [];
    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: emptyDocsArray,
      forEach: function (callback: (doc: unknown) => void) {
        emptyDocsArray.forEach(callback);
      },
    } as unknown as Awaited<ReturnType<typeof getDocs>>);
  });

  describe('Project Documents Import', () => {
    it('should import a document to a project', async () => {
      const { result } = renderHook(() =>
        useDocumentImport('project', 'project-123')
      );

      const sourceDoc = {
        id: 'source-doc-id',
        title: 'Test Document',
        fileType: 'PDF',
        storageRef: 'documents/source-doc-id/file.pdf',
        thumbStorageRef: 'documents/source-doc-id/thumb.jpg',
      };

      await act(async () => {
        await result.current.importDocument(sourceDoc, 'section-123');
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          projectId: 'project-123',
          sectionId: 'section-123',
          title: 'Test Document',
          fileType: 'PDF',
          status: 'active',
          importedFrom: 'source-doc-id',
        })
      );

      expect(mockCopyFunction).toHaveBeenCalledTimes(2); // Main file and thumbnail
    });

    it('should import a section with documents', async () => {
      const { result } = renderHook(() =>
        useDocumentImport('project', 'project-123')
      );

      const sourceSection = {
        id: 'source-section-id',
        name: 'Test Section',
        order: 0,
      };

      // Mock getDocs to return documents for the section
      const mockDocsArray = [
        {
          id: 'doc-1',
          data: () => ({
            title: 'Document 1',
            fileType: 'PDF',
            storageRef: 'documents/doc-1/file.pdf',
          }),
        },
      ];

      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: mockDocsArray,
        forEach: function (callback: (doc: unknown) => void) {
          mockDocsArray.forEach(callback);
        },
      } as unknown as import('firebase/firestore').QuerySnapshot<
        import('firebase/firestore').DocumentData
      >);

      await act(async () => {
        await result.current.importSection(
          sourceSection,
          'library',
          'library-id'
        );
      });

      // Verify batch operations were called
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          projectId: 'project-123',
          name: 'Test Section',
          status: 'active',
        })
      );

      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('Library Documents Import', () => {
    it('should import a document to the library', async () => {
      const { result } = renderHook(() => useDocumentImport('library', null));

      const sourceDoc = {
        id: 'source-doc-id',
        title: 'Library Document',
        fileType: 'IMAGE',
        storageRef: 'documents/source-doc-id/file.jpg',
      };

      await act(async () => {
        await result.current.importDocument(sourceDoc);
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: 'Library Document',
          fileType: 'IMAGE',
          status: 'active',
          importedFrom: 'source-doc-id',
        })
      );

      // Verify library path was used for copy
      expect(mockCopyFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationStoragePath: expect.stringContaining(
            'documents/mock-doc-ref'
          ),
        })
      );
    });
  });

  describe('Attachments Import', () => {
    it('should import a document to a weld log', async () => {
      const { result } = renderHook(() =>
        useDocumentImport('weldLog', 'weld-123')
      );

      const sourceDoc = {
        id: 'source-doc-id',
        title: 'Weld Document',
        fileType: 'PDF',
        storageRef: 'documents/source-doc-id/file.pdf',
      };

      await act(async () => {
        await result.current.importDocument(sourceDoc, null, {});
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: 'Weld Document',
          fileType: 'PDF',
          status: 'active',
        })
      );

      // Verify weld log path includes additional context
      expect(mockCopyFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationStoragePath: expect.stringContaining(
            'documents/mock-doc-ref'
          ),
        })
      );
    });
  });

  describe('Batch Import', () => {
    it('should import multiple items', async () => {
      const { result } = renderHook(() =>
        useDocumentImport('project', 'project-123')
      );

      const items = [
        {
          type: 'document' as const,
          data: {
            id: 'doc-1',
            title: 'Document 1',
            fileType: 'PDF',
            storageRef: 'documents/doc-1/file.pdf',
          },
        },
        {
          type: 'document' as const,
          data: {
            id: 'doc-2',
            title: 'Document 2',
            fileType: 'IMAGE',
            storageRef: 'documents/doc-2/file.jpg',
          },
        },
      ];

      await act(async () => {
        await result.current.importItems(items);
      });

      // Verify both documents were imported
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle copy function failures', async () => {
      const { result } = renderHook(() =>
        useDocumentImport('project', 'project-123')
      );

      // Mock copy failure
      mockCopyFunction.mockRejectedValueOnce(new Error('Copy failed'));

      const sourceDoc = {
        id: 'source-doc-id',
        title: 'Test Document',
        fileType: 'PDF',
        storageRef: 'documents/source-doc-id/file.pdf',
      };

      let error: Error | undefined;
      try {
        await act(async () => {
          await result.current.importDocument(sourceDoc, 'section-123');
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should handle batch commit failures', async () => {
      const { result } = renderHook(() =>
        useDocumentImport('project', 'project-123')
      );

      // Mock batch commit failure
      mockBatch.commit.mockRejectedValueOnce(new Error('Commit failed'));

      const sourceSection = {
        id: 'source-section-id',
        name: 'Test Section',
      };

      let error: Error | undefined;
      try {
        await act(async () => {
          await result.current.importSection(
            sourceSection,
            'library',
            'library-id'
          );
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain('Commit failed');
    });
  });
});
