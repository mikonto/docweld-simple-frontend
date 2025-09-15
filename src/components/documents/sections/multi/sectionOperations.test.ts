import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import * as operations from './sectionOperations';
import type { Document } from '@/types/api/firestore';
import type { Timestamp } from 'firebase/firestore';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('sectionOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Document operations', () => {
    it('should handle document rename', () => {
      const mockDialog = { open: vi.fn(), close: vi.fn() };

      operations.handleRename(mockDialog, 'doc-123', 'Current Title');

      expect(mockDialog.open).toHaveBeenCalledWith({
        id: 'doc-123',
        title: 'Current Title',
      });
    });

    it('should handle document delete', () => {
      const mockDialog = {
        open: vi.fn(),
        close: vi.fn(),
      } as unknown as operations.DeleteDialog;

      operations.handleDelete(mockDialog, 'doc-456', 'Document Name');

      expect(mockDialog.open).toHaveBeenCalledWith(
        'delete',
        { id: 'doc-456', title: 'Document Name' },
        false
      );
    });

    it('should confirm document deletion', async () => {
      const mockDeleteDocument = vi.fn().mockResolvedValue({ success: true });
      const mockDialog = {
        dialog: { data: { id: 'doc-789', title: 'Test' } },
        close: vi.fn(),
        open: vi.fn(),
      };

      await operations.handleConfirmDocumentDelete(
        mockDeleteDocument,
        mockDialog
      );

      expect(mockDeleteDocument).toHaveBeenCalledWith('doc-789');
      expect(mockDialog.close).toHaveBeenCalled();
    });
  });

  describe('Section operations', () => {
    const mockT = (key: string) => {
      const translations: Record<string, string> = {
        'sections.deleteWithDocumentsInfo': 'Documents were also deleted',
        'sections.deleteIndexError': 'Cannot delete this section',
        'sections.deleteBatchLimitError': 'Too many documents to delete',
      };
      return translations[key] || key;
    };

    it('should handle section deletion with documents', async () => {
      const mockDeleteSection = vi.fn().mockResolvedValue({
        success: true,
        deletedCount: 5, // 1 section + 4 documents
      });
      const mockDialog = { close: vi.fn(), open: vi.fn() };

      await operations.handleConfirmSectionDelete(
        mockDeleteSection,
        mockDialog,
        'section-123',
        mockT
      );

      expect(mockDeleteSection).toHaveBeenCalledWith('section-123');
      expect(toast.info).toHaveBeenCalledWith('Documents were also deleted');
      expect(mockDialog.close).toHaveBeenCalled();
    });

    it('should show error when section cannot be deleted', async () => {
      const mockDeleteSection = vi.fn().mockResolvedValue({
        success: false,
        errorType: 'indexError',
      });
      const mockDialog = { close: vi.fn(), open: vi.fn() };

      await operations.handleConfirmSectionDelete(
        mockDeleteSection,
        mockDialog,
        'section-123',
        mockT
      );

      expect(toast.error).toHaveBeenCalledWith('Cannot delete this section');
      expect(mockDialog.close).toHaveBeenCalled();
    });
  });

  describe('Drag and drop', () => {
    const mockT = (key: string) => {
      const translations: Record<string, string> = {
        'documents.orderUpdateSuccess': 'Order updated',
        'errors.unknownError': 'Something went wrong',
      };
      return translations[key] || key;
    };

    it('should reorder documents when dragged', async () => {
      const mockDocuments: Document[] = [
        {
          id: 'doc-1',
          title: 'Doc 1',
          storageRef: 'ref1',
          thumbStorageRef: null,
          processingState: 'completed',
          fileType: 'pdf',
          fileSize: 1000,
          status: 'active',
          order: 0,
          createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          createdBy: 'user1',
          updatedBy: 'user1',
        },
        {
          id: 'doc-2',
          title: 'Doc 2',
          storageRef: 'ref2',
          thumbStorageRef: null,
          processingState: 'completed',
          fileType: 'pdf',
          fileSize: 2000,
          status: 'active',
          order: 1,
          createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          createdBy: 'user1',
          updatedBy: 'user1',
        },
        {
          id: 'doc-3',
          title: 'Doc 3',
          storageRef: 'ref3',
          thumbStorageRef: null,
          processingState: 'completed',
          fileType: 'pdf',
          fileSize: 3000,
          status: 'active',
          order: 2,
          createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          createdBy: 'user1',
          updatedBy: 'user1',
        },
      ];
      const mockSetDraggedDocuments = vi.fn();
      const mockUpdateDocumentOrder = vi
        .fn()
        .mockResolvedValue({ success: true });

      const event = {
        active: { id: 'doc-1' },
        over: { id: 'doc-3' },
      } as unknown as Parameters<typeof operations.handleDragEnd>[0];

      await operations.handleDragEnd(
        event,
        mockDocuments,
        mockSetDraggedDocuments,
        mockUpdateDocumentOrder,
        mockT
      );

      // Should update local state
      expect(mockSetDraggedDocuments).toHaveBeenCalled();
      // Should update in database
      expect(mockUpdateDocumentOrder).toHaveBeenCalled();
    });

    it('should not reorder when dropped in same position', async () => {
      const mockDocuments: Document[] = [
        {
          id: 'doc-1',
          title: 'Doc 1',
          storageRef: 'ref1',
          thumbStorageRef: null,
          processingState: 'completed',
          fileType: 'pdf',
          fileSize: 1000,
          status: 'active',
          order: 0,
          createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
          createdBy: 'user1',
          updatedBy: 'user1',
        },
      ];
      const mockSetDraggedDocuments = vi.fn();
      const mockUpdateDocumentOrder = vi.fn();

      const event = {
        active: { id: 'doc-1' },
        over: { id: 'doc-1' },
      } as unknown as Parameters<typeof operations.handleDragEnd>[0];

      await operations.handleDragEnd(
        event,
        mockDocuments,
        mockSetDraggedDocuments,
        mockUpdateDocumentOrder,
        () => ''
      );

      expect(mockSetDraggedDocuments).not.toHaveBeenCalled();
      expect(mockUpdateDocumentOrder).not.toHaveBeenCalled();
    });
  });

  describe('File upload', () => {
    const mockT = (key: string) => {
      const translations: Record<string, string> = {
        'documents.uploadError': 'Upload failed',
        'documents.uploadSizeError': 'File too large',
        'documents.uploadPermissionError': 'No permission',
      };
      return translations[key] || key;
    };

    it('should handle successful file upload', async () => {
      const mockHandleUpload = vi.fn().mockResolvedValue({ heicFileCount: 0 });
      const files = [new File([''], 'file1.pdf'), new File([''], 'file2.jpg')];

      await operations.handleUploadFiles(files, mockHandleUpload, mockT);

      expect(mockHandleUpload).toHaveBeenCalledWith(files);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should show appropriate error for large files', async () => {
      const mockHandleUpload = vi
        .fn()
        .mockRejectedValue(new Error('Files exceed size limit'));

      await operations.handleUploadFiles(
        [new File([''], 'large.pdf')],
        mockHandleUpload,
        mockT
      );

      expect(toast.error).toHaveBeenCalledWith('File too large');
    });

    it('should show permission error when unauthorized', async () => {
      const error = new Error('Unauthorized') as Error & { code: string };
      error.code = 'storage/unauthorized';
      const mockHandleUpload = vi.fn().mockRejectedValue(error);

      await operations.handleUploadFiles(
        [new File([''], 'file.pdf')],
        mockHandleUpload,
        mockT
      );

      expect(toast.error).toHaveBeenCalledWith('No permission');
    });
  });
});
