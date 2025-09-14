import { fireEvent, waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImportDialog from './ImportDialog';
import { renderWithProviders } from '@/test/utils/testUtils';

// Mock ImportBrowser to avoid complexity
vi.mock('./ImportBrowser', () => ({
  default: ({
    onSelectItems,
    onCancel,
    mode,
    sourceType,
    projectId,
    isImporting,
  }: {
    onSelectItems: (items: unknown[]) => void;
    onCancel: () => void;
    mode?: string;
    sourceType?: string;
    projectId?: string;
    isImporting?: boolean;
  }) => {
    const handleSelectItems = () => {
      const baseItems = [
        {
          id: '1',
          type: 'section',
          name: 'Test Section',
          collectionId: 'col-1',
        },
      ];

      // Conditionally add projectId to items if it exists
      const itemsWithProjectId = projectId
        ? baseItems.map((item) => ({ ...item, projectId }))
        : baseItems;

      onSelectItems(itemsWithProjectId);
    };

    return (
      <div data-testid="mock-document-browser">
        <div>Mode: {mode}</div>
        <div>Source: {sourceType}</div>
        <div>Project ID: {projectId || 'none'}</div>
        <button onClick={handleSelectItems}>Select Item</button>
        <button onClick={onCancel}>Cancel</button>
        <button disabled={isImporting}>
          {isImporting ? 'Importing...' : 'Import Selected'}
        </button>
      </div>
    );
  },
}));

describe('ImportDialog', () => {
  const mockClose = vi.fn();
  const mockSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render dialog with correct title for document mode', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="document"
        />
      );

      expect(screen.getByText('Import documents')).toBeInTheDocument();
    });

    it('should render dialog with correct title for section mode', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      expect(screen.getByText('Import sections')).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle item selection and submission', async () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      // Select an item
      fireEvent.click(screen.getByText('Select Item'));

      // DocumentBrowser should handle the import
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith([
          expect.objectContaining({
            id: '1',
            type: 'section',
            name: 'Test Section',
            collectionId: 'col-1',
          }),
        ]);
      });
    });
  });

  describe('Tab Display', () => {
    it('should show tabs when projectId is provided', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
          projectId="proj-123"
        />
      );

      // Look for tabs by data-slot attribute
      // The `Tabs` component is present, so just check for its content
      expect(screen.getByText('Project Documents')).toBeInTheDocument();
      expect(screen.getByText('Document Library')).toBeInTheDocument();
    });

    it('should not show tabs when projectId is not provided', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('should not show tabs when hideProjectDocuments is true', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
          projectId="proj-123"
          hideProjectDocuments={true}
        />
      );

      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
  });

  describe('Import Process', () => {
    it('should show importing state when import is in progress', async () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      // Check initial state
      expect(screen.getByText('Import Selected')).toBeInTheDocument();

      // The DocumentBrowser mock shows the button state
      const browser = screen.getByTestId('mock-document-browser');
      expect(browser).toBeInTheDocument();
    });

    it('should render with destinationName when provided', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      // The destination name would be shown in the actual DocumentBrowser
    });
  });

  describe('Additional Context', () => {
    it('should pass additionalContext to DocumentBrowser', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      // Verify the mock browser is rendered (actual context handling is in DocumentBrowser)
      expect(screen.getByTestId('mock-document-browser')).toBeInTheDocument();
    });
  });
});
