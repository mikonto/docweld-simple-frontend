import React from 'react';
import { UPLOAD_STATES, PROCESSING_STATES } from '../constants';

interface CardOverlayProps {
  uploadStatus?: string | null;
  processingState?: string | null;
}

export function CardOverlay({ uploadStatus, processingState }: CardOverlayProps) {
  const isLoading =
    uploadStatus === UPLOAD_STATES.UPLOADING ||
    processingState === PROCESSING_STATES.PENDING;

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 bottom-10 flex flex-col items-center justify-center bg-black/40 z-10"
      data-testid="upload-overlay"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"
        data-testid="upload-spinner"
      />
    </div>
  );
}