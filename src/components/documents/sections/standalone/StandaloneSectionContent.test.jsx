import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StandaloneSectionContent } from './StandaloneSectionContent';

// Mock the card components
vi.mock('@/components/documents/cards', () => ({
  Card: ({ id, title }) => <div data-testid={`card-${id}`}>{title}</div>,
  UploadCard: ({ onUpload }) => (
    <button onClick={() => onUpload(['file'])}>Upload Card</button>
  ),
}));

// Mock DND
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  rectSortingStrategy: vi.fn(),
}));

describe('StandaloneSectionContent', () => {
  const defaultProps = {
    documents: [
      { id: '1', title: 'Doc 1', storageRef: 'ref1' },
      { id: '2', title: 'Doc 2', storageRef: 'ref2' },
    ],
    uploadingFiles: {},
    onDragEnd: vi.fn(),
    onUpload: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    maxFilesAllowed: 10,
  };

  it('should render with grid layout', () => {
    const { container } = render(
      <StandaloneSectionContent {...defaultProps} />
    );

    // Check for container with padding
    const contentContainer = container.querySelector('.p-4');
    expect(contentContainer).toBeInTheDocument();

    // Check that grid styles are applied (via inline styles)
    const gridContainer = container.querySelector('[style*="grid"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should render upload card and document cards', () => {
    render(<StandaloneSectionContent {...defaultProps} />);

    expect(screen.getByText('Upload Card')).toBeInTheDocument();
    expect(screen.getByTestId('card-1')).toBeInTheDocument();
    expect(screen.getByTestId('card-2')).toBeInTheDocument();
  });

  it('should use rect sorting strategy', () => {
    render(<StandaloneSectionContent {...defaultProps} />);

    // Just verify the sortable context is rendered
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });

  it('should handle empty documents array', () => {
    render(<StandaloneSectionContent {...defaultProps} documents={[]} />);

    // Should still show upload card
    expect(screen.getByText('Upload Card')).toBeInTheDocument();
  });
});
