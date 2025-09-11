import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Section } from '@/types/database';
import SectionsList from './SectionsList';

// Mock lucide icons
vi.mock('lucide-react', () => ({
  FolderIcon: () => <div data-testid="folder-icon">📁</div>,
  ChevronRight: () => <div data-testid="chevron-right">›</div>,
  CheckIcon: () => <div data-testid="check-icon">✓</div>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (key === 'documents.documents_other')
        return `${opts?.count || 0} documents`;
      if (key === 'documents.documents_one')
        return `${opts?.count || 0} documents`;
      if (key === 'documents.noSectionsFound') return 'No sections found';
      return key;
    },
  }),
}));

describe('SectionsList', () => {
  const mockSections: Section[] = [
    { 
      id: 's1', 
      name: 'Section One', 
      documentCount: 5,
      status: 'active',
      order: 1,
      createdAt: new Date() as any,
      createdBy: 'user1',
      updatedAt: new Date() as any,
      updatedBy: 'user1',
    },
    { 
      id: 's2', 
      name: 'Section Two', 
      documentCount: 0,
      status: 'active',
      order: 2,
      createdAt: new Date() as any,
      createdBy: 'user1',
      updatedAt: new Date() as any,
      updatedBy: 'user1',
    },
    { 
      id: 's3', 
      name: 'Section Three', 
      documentCount: 12,
      status: 'active',
      order: 3,
      createdAt: new Date() as any,
      createdBy: 'user1',
      updatedAt: new Date() as any,
      updatedBy: 'user1',
    },
  ];

  const mockHandlers = {
    onSectionClick: vi.fn(),
    onSelectItem: vi.fn(),
    isItemSelected: vi.fn((item: Section) => item.id === 's2'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display Modes', () => {
    it('should display sections with folder icons and names', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="document"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Section One')).toBeInTheDocument();
      expect(screen.getByText('Section Two')).toBeInTheDocument();
      expect(screen.getByText('Section Three')).toBeInTheDocument();
      expect(screen.getAllByTestId('folder-icon')).toHaveLength(3);
    });

    it('should display document count for each section', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="document"
          {...mockHandlers}
        />
      );

      // Check for document counts displayed
      expect(screen.getByText('5 documents')).toBeInTheDocument();
      expect(screen.getByText('0 documents')).toBeInTheDocument();
      expect(screen.getByText('12 documents')).toBeInTheDocument();
    });

    it('should show empty state when no sections', () => {
      render(<SectionsList sections={[]} mode="document" {...mockHandlers} />);

      expect(screen.getByText('No sections found')).toBeInTheDocument();
    });
  });

  describe('Document Mode (navigation only)', () => {
    it('should show chevron for navigation in document mode', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="document"
          {...mockHandlers}
        />
      );

      const chevrons = screen.getAllByTestId('chevron-right');
      expect(chevrons).toHaveLength(3);
    });

    it('should not show checkboxes in document mode', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="document"
          {...mockHandlers}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should call onSectionClick when section is clicked in document mode', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="document"
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText('Section One'));
      expect(mockHandlers.onSectionClick).toHaveBeenCalledWith(mockSections[0]);
      expect(mockHandlers.onSelectItem).not.toHaveBeenCalled();
    });

    it('should apply hover styles for clickable sections', () => {
      const { container } = render(
        <SectionsList
          sections={mockSections}
          mode="document"
          {...mockHandlers}
        />
      );

      const sectionElements = container.querySelectorAll('.cursor-pointer');
      expect(sectionElements).toHaveLength(3);
      expect(sectionElements[0]).toHaveClass('hover:bg-muted/50');
    });
  });

  describe('Section Mode (selection only)', () => {
    it('should show checkboxes in section mode', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="section"
          {...mockHandlers}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('should not show navigation chevrons in section mode', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="section"
          {...mockHandlers}
        />
      );

      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });

    it('should call onSelectItem when section is clicked in section mode', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="section"
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText('Section One'));
      expect(mockHandlers.onSelectItem).toHaveBeenCalledWith(
        mockSections[0],
        'section'
      );
      expect(mockHandlers.onSectionClick).not.toHaveBeenCalled();
    });

    it('should toggle selection when checkbox is clicked', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="section"
          {...mockHandlers}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(mockHandlers.onSelectItem).toHaveBeenCalledWith(
        mockSections[0],
        'section'
      );
    });

    it('should show selected state with ring styling', () => {
      const { container } = render(
        <SectionsList
          sections={mockSections}
          mode="section"
          {...mockHandlers}
        />
      );

      // s2 is selected according to isItemSelected mock
      const sectionElements = container.querySelectorAll('.border');
      const selectedSection = Array.from(sectionElements).find((el) =>
        el.textContent?.includes('Section Two')
      );

      expect(selectedSection).toHaveClass('ring-2', 'ring-primary');
    });

    it('should show checked state for selected items', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="section"
          {...mockHandlers}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // Second section (s2) should be checked based on mock
      expect(checkboxes[1]).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Both Mode (selection and navigation)', () => {
    it('should show both checkboxes and chevrons in both mode', () => {
      render(
        <SectionsList sections={mockSections} mode="both" {...mockHandlers} />
      );

      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      expect(screen.getAllByTestId('chevron-right')).toHaveLength(3);
    });

    it('should call onSelectItem when clicking section in both mode', () => {
      render(
        <SectionsList sections={mockSections} mode="both" {...mockHandlers} />
      );

      fireEvent.click(screen.getByText('Section One'));
      expect(mockHandlers.onSelectItem).toHaveBeenCalledWith(
        mockSections[0],
        'section'
      );
    });

    it('should still call onSelectItem when checkbox is clicked directly', () => {
      render(
        <SectionsList sections={mockSections} mode="both" {...mockHandlers} />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(mockHandlers.onSelectItem).toHaveBeenCalledWith(
        mockSections[0],
        'section'
      );
    });

    it('should stop event propagation when checkbox is clicked', () => {
      render(
        <SectionsList sections={mockSections} mode="both" {...mockHandlers} />
      );

      // Click checkbox directly
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Only onSelectItem should be called when clicking checkbox
      expect(mockHandlers.onSelectItem).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onSelectItem).toHaveBeenCalledWith(
        mockSections[0],
        'section'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle sections with zero documents', () => {
      const sectionsWithZero: Section[] = [
        { 
          id: 's1', 
          name: 'Empty Section', 
          documentCount: 0,
          status: 'active',
          order: 1,
          createdAt: new Date() as any,
          createdBy: 'user1',
          updatedAt: new Date() as any,
          updatedBy: 'user1',
        },
      ];

      render(
        <SectionsList
          sections={sectionsWithZero}
          mode="document"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Empty Section')).toBeInTheDocument();
      expect(screen.getByText('0 documents')).toBeInTheDocument();
    });

    it('should handle sections with undefined document count', () => {
      const sectionsWithUndefined: Section[] = [
        { 
          id: 's1', 
          name: 'Section', 
          documentCount: undefined as any,
          status: 'active',
          order: 1,
          createdAt: new Date() as any,
          createdBy: 'user1',
          updatedAt: new Date() as any,
          updatedBy: 'user1',
        },
      ];

      render(
        <SectionsList
          sections={sectionsWithUndefined}
          mode="document"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Section')).toBeInTheDocument();
    });

    it('should handle long section names gracefully', () => {
      const longNameSections: Section[] = [
        {
          id: 's1',
          name: 'This is a very long section name that should be displayed properly without breaking the layout',
          documentCount: 5,
          status: 'active',
          order: 1,
          createdAt: new Date() as any,
          createdBy: 'user1',
          updatedAt: new Date() as any,
          updatedBy: 'user1',
        },
      ];

      render(
        <SectionsList
          sections={longNameSections}
          mode="document"
          {...mockHandlers}
        />
      );

      expect(screen.getByText(longNameSections[0].name)).toBeInTheDocument();
    });

    it('should not call onSectionClick when not provided in section mode', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="section"
          onSelectItem={mockHandlers.onSelectItem}
          isItemSelected={mockHandlers.isItemSelected}
        />
      );

      // Should not throw error even without onSectionClick
      expect(() => {
        fireEvent.click(screen.getByText('Section One'));
      }).not.toThrow();
    });

    it('should handle rapid clicks correctly', () => {
      render(
        <SectionsList
          sections={mockSections}
          mode="section"
          {...mockHandlers}
        />
      );

      const section = screen.getByText('Section One');

      // Rapid clicks
      fireEvent.click(section);
      fireEvent.click(section);
      fireEvent.click(section);

      expect(mockHandlers.onSelectItem).toHaveBeenCalledTimes(3);
    });

    it('should maintain correct layout with many sections', () => {
      const manySections: Section[] = Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        name: `Section ${i}`,
        documentCount: i,
        status: 'active' as const,
        order: i + 1,
        createdAt: new Date() as any,
        createdBy: 'user1',
        updatedAt: new Date() as any,
        updatedBy: 'user1',
      }));

      const { container } = render(
        <SectionsList
          sections={manySections}
          mode="document"
          {...mockHandlers}
        />
      );

      const sectionElements = container.querySelectorAll('.border');
      expect(sectionElements).toHaveLength(20);

      // All should have consistent spacing
      const wrapper = container.querySelector('.space-y-1');
      expect(wrapper).toBeInTheDocument();
    });
  });
});