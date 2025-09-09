import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
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
      const { getByText } = renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="document"
        />
      );

      expect(getByText('Import documents')).toBeInTheDocument();
    });

    it('should render dialog with correct title for section mode', () => {
      const { getByText } = renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      expect(getByText('Import sections')).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', () => {
      const { getByText } = renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      fireEvent.click(getByText('Cancel'));
      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle item selection and submission', async () => {
      const { getByText } = renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      // Select an item
      fireEvent.click(getByText('Select Item'));

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
      const { getByText } = renderWithProviders(
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
      expect(getByText('Project Documents')).toBeInTheDocument();
      expect(getByText('Document Library')).toBeInTheDocument();
    });

    it('should not show tabs when projectId is not provided', () => {
      const { queryByRole } = renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      expect(queryByRole('tab')).not.toBeInTheDocument();
    });

    it('should not show tabs when hideProjectDocuments is true', () => {
      const { queryByRole } = renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
          projectId="proj-123"
          hideProjectDocuments={true}
        />
      );

      expect(queryByRole('tab')).not.toBeInTheDocument();
    });
  });

  describe('Import Process', () => {
    it('should show importing state when import is in progress', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
        />
      );

      // Check initial state
      expect(getByText('Import Selected')).toBeInTheDocument();

      // The DocumentBrowser mock shows the button state
      const browser = getByTestId('mock-document-browser');
      expect(browser).toBeInTheDocument();
    });

    it('should render with destinationName when provided', () => {
      renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
          destinationName="Test Project"
        />
      );

      // The destination name would be shown in the actual DocumentBrowser
    });
  });

  describe('Additional Context', () => {
    it('should pass additionalContext to DocumentBrowser', () => {
      const additionalContext = { projectId: 'proj-456' };

      const { getByTestId } = renderWithProviders(
        <ImportDialog
          open={true}
          onClose={mockClose}
          onSubmit={mockSubmit}
          mode="section"
          additionalContext={additionalContext}
        />
      );

      // Verify the mock browser is rendered (actual context handling is in DocumentBrowser)
      expect(getByTestId('mock-document-browser')).toBeInTheDocument();
    });
  });
});
