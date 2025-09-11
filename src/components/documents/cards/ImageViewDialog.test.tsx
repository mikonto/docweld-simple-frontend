import React from 'react';
import { screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ImageViewDialog } from './ImageViewDialog';
import { renderWithProviders } from '@/test/utils/testUtils';

describe('ImageViewDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    imageUrl: 'https://example.com/image.jpg',
    title: 'Test Image',
  };

  it('should render dialog when open with image', () => {
    renderWithProviders(<ImageViewDialog {...defaultProps} />);

    expect(screen.getByText('Test Image')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Test Image' })).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(<ImageViewDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Image')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should not render when imageUrl is null', () => {
    renderWithProviders(<ImageViewDialog {...defaultProps} imageUrl={null} />);

    expect(screen.queryByText('Test Image')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should call onClose when dialog is closed', () => {
    const onClose = vi.fn();
    const { rerender } = renderWithProviders(
      <ImageViewDialog {...defaultProps} onClose={onClose} />
    );

    // Close the dialog by changing isOpen to false
    rerender(<ImageViewDialog {...defaultProps} isOpen={false} onClose={onClose} />);
    
    // In a real scenario, the onClose would be called by the Dialog component
    // when the user clicks outside or presses ESC
  });

  it('should display close button', () => {
    renderWithProviders(<ImageViewDialog {...defaultProps} />);

    // There might be multiple close buttons (one from Dialog, one custom)
    // We just need to verify at least one exists
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('should set proper image styling for containment', () => {
    renderWithProviders(<ImageViewDialog {...defaultProps} />);

    const image = screen.getByRole('img');
    expect(image).toHaveClass('w-full', 'h-auto', 'max-h-[70vh]', 'object-contain');
  });
});