import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderHook } from '@/test/utils/testUtils';
import { useFileUpload } from './useFileUpload';
import { uploadBytesResumable } from 'firebase/storage';
import { doc } from 'firebase/firestore';
import {
  validateUploadBatch,
  createDocumentsWithRollback,
  processUploadResults,
} from './fileUploadHelpers';

// Mock Firebase
vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({})),
  uploadBytesResumable: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  db: {},
  storage: {},
}));

vi.mock('@/utils/sanitizeFileName', () => ({
  sanitizeFileName: vi.fn((name) => name),
}));

vi.mock('@/components/documents/utils/fileUtils', () => ({
  getMimeTypeFromExtension: vi.fn(() => 'application/octet-stream'),
  isAllowedFile: vi.fn(() => true),
  sanitizeFileName: vi.fn((name) => name),
}));

vi.mock('./fileUploadHelpers', () => ({
  validateUploadBatch: vi.fn((files) => ({
    isValid: true,
    error: null,
    filesToUpload: Array.from(files),
    heicFileCount: 0,
  })),
  prepareUploadPlan: vi.fn((files, _config) =>
    Array.from(files).map((file, index) => ({
      file,
      docId: `test-doc-${index}`,
      sanitizedFileName: file.name,
    }))
  ),
  createDocumentsWithRollback: vi.fn(async (planned) => planned),
  getStorageErrorMessage: vi.fn((err) => err.message || 'Upload failed'),
  processUploadResults: vi.fn((results, heicCount, total) => ({
    heicFileCount: heicCount,
    totalFiles: total,
    errors: results.filter((r) => r.status === 'rejected'),
    successCount: results.filter((r) => r.status === 'fulfilled').length,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useFileUpload', () => {
  const mockAddDocument = vi.fn();
  const mockUpdateProcessingState = vi.fn();
  let mockUploadTask;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    doc.mockReturnValue({ id: 'test-doc-id' });
    mockAddDocument.mockResolvedValue({});
    mockUpdateProcessingState.mockResolvedValue();

    // Reset helper mocks to default behavior
    validateUploadBatch.mockImplementation((files) => ({
      isValid: true,
      error: null,
      filesToUpload: Array.from(files),
      heicFileCount: 0,
    }));

    createDocumentsWithRollback.mockImplementation(async (planned) => planned);

    // Setup upload task mock
    mockUploadTask = {
      on: vi.fn((event, progress, error, complete) => {
        if (event === 'state_changed') {
          // Simulate immediate completion
          setTimeout(() => complete(), 0);
        }
        return () => {}; // unsubscribe function
      }),
      snapshot: { bytesTransferred: 100, totalBytes: 100 },
    };
    uploadBytesResumable.mockReturnValue(mockUploadTask);
  });

  describe('File Validation', () => {
    it('should reject invalid file types', async () => {
      // Mock validation to return error for invalid files
      validateUploadBatch.mockReturnValueOnce({
        isValid: false,
        error: new Error(
          'Upload failed: 0 files exceed size limit, 1 files have unsupported formats.'
        ),
      });

      const { result } = renderHook(() =>
        useFileUpload('test/path', mockAddDocument, mockUpdateProcessingState)
      );

      const invalidFile = new File(['content'], 'test.exe', {
        type: 'application/exe',
      });

      await expect(
        act(async () => {
          await result.current.handleUpload([invalidFile]);
        })
      ).rejects.toThrow(/unsupported formats/);
    });

    it('should reject files over 10MB', async () => {
      // Mock validation to return error for oversized files
      validateUploadBatch.mockReturnValueOnce({
        isValid: false,
        error: new Error(
          'Upload failed: 1 files exceed size limit, 0 files have unsupported formats.'
        ),
      });

      const { result } = renderHook(() =>
        useFileUpload('test/path', mockAddDocument, mockUpdateProcessingState)
      );

      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );

      await expect(
        act(async () => {
          await result.current.handleUpload([largeFile]);
        })
      ).rejects.toThrow(/exceed size limit/);
    });

    it('should reject more than 10 files', async () => {
      // Mock validation to return error for too many files
      validateUploadBatch.mockReturnValueOnce({
        isValid: false,
        error: new Error('Max 10 files allowed. 11 selected.'),
      });

      const { result } = renderHook(() =>
        useFileUpload('test/path', mockAddDocument, mockUpdateProcessingState)
      );

      const files = Array(11)
        .fill(null)
        .map(
          (_, i) =>
            new File(['content'], `test${i}.jpg`, { type: 'image/jpeg' })
        );

      await expect(
        act(async () => {
          await result.current.handleUpload(files);
        })
      ).rejects.toThrow(/Max 10 files allowed/);
    });
  });

  describe('Upload Operations', () => {
    it('should upload single file successfully', async () => {
      const { result } = renderHook(() =>
        useFileUpload(
          { collectionName: 'test-collection' },
          mockAddDocument,
          mockUpdateProcessingState
        )
      );

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleUpload([file]);
      });

      // Check that createDocumentsWithRollback was called with the correct params
      expect(createDocumentsWithRollback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            file: expect.any(File),
            docId: expect.any(String),
            sanitizedFileName: expect.any(String),
          }),
        ]),
        mockAddDocument,
        expect.objectContaining({ collectionName: 'test-collection' })
      );

      expect(uploadBytesResumable).toHaveBeenCalled();
    });

    it('should handle multiple file uploads', async () => {
      const { result } = renderHook(() =>
        useFileUpload(
          { collectionName: 'test-collection' },
          mockAddDocument,
          mockUpdateProcessingState
        )
      );

      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.pdf', { type: 'application/pdf' }),
      ];

      await act(async () => {
        await result.current.handleUpload(files);
      });

      expect(createDocumentsWithRollback).toHaveBeenCalled();
      expect(uploadBytesResumable).toHaveBeenCalledTimes(2);
    });

    it('should handle empty file array', async () => {
      const { result } = renderHook(() =>
        useFileUpload(
          { collectionName: 'test-collection' },
          mockAddDocument,
          mockUpdateProcessingState
        )
      );

      const uploadResult = await act(async () => {
        return await result.current.handleUpload([]);
      });

      expect(mockAddDocument).not.toHaveBeenCalled();
      expect(uploadBytesResumable).not.toHaveBeenCalled();
      expect(uploadResult.totalFiles).toBe(0);
    });

    it('should track HEIC file uploads', async () => {
      // Mock validation to return HEIC count
      validateUploadBatch.mockReturnValueOnce({
        isValid: true,
        error: null,
        filesToUpload: [
          new File(['content'], 'photo.heic', { type: 'image/heic' }),
          new File(['content'], 'image.jpg', { type: 'image/jpeg' }),
        ],
        heicFileCount: 1,
      });

      // Mock processUploadResults to return expected result
      processUploadResults.mockReturnValueOnce({
        heicFileCount: 1,
        totalFiles: 2,
        errors: [],
        successCount: 2,
        failedCount: 0,
      });

      const { result } = renderHook(() =>
        useFileUpload(
          { collectionName: 'test-collection' },
          mockAddDocument,
          mockUpdateProcessingState
        )
      );

      const files = [
        new File(['content'], 'photo.heic', { type: 'image/heic' }),
        new File(['content'], 'image.jpg', { type: 'image/jpeg' }),
      ];

      const uploadResult = await act(async () => {
        return await result.current.handleUpload(files);
      });

      expect(uploadResult.heicFileCount).toBe(1);
      expect(uploadResult.totalFiles).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle upload failures gracefully', async () => {
      // Mock processUploadResults to return errors
      processUploadResults.mockReturnValueOnce({
        heicFileCount: 0,
        totalFiles: 1,
        errors: [{ message: 'Upload failed' }],
        successCount: 0,
        failedCount: 1,
      });

      const { result } = renderHook(() =>
        useFileUpload(
          { collectionName: 'test-collection' },
          mockAddDocument,
          mockUpdateProcessingState
        )
      );

      // Simulate upload error
      mockUploadTask.on.mockImplementation((event, progress, error) => {
        if (event === 'state_changed') {
          setTimeout(
            () =>
              error({
                message: 'Upload failed',
                enhancedMessage: 'Upload failed',
              }),
            0
          );
        }
        return () => {};
      });

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      const uploadResult = await act(async () => {
        return await result.current.handleUpload([file]);
      });

      expect(createDocumentsWithRollback).toHaveBeenCalled();
      expect(uploadResult.errors).toBeDefined();
      expect(uploadResult.errors.length).toBeGreaterThan(0);
    });

    it('should rollback on batch upload failure', async () => {
      // Mock createDocumentsWithRollback to throw error
      createDocumentsWithRollback.mockRejectedValueOnce(
        new Error('Database error')
      );

      const { result } = renderHook(() =>
        useFileUpload(
          { collectionName: 'test-collection' },
          mockAddDocument,
          mockUpdateProcessingState
        )
      );

      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
      ];

      // Execute the upload which should fail
      let uploadError;
      try {
        await act(async () => {
          await result.current.handleUpload(files);
        });
      } catch (error) {
        uploadError = error;
      }

      // Verify error was thrown
      expect(uploadError).toBeDefined();
      expect(uploadError.message).toBe('Database error');

      // Verify createDocumentsWithRollback was called
      // The rollback happens inside createDocumentsWithRollback helper
      expect(createDocumentsWithRollback).toHaveBeenCalledWith(
        expect.any(Array),
        mockAddDocument,
        expect.objectContaining({ collectionName: 'test-collection' })
      );
    });

    it('should handle permission errors', async () => {
      const { result } = renderHook(() =>
        useFileUpload(
          { collectionName: 'test-collection' },
          mockAddDocument,
          mockUpdateProcessingState
        )
      );

      const permissionError = new Error('Missing permissions');
      permissionError.code = 'permission-denied';

      // Mock createDocumentsWithRollback to throw permission error
      createDocumentsWithRollback.mockRejectedValueOnce(permissionError);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(
        act(async () => {
          await result.current.handleUpload([file]);
        })
      ).rejects.toThrow('Missing permissions');
    });
  });
});
