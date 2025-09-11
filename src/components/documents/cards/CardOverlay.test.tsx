import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardOverlay } from './CardOverlay';
import { UPLOAD_STATES, PROCESSING_STATES } from '../constants';

describe('CardOverlay', () => {
  describe('Visibility', () => {
    it('should render overlay when uploading', () => {
      render(
        <CardOverlay
          uploadStatus={UPLOAD_STATES.UPLOADING}
          processingState={null}
        />
      );

      expect(screen.getByTestId('upload-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('upload-spinner')).toBeInTheDocument();
    });

    it('should render overlay when processing is pending', () => {
      render(
        <CardOverlay
          uploadStatus={null}
          processingState={PROCESSING_STATES.PENDING}
        />
      );

      expect(screen.getByTestId('upload-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('upload-spinner')).toBeInTheDocument();
    });

    it('should render overlay when both uploading and pending', () => {
      render(
        <CardOverlay
          uploadStatus={UPLOAD_STATES.UPLOADING}
          processingState={PROCESSING_STATES.PENDING}
        />
      );

      expect(screen.getByTestId('upload-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('upload-spinner')).toBeInTheDocument();
    });

    it('should not render when not loading', () => {
      render(
        <CardOverlay
          uploadStatus={UPLOAD_STATES.COMPLETED}
          processingState={PROCESSING_STATES.COMPLETED}
        />
      );

      expect(screen.queryByTestId('upload-overlay')).not.toBeInTheDocument();
    });

    it('should not render when props are null', () => {
      render(<CardOverlay uploadStatus={null} processingState={null} />);

      expect(screen.queryByTestId('upload-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have correct overlay styling', () => {
      render(
        <CardOverlay
          uploadStatus={UPLOAD_STATES.UPLOADING}
          processingState={null}
        />
      );

      const overlay = screen.getByTestId('upload-overlay');
      expect(overlay).toHaveClass(
        'absolute',
        'inset-0',
        'bottom-10',
        'bg-black/40',
        'z-10'
      );
    });

    it('should have spinner with animation', () => {
      render(
        <CardOverlay
          uploadStatus={UPLOAD_STATES.UPLOADING}
          processingState={null}
        />
      );

      const spinner = screen.getByTestId('upload-spinner');
      expect(spinner).toHaveClass('animate-spin');
    });
  });
});