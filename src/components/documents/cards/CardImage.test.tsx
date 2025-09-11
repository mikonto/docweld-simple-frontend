import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardImage } from './CardImage';
import { PROCESSING_STATES } from '../constants';

describe('CardImage', () => {
  const defaultProps = {
    title: 'Test Document',
    isLoading: false,
    processingState: null,
    uploadStatus: null,
    imageToShow: null,
    showFullImage: false,
    setShowFullImage: vi.fn(),
  };

  describe('Loading State', () => {
    it('should show skeleton when loading and not in pending/failed state', () => {
      render(
        <CardImage
          {...defaultProps}
          isLoading={true}
          processingState={PROCESSING_STATES.PROCESSING}
        />
      );

      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should not show skeleton when in pending state', () => {
      render(
        <CardImage
          {...defaultProps}
          isLoading={true}
          processingState={PROCESSING_STATES.PENDING}
        />
      );

      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).not.toBeInTheDocument();
    });

    it('should not show skeleton when uploading', () => {
      render(
        <CardImage
          {...defaultProps}
          isLoading={true}
          uploadStatus="uploading"
        />
      );

      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).not.toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    it('should display image when imageToShow is provided', () => {
      const imageUrl = 'https://example.com/image.jpg';
      render(<CardImage {...defaultProps} imageToShow={imageUrl} />);

      const image = screen.getByRole('img', { name: 'Test Document' });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', imageUrl);
    });

    it('should handle image error by setting showFullImage', () => {
      const setShowFullImage = vi.fn();
      const { container } = render(
        <CardImage
          {...defaultProps}
          imageToShow="invalid-url"
          showFullImage={false}
          setShowFullImage={setShowFullImage}
        />
      );

      const image = container.querySelector('img');
      image?.dispatchEvent(new Event('error'));

      expect(setShowFullImage).toHaveBeenCalledWith(true);
    });

    it('should not call setShowFullImage on error if already showing full image', () => {
      const setShowFullImage = vi.fn();
      const { container } = render(
        <CardImage
          {...defaultProps}
          imageToShow="invalid-url"
          showFullImage={true}
          setShowFullImage={setShowFullImage}
        />
      );

      const image = container.querySelector('img');
      image?.dispatchEvent(new Event('error'));

      expect(setShowFullImage).not.toHaveBeenCalled();
    });
  });

  describe('Cursor State', () => {
    it('should have pointer cursor when not loading', () => {
      const { container } = render(
        <CardImage {...defaultProps} isLoading={false} />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('cursor-pointer');
    });

    it('should have default cursor when loading', () => {
      const { container } = render(
        <CardImage {...defaultProps} isLoading={true} />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('cursor-default');
    });
  });

  describe('Empty State', () => {
    it('should render transparent div when no image and not loading', () => {
      const { container } = render(
        <CardImage {...defaultProps} imageToShow={null} isLoading={false} />
      );

      const transparentDiv = container.querySelector('.bg-transparent');
      expect(transparentDiv).toBeInTheDocument();
    });
  });
});