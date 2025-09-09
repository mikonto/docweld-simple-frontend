import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SectionsContainer } from './SectionsContainer';
import { toast } from 'sonner';

// Mock the hooks
vi.mock('@/hooks/documents/useDocuments', () => ({
  useDocuments: vi.fn(),
}));

vi.mock('@/hooks/documents/useSections', () => ({
  useSections: vi.fn(),
}));

vi.mock('@/hooks/documents', () => ({
  useDocumentImport: vi.fn(),
}));

vi.mock('@/hooks/useFormDialog', () => ({
  useFormDialog: vi.fn(),
}));

// Mock child components
vi.mock('./SectionsList', () => ({
  SectionsList: vi.fn(
    ({ sections, _allDocuments, isLoading, error, onAddSection }) => {
      if (isLoading) return <div>Loading sections...</div>;
      if (error) return <div>Error: {error.message}</div>;

      return (
        <div data-testid="sections-list">
          {sections.map((section) => (
            <div key={section.id}>{section.name}</div>
          ))}
          <button onClick={onAddSection}>Add Section</button>
        </div>
      );
    }
  ),
}));

vi.mock('./SectionDialog', () => ({
  SectionDialog: vi.fn(({ open, onSubmit }) =>
    open ? (
      <div data-testid="section-dialog">
        <button onClick={() => onSubmit('New Section')}>Submit</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/documents/import', () => ({
  ImportDialog: vi.fn(({ open, onSubmit }) =>
    open ? (
      <div data-testid="import-dialog">
        <button onClick={() => onSubmit([{ type: 'document', id: 'doc1' }])}>
          Import
        </button>
      </div>
    ) : null
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const translations = {
        'sections.orderUpdateSuccess': 'Section order updated successfully',
        'sections.orderUpdateError': 'Failed to update section order',
        'documents.noItemsSelectedForImport': 'No items selected to import',
        'documents.importSuccessDocuments': `Imported ${opts?.count || 0} documents`,
        'documents.importSuccessSections': `Imported ${opts?.count || 0} sections`,
        'documents.importSuccessSectionsAndDocuments': `Imported ${opts?.sectionCount || 0} sections and ${opts?.documentCount || 0} documents`,
        'documents.importPartialSuccess': `Imported ${opts?.success || 0} with ${opts?.failed || 0} failures`,
        'documents.checkConsoleForDetails': 'Check console for details',
        'documents.importFailed': `Failed to import: ${opts?.error || 'Unknown error'}`,
        'errors.unknownError': 'Unknown error',
        'documents.noPermissionToAddSections': 'No permission to add sections',
        'documents.parentDocumentNotFound': 'Parent document not found',
      };
      return translations[key] || key;
    },
  }),
}));

// Import the actual hooks after mocking
import { useDocuments } from '@/hooks/documents/useDocuments';
import { useSections } from '@/hooks/documents/useSections';
import { useDocumentImport } from '@/hooks/documents';
import { useFormDialog } from '@/hooks/useFormDialog';

describe('SectionsContainer', () => {
  const mockSections = [
    { id: 's1', name: 'Section 1', order: 0 },
    { id: 's2', name: 'Section 2', order: 1 },
  ];

  const mockDocuments = [
    { id: 'd1', title: 'Doc 1', sectionId: 's1' },
    { id: 'd2', title: 'Doc 2', sectionId: 's2' },
  ];

  const mockSectionsHook = {
    sections: mockSections,
    sectionsLoading: false,
    sectionsError: null,
    moveSection: vi.fn(),
    addSection: vi.fn(),
  };

  const mockDocumentsHook = {
    documents: mockDocuments,
    documentsLoading: false,
    documentsError: null,
  };

  const mockImportHook = {
    importItems: vi.fn(),
    isImporting: false,
  };

  const mockFormDialog = {
    isOpen: false,
    entity: null,
    open: vi.fn(),
    close: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useSections.mockReturnValue(mockSectionsHook);
    useDocuments.mockReturnValue(mockDocumentsHook);
    useDocumentImport.mockReturnValue(mockImportHook);
    useFormDialog.mockReturnValue(mockFormDialog);
  });

  describe('Data Fetching and Display', () => {
    it('should fetch sections and documents for project type', () => {
      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      expect(useSections).toHaveBeenCalledWith({
        entityType: 'project',
        entityId: 'proj-123',
      });

      expect(useDocuments).toHaveBeenCalledWith({
        entityType: 'project',
        entityId: 'proj-123',
      });
    });

    it('should fetch sections and documents for library type', () => {
      render(<SectionsContainer collectionType="library" entityId="lib-123" />);

      expect(useSections).toHaveBeenCalledWith({
        entityType: 'library',
        entityId: 'lib-123',
      });

      expect(useDocuments).toHaveBeenCalledWith({
        entityType: 'library',
        entityId: 'lib-123',
      });
    });

    it('should use "main" as default entityId for library when not provided', () => {
      render(<SectionsContainer collectionType="library" />);

      expect(useSections).toHaveBeenCalledWith({
        entityType: 'library',
        entityId: 'main',
      });
    });

    it('should display sections and documents', () => {
      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
    });

    it('should show loading state when data is loading', () => {
      useSections.mockReturnValue({
        ...mockSectionsHook,
        sectionsLoading: true,
      });

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      expect(screen.getByText('Loading sections...')).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      const error = new Error('Failed to load sections');
      useSections.mockReturnValue({
        ...mockSectionsHook,
        sectionsError: error,
      });

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      expect(
        screen.getByText('Error: Failed to load sections')
      ).toBeInTheDocument();
    });
  });

  describe('Section Management', () => {
    it('should open add section dialog when add button is clicked', () => {
      const openMock = vi.fn();
      useFormDialog.mockReturnValue({ ...mockFormDialog, open: openMock });

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      fireEvent.click(screen.getByText('Add Section'));
      expect(openMock).toHaveBeenCalled();
    });

    it('should handle successful section addition', async () => {
      const addSectionMock = vi.fn().mockResolvedValue({ success: true });
      useSections.mockReturnValue({
        ...mockSectionsHook,
        addSection: addSectionMock,
      });

      const closeMock = vi.fn();
      useFormDialog.mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        close: closeMock,
      });

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(addSectionMock).toHaveBeenCalledWith('New Section');
        expect(closeMock).toHaveBeenCalled();
      });
    });

    it('should handle section move up/down', async () => {
      const moveSectionMock = vi.fn().mockResolvedValue({ success: true });
      useSections.mockReturnValue({
        ...mockSectionsHook,
        moveSection: moveSectionMock,
      });

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      // Trigger move through SectionsList props
      const SectionsList = await import('./SectionsList').then(
        (m) => m.SectionsList
      );
      const lastCall =
        SectionsList.mock.calls[SectionsList.mock.calls.length - 1];
      const { onMoveSection } = lastCall[0];

      await onMoveSection('s1', 'down');

      expect(moveSectionMock).toHaveBeenCalledWith('s1', 'down', mockSections);
      expect(toast.success).toHaveBeenCalledWith(
        'Section order updated successfully'
      );
    });

    it('should show error toast when section move fails', async () => {
      const moveSectionMock = vi
        .fn()
        .mockRejectedValue(new Error('Move failed'));
      useSections.mockReturnValue({
        ...mockSectionsHook,
        moveSection: moveSectionMock,
      });

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      const SectionsList = await import('./SectionsList').then(
        (m) => m.SectionsList
      );
      const lastCall =
        SectionsList.mock.calls[SectionsList.mock.calls.length - 1];
      const { onMoveSection } = lastCall[0];

      await onMoveSection('s1', 'up');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to update section order'
      );
    });
  });

  describe('Import Functionality', () => {
    it('should show import dialog when showImportMenu is true and importSource is provided', () => {
      const importSource = { collectionType: 'library', entityId: 'lib-123' };

      useFormDialog.mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        entity: { mode: 'section' },
      });

      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={true}
          importSource={importSource}
        />
      );

      expect(screen.getByTestId('import-dialog')).toBeInTheDocument();
    });

    it('should not show import dialog when showImportMenu is false', () => {
      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={false}
        />
      );

      expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument();
    });

    it('should handle successful document import', async () => {
      const importItemsMock = vi.fn().mockResolvedValue({
        sections: [],
        documents: [{ id: 'd1', title: 'Imported Doc' }],
        errors: [],
      });

      useDocumentImport.mockReturnValue({
        ...mockImportHook,
        importItems: importItemsMock,
      });

      const closeMock = vi.fn();
      useFormDialog.mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        entity: { mode: 'document', targetSectionId: 's1' },
        close: closeMock,
      });

      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={true}
          importSource={{ collectionType: 'library' }}
        />
      );

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(importItemsMock).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Imported 1 documents');
        expect(closeMock).toHaveBeenCalled();
      });
    });

    it('should handle import with both sections and documents', async () => {
      const importItemsMock = vi.fn().mockResolvedValue({
        sections: [{ id: 's3', name: 'Imported Section' }],
        documents: [{ id: 'd3', title: 'Imported Doc' }],
        errors: [],
      });

      useDocumentImport.mockReturnValue({
        ...mockImportHook,
        importItems: importItemsMock,
      });

      useFormDialog.mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        close: vi.fn(),
      });

      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={true}
          importSource={{ collectionType: 'library' }}
        />
      );

      fireEvent.click(screen.getByText('Import'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Imported 1 sections and 1 documents'
        );
      });
    });

    it('should show error when no items selected for import', async () => {
      useFormDialog.mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
      });

      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={true}
          importSource={{ collectionType: 'library' }}
        />
      );

      // Find ImportDialog's onSubmit and call with empty array
      const ImportDialog = await import('@/components/documents/import').then(
        (m) => m.ImportDialog
      );
      const lastCall =
        ImportDialog.mock.calls[ImportDialog.mock.calls.length - 1];
      const { onSubmit } = lastCall[0];

      await onSubmit([]);

      expect(toast.error).toHaveBeenCalledWith('No items selected to import');
    });

    it('should handle import with partial failures', async () => {
      const importItemsMock = vi.fn().mockResolvedValue({
        sections: [{ id: 's3', name: 'Imported Section' }],
        documents: [],
        errors: [{ item: { id: 'd4' }, error: 'Failed to import' }],
      });

      useDocumentImport.mockReturnValue({
        ...mockImportHook,
        importItems: importItemsMock,
      });

      useFormDialog.mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        close: vi.fn(),
      });

      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={true}
          importSource={{ collectionType: 'library' }}
        />
      );

      fireEvent.click(screen.getByText('Import'));

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith(
          'Imported 1 with 1 failures',
          expect.objectContaining({
            description: 'Check console for details',
          })
        );
      });
    });

    it('should handle import error', async () => {
      const importItemsMock = vi
        .fn()
        .mockRejectedValue(new Error('Import failed'));

      useDocumentImport.mockReturnValue({
        ...mockImportHook,
        importItems: importItemsMock,
      });

      useFormDialog.mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
      });

      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={true}
          importSource={{ collectionType: 'library' }}
        />
      );

      fireEvent.click(screen.getByText('Import'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to import: Import failed'
        );
      });
    });
  });

  describe('Dialog State Management', () => {
    it('should manage multiple dialog states independently', () => {
      const dialogs = [];
      useFormDialog.mockImplementation(() => {
        const dialog = {
          isOpen: false,
          entity: null,
          open: vi.fn(function (entity) {
            this.isOpen = true;
            this.entity = entity;
          }),
          close: vi.fn(function () {
            this.isOpen = false;
            this.entity = null;
          }),
        };
        dialogs.push(dialog);
        return dialog;
      });

      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={true}
          importSource={{ collectionType: 'library' }}
        />
      );

      // Should create two dialogs (addSection and import)
      expect(dialogs).toHaveLength(2);
      expect(dialogs[0]).not.toBe(dialogs[1]);
    });
  });
});
