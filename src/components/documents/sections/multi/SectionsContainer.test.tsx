import React from 'react';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SectionsContainer } from './SectionsContainer';
import { toast } from 'sonner';
import type { Section, Document } from '@/types/database';
import type { Timestamp } from 'firebase/firestore';

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
    ({ sections, isLoading, error, onAddSection }: any) => {
      if (isLoading) return <div>Loading sections...</div>;
      if (error) return <div>Error: {error.message}</div>;

      return (
        <div data-testid="sections-list">
          {sections?.map((section: Section) => (
            <div key={section.id}>{section.name}</div>
          ))}
          <button onClick={onAddSection}>Add Section</button>
        </div>
      );
    }
  ),
}));

vi.mock('./SectionDialog', () => ({
  SectionDialog: vi.fn(({ open, onSubmit }: any) =>
    open ? (
      <div data-testid="section-dialog">
        <button onClick={() => onSubmit('New Section')}>Submit</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/documents/import', () => ({
  ImportDialog: vi.fn(({ open, onSubmit }: any) =>
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
    t: (key: string, opts?: any) => {
      const translations: Record<string, string> = {
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
import { SectionsList } from './SectionsList';
import { ImportDialog } from '@/components/documents/import';

describe('SectionsContainer', () => {
  const mockSections: Section[] = [
    { 
      id: 's1', 
      name: 'Section 1', 
      description: '',
      status: 'active',
      order: 0,
      projectId: 'proj-123',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
    { 
      id: 's2', 
      name: 'Section 2',
      description: '',
      status: 'active',
      order: 1,
      projectId: 'proj-123',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
  ];

  const mockDocuments: Document[] = [
    { 
      id: 'd1', 
      title: 'Doc 1', 
      sectionId: 's1',
      storageRef: 'ref1',
      thumbStorageRef: null,
      processingState: 'completed',
      fileType: 'pdf',
      fileSize: 1000,
      order: 0,
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
    { 
      id: 'd2', 
      title: 'Doc 2', 
      sectionId: 's2',
      storageRef: 'ref2',
      thumbStorageRef: null,
      processingState: 'completed',
      fileType: 'pdf',
      fileSize: 2000,
      order: 1,
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      createdBy: 'user1',
      updatedBy: 'user1',
    },
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
    (useSections as MockedFunction<typeof useSections>).mockReturnValue(mockSectionsHook as any);
    (useDocuments as MockedFunction<typeof useDocuments>).mockReturnValue(mockDocumentsHook as any);
    (useDocumentImport as MockedFunction<typeof useDocumentImport>).mockReturnValue(mockImportHook as any);
    (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue(mockFormDialog as any);
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
      (useSections as MockedFunction<typeof useSections>).mockReturnValue({
        ...mockSectionsHook,
        sectionsLoading: true,
      } as any);

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      expect(screen.getByText('Loading sections...')).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      const error = new Error('Failed to load sections');
      (useSections as MockedFunction<typeof useSections>).mockReturnValue({
        ...mockSectionsHook,
        sectionsError: error,
      } as any);

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
      (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({ 
        ...mockFormDialog, 
        open: openMock 
      } as any);

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      fireEvent.click(screen.getByText('Add Section'));
      expect(openMock).toHaveBeenCalled();
    });

    it('should handle successful section addition', async () => {
      const addSectionMock = vi.fn().mockResolvedValue({ success: true });
      (useSections as MockedFunction<typeof useSections>).mockReturnValue({
        ...mockSectionsHook,
        addSection: addSectionMock,
      } as any);

      const closeMock = vi.fn();
      (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        close: closeMock,
      } as any);

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
      (useSections as MockedFunction<typeof useSections>).mockReturnValue({
        ...mockSectionsHook,
        moveSection: moveSectionMock,
      } as any);

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      // Trigger move through SectionsList props
      const SectionsListMock = SectionsList as MockedFunction<typeof SectionsList>;
      const lastCall = SectionsListMock.mock.calls[SectionsListMock.mock.calls.length - 1];
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
      (useSections as MockedFunction<typeof useSections>).mockReturnValue({
        ...mockSectionsHook,
        moveSection: moveSectionMock,
      } as any);

      render(
        <SectionsContainer collectionType="project" entityId="proj-123" />
      );

      const SectionsListMock = SectionsList as MockedFunction<typeof SectionsList>;
      const lastCall = SectionsListMock.mock.calls[SectionsListMock.mock.calls.length - 1];
      const { onMoveSection } = lastCall[0];

      await onMoveSection('s1', 'up');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to update section order'
      );
    });
  });

  describe('Import Functionality', () => {
    it('should show import dialog when showImportMenu is true and importSource is provided', () => {
      const importSource = { collectionType: 'library' as const, entityId: 'lib-123' };

      (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        entity: { mode: 'section', targetSectionId: null, targetSectionName: null },
      } as any);

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

      (useDocumentImport as MockedFunction<typeof useDocumentImport>).mockReturnValue({
        ...mockImportHook,
        importItems: importItemsMock,
      } as any);

      const closeMock = vi.fn();
      (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        entity: { mode: 'document', targetSectionId: 's1', targetSectionName: 'Section 1' },
        close: closeMock,
      } as any);

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

      (useDocumentImport as MockedFunction<typeof useDocumentImport>).mockReturnValue({
        ...mockImportHook,
        importItems: importItemsMock,
      } as any);

      (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        close: vi.fn(),
      } as any);

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
      (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
      } as any);

      render(
        <SectionsContainer
          collectionType="project"
          entityId="proj-123"
          showImportMenu={true}
          importSource={{ collectionType: 'library' }}
        />
      );

      // Find ImportDialog's onSubmit and call with empty array
      const ImportDialogMock = ImportDialog as MockedFunction<typeof ImportDialog>;
      const lastCall = ImportDialogMock.mock.calls[ImportDialogMock.mock.calls.length - 1];
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

      (useDocumentImport as MockedFunction<typeof useDocumentImport>).mockReturnValue({
        ...mockImportHook,
        importItems: importItemsMock,
      } as any);

      (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
        close: vi.fn(),
      } as any);

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

      (useDocumentImport as MockedFunction<typeof useDocumentImport>).mockReturnValue({
        ...mockImportHook,
        importItems: importItemsMock,
      } as any);

      (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
        ...mockFormDialog,
        isOpen: true,
      } as any);

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
      const dialogs: any[] = [];
      (useFormDialog as MockedFunction<typeof useFormDialog>).mockImplementation(() => {
        const dialog = {
          isOpen: false,
          entity: null,
          open: vi.fn(function (this: any, entity) {
            this.isOpen = true;
            this.entity = entity;
          }),
          close: vi.fn(function (this: any) {
            this.isOpen = false;
            this.entity = null;
          }),
        };
        dialogs.push(dialog);
        return dialog as any;
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