import { screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { Card } from './Card';
import { renderWithProviders } from '@/test/utils/testUtils';
import type { Timestamp } from 'firebase/firestore';

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

// Mock utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

// Mock hooks
vi.mock('@/hooks/documents', () => ({
  useDocumentDisplay: () => ({
    imageToShow: 'test-image-url',
    isLoading: false,
    fullUrl: 'test-full-url',
    showFullImage: false,
    setShowFullImage: vi.fn(),
  }),
}));

// Mock tooltip components - simplified
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactElement;
    asChild?: boolean;
  }) => {
    if (asChild && React.isValidElement(children)) {
      const Component = children.type;
      const props = children.props as Record<string, unknown>;
      return <Component {...props}>{props.children}</Component>;
    }
    return <div>{children}</div>;
  },
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

// Mock dropdown menu components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactElement;
    asChild?: boolean;
  }) => {
    if (asChild && React.isValidElement(children)) {
      const Component = children.type;
      const props = children.props as Record<string, unknown>;
      return <Component {...props}>{props.children}</Component>;
    }
    return <button>{children}</button>;
  },
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
}));

describe('Card', () => {
  const defaultProps = {
    id: 'doc-1',
    title: 'Test Document.pdf',
    storageRef: 'path/to/test.pdf',
    fileType: 'pdf',
    fileSize: 1048576, // 1 MB
    createdAt: { seconds: 1640995200, nanoseconds: 0 } as Timestamp, // 2022-01-01
    onRename: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Display', () => {
    it('should display document title and show date in tooltip', () => {
      renderWithProviders(<Card {...defaultProps} />);

      // Document title should be visible
      expect(screen.getAllByText('Test Document.pdf')[0]).toBeInTheDocument();

      // Date should be in tooltip content
      const tooltipContents = screen.getAllByTestId('tooltip-content');
      const tooltipWithDate = tooltipContents.find((tooltip) =>
        tooltip.textContent?.includes('Jan 1, 2022')
      );
      expect(tooltipWithDate).toBeDefined();

      // Verify tooltip also has file info
      expect(tooltipWithDate).toHaveTextContent('Test Document.pdf');
      expect(tooltipWithDate).toHaveTextContent('Jan 1, 2022');
    });

    it('should show file info in tooltip', () => {
      renderWithProviders(<Card {...defaultProps} />);

      const tooltipContents = screen.getAllByTestId('tooltip-content');
      const fileInfoTooltip = tooltipContents.find((tooltip) =>
        tooltip.textContent?.includes('File Size')
      );

      expect(fileInfoTooltip).toBeDefined();
      expect(fileInfoTooltip).toHaveTextContent('File Size: 1 MB');
      expect(fileInfoTooltip).toHaveTextContent('File Type: PDF');
    });

    it('should not display file type in main card view', () => {
      renderWithProviders(<Card {...defaultProps} />);

      // File type should only be in tooltip, not in main view
      const fileTypeElements = screen.queryAllByText('PDF');
      expect(fileTypeElements).toHaveLength(0);
    });
  });

  describe('Dropdown Menu Actions', () => {
    // Menu button is now in top-right corner of card
    const findMoreButton = () => {
      const buttons = screen.getAllByRole('button');
      return buttons.find(
        (btn) =>
          btn.querySelector('svg.lucide-ellipsis') ||
          btn.querySelector('svg[class*="lucide"]') ||
          btn.querySelector('[data-lucide]')
      );
    };

    it('should display Edit and Delete menu items', () => {
      renderWithProviders(<Card {...defaultProps} />);

      const moreButton = findMoreButton();
      expect(moreButton).toBeDefined();
      fireEvent.click(moreButton!);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('should call onRename when Edit is clicked', () => {
      renderWithProviders(<Card {...defaultProps} />);

      const moreButton = findMoreButton();
      fireEvent.click(moreButton!);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(defaultProps.onRename).toHaveBeenCalledWith(
        'doc-1',
        'Test Document.pdf'
      );
    });

    it('should call onDelete when Delete is clicked', () => {
      renderWithProviders(<Card {...defaultProps} />);

      const moreButton = findMoreButton();
      fireEvent.click(moreButton!);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(defaultProps.onDelete).toHaveBeenCalledWith(
        'doc-1',
        'Test Document.pdf'
      );
    });
  });
});
