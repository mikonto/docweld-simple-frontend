import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StandaloneSection } from './StandaloneSection';

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ChevronRight: ({ className }) => (
    <div data-testid="chevron-right" className={className}>
      ›
    </div>
  ),
  MoreHorizontal: () => <div data-testid="more-icon">⋯</div>,
}));

// Mock dropdown menu components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }) =>
    asChild ? children : <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect, disabled }) => (
    <div
      onClick={disabled ? undefined : onSelect}
      role="menuitem"
      disabled={disabled}
    >
      {children}
    </div>
  ),
}));

// Mock StandaloneSectionContent
vi.mock('./StandaloneSectionContent', () => ({
  StandaloneSectionContent: ({
    documents,
    onUpload,
    onRename,
    onDelete,
    onDragEnd,
  }) => (
    <div data-testid="section-content-component">
      <div>Documents: {documents.length}</div>
      <button onClick={() => onUpload(['file'])}>Upload</button>
      <button onClick={() => onRename('doc1', 'New Name')}>Rename</button>
      <button onClick={() => onDelete('doc1', 'Title')}>Delete</button>
      <button onClick={() => onDragEnd({ active: { id: 'doc1' } })}>
        Drag End
      </button>
    </div>
  ),
}));

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      if (key === 'documents.errorLoadingDocuments') {
        return 'Error loading documents';
      }
      return key;
    },
  }),
}));

describe('StandaloneSection', () => {
  const mockDocuments = [
    {
      id: 'doc1',
      title: 'Document 1',
      storageRef: 'path/to/doc1',
      thumbStorageRef: 'path/to/thumb1',
      processingState: 'completed',
      fileType: 'pdf',
      fileSize: 1024,
      createdAt: new Date(),
    },
    {
      id: 'doc2',
      title: 'Document 2',
      storageRef: 'path/to/doc2',
      thumbStorageRef: 'path/to/thumb2',
      processingState: 'completed',
      fileType: 'image',
      fileSize: 2048,
      createdAt: new Date(),
    },
  ];

  const defaultProps = {
    title: 'Test Section',
    documents: mockDocuments,
    onDragEnd: vi.fn(),
    onUpload: vi.fn(),
    onRenameDocument: vi.fn(),
    onDeleteDocument: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render with title and document count', () => {
      render(<StandaloneSection {...defaultProps} />);

      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('should start collapsed by default', () => {
      render(<StandaloneSection {...defaultProps} />);

      const content = screen.getByTestId('section-content');
      expect(content.className).toContain('max-h-0');
    });

    it('should start expanded when initialExpanded is true', () => {
      render(<StandaloneSection {...defaultProps} initialExpanded={true} />);

      const content = screen.getByTestId('section-content');
      // Section expands with large max-height for animation
      expect(content.className).toContain('max-h-[5000px]');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StandaloneSection {...defaultProps} className="custom-class" />
      );

      const section = container.firstChild;
      expect(section.className).toContain('custom-class');
    });
  });

  describe('Expand/Collapse', () => {
    it('should toggle expansion when header is clicked', () => {
      render(<StandaloneSection {...defaultProps} />);

      const toggleButton = screen.getByLabelText('documents.toggleSection');
      const content = screen.getByTestId('section-content');

      // Initially collapsed
      expect(content.className).toContain('max-h-0');

      // Click to expand
      fireEvent.click(toggleButton);
      // Section expands with large max-height for animation
      expect(content.className).toContain('max-h-[5000px]');

      // Click to collapse
      fireEvent.click(toggleButton);
      expect(content.className).toContain('max-h-0');
    });

    it('should rotate chevron when expanded', () => {
      render(<StandaloneSection {...defaultProps} />);

      const chevron = screen.getByTestId('chevron-right');
      const toggleButton = screen.getByLabelText('documents.toggleSection');

      // Initially not rotated
      expect(chevron.className).not.toContain('rotate-90');

      // Click to expand
      fireEvent.click(toggleButton);
      expect(chevron.className).toContain('rotate-90');
    });
  });

  describe('Dropdown Actions', () => {
    it('should not show dropdown menu when no actions provided', () => {
      render(<StandaloneSection {...defaultProps} dropdownActions={[]} />);

      expect(
        screen.queryByLabelText('documents.sectionMenu')
      ).not.toBeInTheDocument();
    });

    it('should show dropdown menu with actions', () => {
      const mockAction = vi.fn();
      const actions = [
        {
          key: 'import',
          label: 'Import Documents',
          onSelect: mockAction,
        },
      ];

      render(<StandaloneSection {...defaultProps} dropdownActions={actions} />);

      const menuButton = screen.getByLabelText('documents.sectionMenu');
      expect(menuButton).toBeInTheDocument();

      fireEvent.click(menuButton);
      const importOption = screen.getByText('Import Documents');
      expect(importOption).toBeInTheDocument();

      fireEvent.click(importOption);
      expect(mockAction).toHaveBeenCalled();
    });

    it('should support actions with icons', () => {
      const TestIcon = () => <span>📁</span>;
      const actions = [
        {
          key: 'import',
          label: 'Import',
          onSelect: vi.fn(),
          icon: TestIcon,
        },
      ];

      render(<StandaloneSection {...defaultProps} dropdownActions={actions} />);

      const menuButton = screen.getByLabelText('documents.sectionMenu');
      fireEvent.click(menuButton);

      expect(screen.getByText('📁')).toBeInTheDocument();
    });

    it('should render disabled actions', () => {
      const actions = [
        {
          key: 'delete-section',
          label: 'Delete Section',
          onSelect: vi.fn(),
          disabled: true,
        },
      ];

      render(<StandaloneSection {...defaultProps} dropdownActions={actions} />);

      const menuButton = screen.getByLabelText('documents.sectionMenu');
      fireEvent.click(menuButton);

      // Check that the disabled action is rendered
      const deleteOption = screen.getByText('Delete Section');
      expect(deleteOption).toBeInTheDocument();
      expect(deleteOption.closest('[role="menuitem"]')).toHaveAttribute(
        'disabled'
      );
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading spinner when documentsLoading is true', () => {
      render(<StandaloneSection {...defaultProps} documentsLoading={true} />);

      // Expand the section
      fireEvent.click(screen.getByLabelText('documents.toggleSection'));

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(
        screen.queryByTestId('section-content-component')
      ).not.toBeInTheDocument();
    });

    it('should show error message when documentsError is provided', () => {
      const error = { message: 'Failed to load' };
      render(<StandaloneSection {...defaultProps} documentsError={error} />);

      // Expand the section
      fireEvent.click(screen.getByLabelText('documents.toggleSection'));

      expect(
        screen.getByText('Error loading documents: Failed to load')
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('section-content-component')
      ).not.toBeInTheDocument();
    });
  });

  describe('Document Operations', () => {
    it('should pass documents to SectionContent when expanded', () => {
      render(<StandaloneSection {...defaultProps} />);

      // Expand the section
      fireEvent.click(screen.getByLabelText('documents.toggleSection'));

      expect(screen.getByText('Documents: 2')).toBeInTheDocument();
    });

    it('should handle onUpload callback', () => {
      render(<StandaloneSection {...defaultProps} />);

      // Expand the section
      fireEvent.click(screen.getByLabelText('documents.toggleSection'));

      fireEvent.click(screen.getByText('Upload'));
      expect(defaultProps.onUpload).toHaveBeenCalledWith(['file']);
    });

    it('should handle onRenameDocument callback', () => {
      render(<StandaloneSection {...defaultProps} />);

      // Expand the section
      fireEvent.click(screen.getByLabelText('documents.toggleSection'));

      fireEvent.click(screen.getByText('Rename'));
      expect(defaultProps.onRenameDocument).toHaveBeenCalledWith(
        'doc1',
        'New Name'
      );
    });

    it('should handle onDeleteDocument callback', () => {
      render(<StandaloneSection {...defaultProps} />);

      // Expand the section
      fireEvent.click(screen.getByLabelText('documents.toggleSection'));

      fireEvent.click(screen.getByText('Delete'));
      expect(defaultProps.onDeleteDocument).toHaveBeenCalledWith(
        'doc1',
        'Title'
      );
    });

    it('should handle onDragEnd callback', () => {
      render(<StandaloneSection {...defaultProps} />);

      // Expand the section
      fireEvent.click(screen.getByLabelText('documents.toggleSection'));

      fireEvent.click(screen.getByText('Drag End'));
      expect(defaultProps.onDragEnd).toHaveBeenCalledWith({
        active: { id: 'doc1' },
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty documents array', () => {
      render(<StandaloneSection {...defaultProps} documents={[]} />);

      expect(screen.getByText('(0)')).toBeInTheDocument();
    });

    it('should handle undefined uploadingFiles', () => {
      const props = { ...defaultProps };
      delete props.uploadingFiles;

      expect(() => render(<StandaloneSection {...props} />)).not.toThrow();
    });
  });
});
