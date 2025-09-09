import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentDisplay } from './useDocumentDisplay';
import { getStorage, ref as storageRefFunc } from 'firebase/storage';
import { useDownloadURL } from 'react-firebase-hooks/storage';

// Mock Firebase modules
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
}));

vi.mock('react-firebase-hooks/storage', () => ({
  useDownloadURL: vi.fn(),
}));

// Mock Image constructor
global.Image = vi.fn().mockImplementation(() => ({
  onload: null,
  onerror: null,
  src: '',
}));

describe('useDocumentDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStorage.mockReturnValue({});
    storageRefFunc.mockImplementation((storage, path) => ({ path, storage }));
    // Default mock - return array for each call
    useDownloadURL.mockReturnValue([null, false, null]);
  });

  describe('Core Document Display', () => {
    it('should display thumbnail by default', () => {
      const mockThumbUrl = 'https://example.com/thumb.jpg';
      const mockFullUrl = 'https://example.com/full.jpg';

      let callCount = 0;
      useDownloadURL.mockImplementation(() => {
        callCount++;
        // First call is for full image, second is for thumbnail
        return callCount === 1
          ? [mockFullUrl, false, null]
          : [mockThumbUrl, false, null];
      });

      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg')
      );

      // Should show thumbnail by default
      expect(result.current.imageToShow).toBe(mockThumbUrl);
      expect(result.current.showFullImage).toBe(false);
      expect(result.current.fullUrl).toBe(mockFullUrl);
    });

    it('should expose setShowFullImage to switch between views', () => {
      useDownloadURL.mockReturnValue(['url', false, null]);

      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg')
      );

      expect(result.current.showFullImage).toBe(false);

      act(() => {
        result.current.setShowFullImage(true);
      });

      expect(result.current.showFullImage).toBe(true);
    });

    it('should handle loading states correctly', () => {
      useDownloadURL.mockReturnValue([null, true, null]); // Loading state

      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg')
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.imageToShow).toBe(null);
    });
  });

  describe('Error Recovery', () => {
    it('should fallback to full image if thumbnail fails to load', () => {
      const mockFullUrl = 'https://example.com/full.jpg';
      const mockThumbUrl = 'https://example.com/thumb.jpg';

      let callCount = 0;
      useDownloadURL.mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? [mockFullUrl, false, null]
          : [mockThumbUrl, false, null];
      });

      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg')
      );

      // Initially showing thumbnail
      expect(result.current.showFullImage).toBe(false);
      expect(result.current.imageToShow).toBe(mockThumbUrl);

      // Simulate thumbnail load error - should switch to full image
      const imageInstance = Image.mock.results[0].value;
      act(() => {
        imageInstance.onerror();
      });

      // Should automatically switch to full image on error
      expect(result.current.showFullImage).toBe(true);
    });

    it('should handle storage fetch errors gracefully', () => {
      const mockError = new Error('Storage error');

      useDownloadURL.mockReturnValue([null, false, mockError]);

      // Test that hook handles error gracefully without crashing
      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg')
      );

      // Error is handled silently now - no console.error
      // Hook should still return valid state despite error
      expect(result.current.showFullImage).toBe(false);
      expect(result.current.imageUrl).toBeUndefined(); // imageToShow is undefined when both urls are null
    });
  });

  describe('Processing State Integration', () => {
    it('should not fetch URLs when document is still processing', () => {
      const { result } = renderHook(() =>
        useDocumentDisplay(
          'documents/test/image.jpg',
          null,
          false,
          'pending' // Still processing
        )
      );

      // Should not create storage refs when processing
      expect(storageRefFunc).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.imageToShow).toBe(null);
    });

    it('should fetch URLs when processing is completed', () => {
      const mockUrl = 'https://example.com/image.jpg';
      useDownloadURL.mockReturnValue([mockUrl, false, null]);

      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg', null, false, 'completed')
      );

      expect(storageRefFunc).toHaveBeenCalled();
      expect(result.current.imageToShow).toBe(mockUrl);
    });
  });
});
