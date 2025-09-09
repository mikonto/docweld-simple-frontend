import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import DocumentLibrary from './index';

// Mock the hooks
vi.mock('@/hooks/useDocumentLibrary', () => ({
  useDocumentCollections: vi.fn(),
  useDocumentCollectionOperations: vi.fn(),
  useDocumentCollection: vi.fn(() => [null, false, null]), // For breadcrumbs
}));

vi.mock('@/hooks/useFormDialog', () => ({
  useFormDialog: vi.fn(),
}));

vi.mock('@/hooks/useConfirmationDialog', () => ({
  useConfirmationDialog: vi.fn(),
}));

vi.mock('@/utils/confirmationContent', () => ({
  getConfirmationContent: vi.fn(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

describe('DocumentLibrary', () => {
  const mockCreateDocumentCollection = vi.fn();
  const mockUpdateDocumentCollection = vi.fn();
  const mockDeleteDocumentCollection = vi.fn();

  const mockDocuments = [
    {
      id: '1',
      name: 'Test Collection 1',
      description: 'Test description 1',
      sections: 2,
      documents: 5,
    },
    {
      id: '2',
      name: 'Test Collection 2',
      description: 'Test description 2',
      sections: 3,
      documents: 8,
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    const { useDocumentCollections, useDocumentCollectionOperations } =
      vi.mocked(await import('@/hooks/useDocumentLibrary'));

    const { useFormDialog } = vi.mocked(await import('@/hooks/useFormDialog'));
    const { useConfirmationDialog } = vi.mocked(
      await import('@/hooks/useConfirmationDialog')
    );
    const { getConfirmationContent } = vi.mocked(
      await import('@/utils/confirmationContent')
    );

    useDocumentCollections.mockReturnValue([mockDocuments, false, null]);

    useDocumentCollectionOperations.mockReturnValue({
      createDocumentCollection: mockCreateDocumentCollection,
      updateDocumentCollection: mockUpdateDocumentCollection,
      deleteDocumentCollection: mockDeleteDocumentCollection,
    });

    useFormDialog.mockReturnValue({
      isOpen: false,
      entity: null,
      open: vi.fn(),
      close: vi.fn(),
    });

    useConfirmationDialog.mockReturnValue({
      dialog: { isOpen: false, type: null, isBulk: false, data: null },
      open: vi.fn(),
      close: vi.fn(),
      handleConfirm: vi.fn(),
    });

    getConfirmationContent.mockReturnValue({
      title: 'Delete Collection',
      description: 'Are you sure?',
      actionLabel: 'Delete',
      actionVariant: 'destructive',
    });
  });

  // Test different data states using data-driven approach
  const dataStateTestCases = [
    {
      name: 'loaded state with page title',
      mockReturn: [mockDocuments, false, null],
      expectation: () => {
        expect(
          screen.getByRole('heading', { name: 'Document Library' })
        ).toBeInTheDocument();
      },
    },
    {
      name: 'loading state',
      mockReturn: [[], true, null],
      expectation: () => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      },
    },
    {
      name: 'error state',
      mockReturn: [[], false, new Error('Failed to load')],
      expectation: () => {
        expect(
          screen.getByText(/error loading document library/i)
        ).toBeInTheDocument();
      },
    },
  ];

  dataStateTestCases.forEach(({ name, mockReturn, expectation }) => {
    it(`should display ${name}`, async () => {
      const { useDocumentCollections } = vi.mocked(
        await import('@/hooks/useDocumentLibrary')
      );
      useDocumentCollections.mockReturnValue(mockReturn);

      renderWithProviders(<DocumentLibrary />);

      await waitFor(expectation);
    });
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    const mockOpenFormDialog = vi.fn();

    const { useFormDialog } = vi.mocked(await import('@/hooks/useFormDialog'));
    useFormDialog.mockReturnValue({
      isOpen: false,
      entity: null,
      open: mockOpenFormDialog,
      close: vi.fn(),
    });

    renderWithProviders(<DocumentLibrary />);

    // Test create action
    const addButton = await screen.findByRole('button', {
      name: 'Add Document Collection',
    });
    await user.click(addButton);
    expect(mockOpenFormDialog).toHaveBeenCalledWith();

    // Test row navigation
    await waitFor(() => {
      expect(screen.getByText('Test Collection 1')).toBeInTheDocument();
    });

    const row = screen.getByText('Test Collection 1').closest('tr');
    await user.click(row);
    expect(mockNavigate).toHaveBeenCalledWith('/document-library/collection/1');
  });

  // Test different dialog states using data-driven approach
  const dialogStateTestCases = [
    {
      dialogType: 'bulk delete confirmation',
      dialogState: {
        isOpen: true,
        type: 'delete',
        data: mockDocuments,
        isBulk: true,
      },
      formDialogState: {
        isOpen: false,
        entity: null,
      },
      expectedTexts: ['Delete Collection', 'Are you sure?'],
    },
    {
      dialogType: 'single delete confirmation',
      dialogState: {
        isOpen: true,
        type: 'delete',
        data: mockDocuments[0],
        isBulk: false,
      },
      formDialogState: {
        isOpen: false,
        entity: null,
      },
      expectedTexts: ['Delete Collection', 'Are you sure?'],
    },
    {
      dialogType: 'create form',
      dialogState: {
        isOpen: false,
        type: null,
        isBulk: false,
        data: null,
      },
      formDialogState: {
        isOpen: true,
        entity: null,
      },
      expectedTexts: [],
    },
    {
      dialogType: 'edit form',
      dialogState: {
        isOpen: false,
        type: null,
        isBulk: false,
        data: null,
      },
      formDialogState: {
        isOpen: true,
        entity: mockDocuments[0],
      },
      expectedTexts: [],
    },
  ];

  dialogStateTestCases.forEach(
    ({ dialogType, dialogState, formDialogState, expectedTexts }) => {
      it(`should display ${dialogType} dialog`, async () => {
        const { useFormDialog } = vi.mocked(
          await import('@/hooks/useFormDialog')
        );
        const { useConfirmationDialog } = vi.mocked(
          await import('@/hooks/useConfirmationDialog')
        );

        useFormDialog.mockReturnValue({
          isOpen: formDialogState.isOpen,
          entity: formDialogState.entity,
          open: vi.fn(),
          close: vi.fn(),
        });

        useConfirmationDialog.mockReturnValue({
          dialog: dialogState,
          open: vi.fn(),
          close: vi.fn(),
          handleConfirm: vi.fn(),
        });

        renderWithProviders(<DocumentLibrary />);

        await waitFor(() => {
          if (expectedTexts.length > 0) {
            expectedTexts.forEach((text) => {
              if (typeof text === 'string') {
                expect(screen.getByText(text)).toBeInTheDocument();
              } else {
                expect(screen.getByText(text)).toBeInTheDocument();
              }
            });
          } else {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
          }
        });
      });
    }
  );
});
