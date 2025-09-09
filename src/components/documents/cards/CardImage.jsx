import React from 'react';
import PropTypes from 'prop-types';
import { PROCESSING_STATES } from '../constants';

export function CardImage({
  imageToShow,
  isLoading,
  processingState,
  uploadStatus,
  title,
  showFullImage,
  setShowFullImage,
}) {
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
            if (!showFullImage) setShowFullImage(true);
          }}
        />
      ) : (
        <div className="w-full h-full bg-transparent" />
      )}
    </div>
  );
}

CardImage.propTypes = {
  imageToShow: PropTypes.string,
  isLoading: PropTypes.bool,
  processingState: PropTypes.string,
  uploadStatus: PropTypes.string,
  title: PropTypes.string.isRequired,
  showFullImage: PropTypes.bool,
  setShowFullImage: PropTypes.func,
};
