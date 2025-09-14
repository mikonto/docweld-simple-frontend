// src/hooks/documents/useDocumentDisplay.ts
import { useState, useEffect } from 'react';
import {
  ref as storageRefFunc,
  getStorage,
  StorageReference,
} from 'firebase/storage';
import { useDownloadURL } from 'react-firebase-hooks/storage';

interface UseDocumentDisplayReturn {
  imageToShow: string | null | undefined;
  isLoading: boolean;
  fullUrl: string | undefined;
  showFullImage: boolean;
  setShowFullImage: (value: boolean) => void;
}

/**
 * Custom hook for managing document image display
 */
export function useDocumentDisplay(
  storageRef: string | null,
  thumbStorageRef: string | null = null,
  initialShowFullImage: boolean = false,
  processingState: string | null = null
): UseDocumentDisplayReturn {
  const [showFullImage, setShowFullImage] = useState(initialShowFullImage);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Only fetch URLs when processing is completed (or no processingState is provided for backwards compatibility)
  const canFetch = !processingState || processingState === 'completed';

  // Create storage references only when we can fetch
  const fullImageRef: StorageReference | null =
    storageRef && canFetch ? storageRefFunc(getStorage(), storageRef) : null;

  // Determine the path for thumbnail (use thumbStorageRef if available, otherwise use storageRef)
  const thumbPath = thumbStorageRef || storageRef;
  const thumbImageRef: StorageReference | null =
    thumbPath && canFetch ? storageRefFunc(getStorage(), thumbPath) : null;

  // Use react-firebase-hooks for downloading URLs
  const [fullUrl, fullLoading, fullError] = useDownloadURL(fullImageRef);

  // Only fetch thumbnail if we can fetch
  const [thumbUrl, thumbLoading, thumbError] = useDownloadURL(thumbImageRef);

  // Handle any errors from the hooks
  useEffect(() => {
    if (fullError && canFetch) {
      // Error loading full document URL
      console.debug('Error loading full document URL:', fullError);
    }
    if (thumbError && canFetch && thumbImageRef) {
      // Error loading thumbnail URL
      console.debug('Error loading thumbnail URL:', thumbError);
    }
  }, [fullError, thumbError, canFetch, thumbImageRef]);

  // Determine which image to show
  const imageToShow = showFullImage ? fullUrl : thumbUrl;

  // Preload the current image to display
  useEffect(() => {
    if (!imageToShow || !canFetch) {
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      setImageLoaded(false);
      // If thumbnail fails to load, try the full image instead
      if (!showFullImage) {
        setShowFullImage(true);
      }
    };
    img.src = imageToShow;

    return () => {
      // Clean up
      img.onload = null;
      img.onerror = null;
    };
  }, [imageToShow, showFullImage, canFetch]);

  // Determine if the image is currently loading
  const isLoading =
    !canFetch || (showFullImage ? fullLoading : thumbLoading) || !imageLoaded;

  return {
    imageToShow,
    isLoading,
    fullUrl,
    showFullImage,
    setShowFullImage,
  };
}
