import React from 'react';
import { PROCESSING_STATES } from '../constants';

interface CardImageProps {
  imageToShow?: string | null;
  isLoading?: boolean;
  processingState?: string | null;
  uploadStatus?: string | null;
  title: string;
  showFullImage?: boolean;
  setShowFullImage?: (value: boolean) => void;
}

export function CardImage({
  imageToShow,
  isLoading = false,
  processingState,
  uploadStatus,
  title,
  showFullImage = false,
  setShowFullImage,
}: CardImageProps) {
  const showSkeleton =
    isLoading &&
    processingState !== PROCESSING_STATES.PENDING &&
    processingState !== PROCESSING_STATES.FAILED &&
    uploadStatus !== 'uploading';

  return (
    <div
      className={`absolute inset-0 ${
        !isLoading ? 'cursor-pointer' : 'cursor-default'
      } z-20`}
    >
      {showSkeleton ? (
        <div className="w-full h-full bg-muted animate-pulse" />
      ) : imageToShow ? (
        <img
          className="h-full w-full object-cover block"
          src={imageToShow || ''}
          alt={title}
          onError={() => {
            if (!showFullImage && setShowFullImage) {
              setShowFullImage(true);
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-transparent" />
      )}
    </div>
  );
}