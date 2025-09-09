// src/hooks/documents/shared/document-display/useDocumentDisplay.js
import { useState, useEffect } from 'react';
import { ref as storageRefFunc, getStorage } from 'firebase/storage';
import { useDownloadURL } from 'react-firebase-hooks/storage';

/**
 * Custom hook for managing document image display
 * @param {string} storageRef - Storage reference for the full image
 * @param {string} thumbStorageRef - Storage reference for the thumbnail
 * @param {boolean} initialShowFullImage - Whether to initially show the full image
 * @param {string} processingState - Processing state of the document
 * @returns {object} Image display state and controls
 */
export function useDocumentDisplay(
  storageRef,
  thumbStorageRef = null,
  initialShowFullImage = false,
  processingState = null
) {
  const [showFullImage, setShowFullImage] = useState(initialShowFullImage);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Only fetch URLs when processing is completed (or no processingState is provided for backwards compatibility)
  const canFetch = !processingState || processingState === 'completed';

  // Create storage references only when we can fetch
  const fullImageRef =
    storageRef && canFetch ? storageRefFunc(getStorage(), storageRef) : null;
  const thumbImageRef =
    (thumbStorageRef || storageRef) && canFetch
      ? storageRefFunc(getStorage(), thumbStorageRef || storageRef)
      : null;

  // Use react-firebase-hooks for downloading URLs
  const [fullUrl, fullLoading, fullError] = useDownloadURL(fullImageRef);

  // Only fetch thumbnail if we can fetch
  const [thumbUrl, thumbLoading, thumbError] = useDownloadURL(thumbImageRef);

  // Handle any errors from the hooks
  useEffect(() => {
    if (fullError && canFetch) {
      // Error loading full document URL
    }
    if (thumbError && canFetch && thumbImageRef) {
      // Error loading thumbnail URL
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
