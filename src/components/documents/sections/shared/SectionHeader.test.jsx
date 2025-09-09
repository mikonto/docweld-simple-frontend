import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionHeader } from './SectionHeader';

// Mock lucide icons
vi.mock('lucide-react', () => ({
  MoreHorizontal: () => <div data-testid="more-icon">⋯</div>,
  ChevronRight: ({ className }) => (
    <div data-testid="chevron-right" className={className}>
      ›
    </div>
  ),
}));

// Mock dropdown menu components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => children,
  DropdownMenuContent: ({ children }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }) => (
    <div onClick={onClick} role="menuitem">
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <div role="separator" />,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'documents.documentCount') {
        return `${opts?.count || 0} documents`;
      }
      return key;
    },
  }),
}));

describe('SectionHeader', () => {
  const mockProps = {
    sectionData: {
      id: 'section-1',
      name: 'Test Section',
    },
    index: 1,
    totalSections: 3,
    isExpanded: false,
    toggleExpand: vi.fn(),
    onMoveSection: vi.fn(),
    onRenameSection: vi.fn(),
    onDeleteSection: vi.fn(),
    showImportMenu: false,
    onImportDocuments: vi.fn(),
    documentsCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Section Display', () => {
    it('should display section name and document count', () => {
      render(<SectionHeader {...mockProps} />);

      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('should use appropriate typography for multi-section list context', () => {
      render(<SectionHeader {...mockProps} />);

      const sectionTitle = screen.getByText('Test Section');
      expect(sectionTitle.tagName).toBe('H3');
      expect(sectionTitle.className).toContain('font-medium');
      expect(sectionTitle.className).toContain('text-sm');
    });

    it('should show chevron right when collapsed', () => {
      render(<SectionHeader {...mockProps} isExpanded={false} />);

      const chevron = screen.getByTestId('chevron-right');
      expect(chevron).toBeInTheDocument();
      expect(chevron.className).not.toContain('rotate-90');
    });

    it('should show rotated chevron when expanded', () => {
      render(<SectionHeader {...mockProps} isExpanded={true} />);

      const chevron = screen.getByTestId('chevron-right');
      expect(chevron).toBeInTheDocument();
      expect(chevron.className).toContain('rotate-90');
    });

    it('should display correct document count', () => {
      render(<SectionHeader {...mockProps} documentsCount={10} />);

      expect(screen.getByText('(10)')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Behavior', () => {
    it('should call toggleExpand when header is clicked', () => {
      render(<SectionHeader {...mockProps} />);

      const header = screen
        .getByText('Test Section')
        .closest('.cursor-pointer');
      fireEvent.click(header);

      expect(mockProps.toggleExpand).toHaveBeenCalledTimes(1);
    });

    it('should not call toggleExpand when dropdown menu is clicked', () => {
      render(<SectionHeader {...mockProps} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(mockProps.toggleExpand).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown Menu Actions', () => {
    it('should show move up option when not first section', () => {
      render(<SectionHeader {...mockProps} index={1} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('common.moveUp')).toBeInTheDocument();
    });

    it('should not show move up option for first section', () => {
      render(<SectionHeader {...mockProps} index={0} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.queryByText('common.moveUp')).not.toBeInTheDocument();
    });

    it('should show move down option when not last section', () => {
      render(<SectionHeader {...mockProps} index={1} totalSections={3} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('common.moveDown')).toBeInTheDocument();
    });

    it('should not show move down option for last section', () => {
      render(<SectionHeader {...mockProps} index={2} totalSections={3} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.queryByText('common.moveDown')).not.toBeInTheDocument();
    });

    it('should always show edit and delete options', () => {
      render(<SectionHeader {...mockProps} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('common.edit')).toBeInTheDocument();
      expect(screen.getByText('common.delete')).toBeInTheDocument();
    });

    it('should show import option when showImportMenu is true', () => {
      render(<SectionHeader {...mockProps} showImportMenu={true} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('documents.importDocuments')).toBeInTheDocument();
    });

    it('should not show import option when showImportMenu is false', () => {
      render(<SectionHeader {...mockProps} showImportMenu={false} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(
        screen.queryByText('documents.importDocuments')
      ).not.toBeInTheDocument();
    });
  });

  describe('Menu Action Handlers', () => {
    it('should call onMoveSection with up direction', () => {
      render(<SectionHeader {...mockProps} index={1} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);
      fireEvent.click(screen.getByText('common.moveUp'));

      expect(mockProps.onMoveSection).toHaveBeenCalledWith('section-1', 'up');
    });

    it('should call onMoveSection with down direction', () => {
      render(<SectionHeader {...mockProps} index={1} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);
      fireEvent.click(screen.getByText('common.moveDown'));

      expect(mockProps.onMoveSection).toHaveBeenCalledWith('section-1', 'down');
    });

    it('should call onRenameSection when edit is clicked', () => {
      render(<SectionHeader {...mockProps} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);
      fireEvent.click(screen.getByText('common.edit'));

      expect(mockProps.onRenameSection).toHaveBeenCalledTimes(1);
    });

    it('should call onDeleteSection when delete is clicked', () => {
      render(<SectionHeader {...mockProps} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);
      fireEvent.click(screen.getByText('common.delete'));

      expect(mockProps.onDeleteSection).toHaveBeenCalledTimes(1);
    });

    it('should call onImportDocuments with section data when import is clicked', () => {
      render(<SectionHeader {...mockProps} showImportMenu={true} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);
      fireEvent.click(screen.getByText('documents.importDocuments'));

      expect(mockProps.onImportDocuments).toHaveBeenCalledWith(
        'section-1',
        'Test Section'
      );
    });

    it('should not call onImportDocuments if handler is not provided', () => {
      render(
        <SectionHeader
          {...mockProps}
          showImportMenu={true}
          onImportDocuments={undefined}
        />
      );

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      // Click should not throw error even without handler
      expect(() => {
        fireEvent.click(screen.getByText('documents.importDocuments'));
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single section (no move options)', () => {
      render(<SectionHeader {...mockProps} index={0} totalSections={1} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.queryByText('common.moveUp')).not.toBeInTheDocument();
      expect(screen.queryByText('common.moveDown')).not.toBeInTheDocument();
      expect(screen.getByText('common.edit')).toBeInTheDocument();
      expect(screen.getByText('common.delete')).toBeInTheDocument();
    });

    it('should handle long section names gracefully', () => {
      const longNameProps = {
        ...mockProps,
        sectionData: {
          id: 'section-1',
          name: 'This is a very long section name that might cause layout issues if not handled properly',
        },
      };

      render(<SectionHeader {...longNameProps} />);

      expect(
        screen.getByText(longNameProps.sectionData.name)
      ).toBeInTheDocument();
    });

    it('should handle zero documents count', () => {
      render(<SectionHeader {...mockProps} documentsCount={0} />);

      expect(screen.getByText('(0)')).toBeInTheDocument();
    });

    it('should prevent event propagation on dropdown click', () => {
      render(<SectionHeader {...mockProps} />);

      // Click the dropdown button
      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      // toggleExpand should not be called due to stopPropagation
      expect(mockProps.toggleExpand).not.toHaveBeenCalled();
    });
  });
});
