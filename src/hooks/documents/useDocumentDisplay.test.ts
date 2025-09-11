import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
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

const mockGetStorage = getStorage as MockedFunction<typeof getStorage>;
const mockStorageRefFunc = storageRefFunc as MockedFunction<typeof storageRefFunc>;
const mockUseDownloadURL = useDownloadURL as MockedFunction<typeof useDownloadURL>;

// Mock Image constructor
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
};

global.Image = vi.fn().mockImplementation(() => mockImage) as any;

describe('useDocumentDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStorage.mockReturnValue({} as any);
    mockStorageRefFunc.mockImplementation((storage: any, path: string) => ({ path, storage } as any));
    // Default mock - return array for each call
    mockUseDownloadURL.mockReturnValue([null, false, undefined]);
  });

  describe('Core Document Display', () => {
    it('should display thumbnail by default', () => {
      const mockThumbUrl = 'https://example.com/thumb.jpg';
      const mockFullUrl = 'https://example.com/full.jpg';

      let callCount = 0;
      mockUseDownloadURL.mockImplementation(() => {
        callCount++;
        // First call is for full image, second is for thumbnail
        return callCount === 1
          ? [mockFullUrl, false, undefined]
          : [mockThumbUrl, false, undefined];
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
      mockUseDownloadURL.mockReturnValue(['url', false, undefined]);

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
      mockUseDownloadURL.mockReturnValue([null, true, undefined]); // Loading state

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
      mockUseDownloadURL.mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? [mockFullUrl, false, undefined]
          : [mockThumbUrl, false, undefined];
      });

      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg')
      );

      // Initially showing thumbnail
      expect(result.current.showFullImage).toBe(false);
      expect(result.current.imageToShow).toBe(mockThumbUrl);

      // Simulate thumbnail load error - should switch to full image
      act(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      });

      // Should automatically switch to full image on error
      expect(result.current.showFullImage).toBe(true);
    });

    it('should handle storage fetch errors gracefully', () => {
      const mockError = new Error('Storage error');

      mockUseDownloadURL.mockReturnValue([null, false, mockError]);

      // Test that hook handles error gracefully without crashing
      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg')
      );

      // Error is handled silently now - no console.error
      // Hook should still return valid state despite error
      expect(result.current.showFullImage).toBe(false);
      expect(result.current.imageToShow).toBe(null); // imageToShow is null when both urls are null
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
      mockUseDownloadURL.mockReturnValue([mockUrl, false, undefined]);

      const { result } = renderHook(() =>
        useDocumentDisplay('documents/test/image.jpg', null, false, 'completed')
      );

      expect(storageRefFunc).toHaveBeenCalled();
      expect(result.current.imageToShow).toBe(mockUrl);
    });
  });
});