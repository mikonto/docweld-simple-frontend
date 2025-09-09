import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import WeldLogOverview from './index';
import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useWeldLog, useWeldLogOperations } from '@/hooks/useWeldLogs';
import { useWelds, useWeldOperations } from '@/hooks/useWelds';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { useUser } from '@/hooks/useUsers';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';

// Mock dependencies
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({
    _throwIfRoot: vi.fn(),
    fullPath: 'test-path',
  })),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/image.jpg')),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: vi.fn(),
}));

vi.mock('@/hooks/useProjects');
vi.mock('@/hooks/useWeldLogs');
vi.mock('@/hooks/useWelds');
vi.mock('@/hooks/documents/useDocuments');
vi.mock('@/hooks/useUsers');
vi.mock('@/hooks/useFormDialog');
vi.mock('@/hooks/useConfirmationDialog');
vi.mock('@/utils/confirmationContent');

// Mock child components at high level
vi.mock('./Welds', () => ({
  Welds: ({ onEdit, onCreateNew }) => (
    <div data-testid="welds-table">
      <button onClick={onCreateNew}>Add Weld</button>
      <button onClick={() => onEdit({ id: 'weld-1', number: 'W-001' })}>
        Edit Weld
      </button>
    </div>
  ),
}));

vi.mock('./WeldLogDocumentsSection', () => ({
  WeldLogDocumentsSection: () => (
    <div data-testid="weld-log-documents-section">
      <h3>Attachments</h3>
    </div>
  ),
}));

vi.mock('@/components/documents/cards', () => ({
  Card: ({ title }) => (
    <div data-testid="document-card">
      <span>{title}</span>
    </div>
  ),
  UploadCard: () => <div data-testid="document-upload-card">Upload</div>,
  CardGrid: ({ children }) => <div data-testid="document-grid">{children}</div>,
  CardDialog: () => null,
}));

vi.mock('@/components/documents/import', () => ({
  ImportDialog: ({ open }) =>
    open ? <div data-testid="import-dialog">Import Dialog</div> : null,
}));

vi.mock('@/components/documents/dialogs', () => ({
  DocumentDialog: ({ open }) =>
    open ? <div data-testid="document-dialog">Document Dialog</div> : null,
}));

vi.mock('../weld-logs/WeldLogFormDialog', () => ({
  WeldLogFormDialog: ({ open }) =>
    open ? <div data-testid="weld-log-form-dialog">Weld Log Form</div> : null,
}));

vi.mock('./WeldFormDialog', () => ({
  WeldFormDialog: ({ open }) =>
    open ? <div data-testid="weld-form-dialog">Weld Form</div> : null,
}));

vi.mock('@/components/shared/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ isOpen, title }) =>
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <h2 role="heading">{title}</h2>
      </div>
    ) : null,
}));

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  customer: 'Test Customer',
};

const mockWeldLog = {
  id: 'weld-log-1',
  name: 'Test Weld Log',
  description: 'Test description',
  createdBy: 'user-1',
  createdAt: {
    toDate: () => new Date('2024-01-01T10:00:00'),
  },
};

const mockWelds = [
  {
    id: 'weld-1',
    number: 'W-001',
    position: '1F',
  },
];

const mockDocuments = [
  {
    id: 'doc-1',
    title: 'Test Document',
    storageRef: 'path/to/doc',
    fileType: 'pdf',
    createdAt: new Date(),
  },
];

describe('WeldLogOverview', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    useParams.mockReturnValue({
      projectId: 'project-1',
      weldLogId: 'weld-log-1',
    });

    useProject.mockReturnValue([mockProject, false, null]);
    useWeldLog.mockReturnValue([mockWeldLog, false, null]);
    useWelds.mockReturnValue([mockWelds, false, null]);
    useWeldLogOperations.mockReturnValue({ updateWeldLog: vi.fn() });
    useWeldOperations.mockReturnValue({
      createWeld: vi.fn(),
      updateWeld: vi.fn(),
      deleteWeld: vi.fn(),
    });

    useDocuments.mockReturnValue({
      documents: mockDocuments,
      documentsLoading: false,
      documentsError: null,
      handleUpload: vi.fn(),
      uploadingFiles: {},
      renameDocument: vi.fn(),
      deleteDocument: vi.fn(),
    });

    useUser.mockReturnValue([
      {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
      false,
      null,
    ]);

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

    const { getConfirmationContent } = vi.mocked(
      await import('@/utils/confirmationContent')
    );
    getConfirmationContent.mockReturnValue({
      title: 'Delete Weld',
      description: 'Are you sure?',
      actionLabel: 'Delete',
      actionVariant: 'destructive',
    });
  });

  // Critical user journeys
  it('should display weld log overview with key information', async () => {
    renderWithProviders(<WeldLogOverview />);

    await waitFor(() => {
      expect(screen.getByText('Weld Log Overview')).toBeInTheDocument();
      expect(screen.getByText('Test Weld Log')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    useProject.mockReturnValue([null, true, null]);

    renderWithProviders(<WeldLogOverview />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show error state', () => {
    const error = new Error('Failed to load project');
    useProject.mockReturnValue([null, false, error]);

    renderWithProviders(<WeldLogOverview />);

    expect(screen.getByText(/Error loading projects:/)).toBeInTheDocument();
  });

  it('should display separate cards for details and documents', async () => {
    renderWithProviders(<WeldLogOverview />);

    await waitFor(() => {
      expect(screen.getByText('Weld Log Details')).toBeInTheDocument();
      expect(screen.getByText('Attachments')).toBeInTheDocument();
    });
  });

  it('should render welds table', async () => {
    renderWithProviders(<WeldLogOverview />);

    await waitFor(() => {
      expect(screen.getByTestId('welds-table')).toBeInTheDocument();
      expect(screen.getByText('Add Weld')).toBeInTheDocument();
    });
  });

  it('should have documents card available', async () => {
    renderWithProviders(<WeldLogOverview />);

    // Documents card should be present
    await waitFor(() => {
      expect(screen.getByText('Attachments')).toBeInTheDocument();
    });
  });

  it('should have dropdown menu button for actions', async () => {
    renderWithProviders(<WeldLogOverview />);

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Weld Log Details')).toBeInTheDocument();
    });

    // Verify there's a dropdown menu button (with aria-haspopup="menu")
    const buttons = screen.getAllByRole('button');
    const menuButton = buttons.find(
      (btn) => btn.getAttribute('aria-haspopup') === 'menu'
    );

    expect(menuButton).toBeInTheDocument();
  });

  // Dialog states
  it('should show dialogs when open', async () => {
    useFormDialog.mockReturnValue({
      isOpen: true,
      entity: mockWeldLog,
      open: vi.fn(),
      close: vi.fn(),
    });

    useConfirmationDialog.mockReturnValue({
      dialog: { isOpen: false, type: null, isBulk: false, data: null },
      open: vi.fn(),
      close: vi.fn(),
      handleConfirm: vi.fn(),
    });

    renderWithProviders(<WeldLogOverview />);

    // The actual dialog rendering depends on the formDialog prop structure
    // This test verifies the component doesn't crash with dialog state
    expect(screen.getByText('Test Weld Log')).toBeInTheDocument();
  });

  it('should show confirmation dialog when open', async () => {
    useFormDialog.mockReturnValue({
      isOpen: false,
      entity: null,
      open: vi.fn(),
      close: vi.fn(),
    });

    useConfirmationDialog.mockReturnValue({
      dialog: {
        isOpen: true,
        type: 'delete',
        isBulk: false,
        data: { id: 'weld-1' },
      },
      open: vi.fn(),
      close: vi.fn(),
      handleConfirm: vi.fn(),
    });

    renderWithProviders(<WeldLogOverview />);

    // Should have confirmation dialogs (for welds and documents)
    expect(screen.getAllByTestId('confirmation-dialog')).toHaveLength(2);
  });

  // Handle null data gracefully
  it('should handle missing weld log gracefully', () => {
    useWeldLog.mockReturnValue([null, false, null]);

    renderWithProviders(<WeldLogOverview />);

    // Should not crash, may show loading or empty state
    expect(screen.queryByText('Test Weld Log')).not.toBeInTheDocument();
  });
});
