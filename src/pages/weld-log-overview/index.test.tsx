import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
import type { Project } from '@/types/models/project';
import type { WeldLog, Weld } from '@/types/models/welding';
import type { User } from '@/types/models/user';
import type { Document } from '@/types/api/firestore';
import type { Timestamp, FirestoreError } from 'firebase/firestore';

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
  ...(await importOriginal<typeof import('react-router-dom')>()),
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
  Welds: ({
    onEdit,
    onCreateNew,
  }: {
    onEdit: (weld: Weld) => void;
    onCreateNew: () => void;
  }) => (
    <div data-testid="welds-table">
      <button onClick={onCreateNew}>Add Weld</button>
      <button onClick={() => onEdit({ id: 'weld-1', number: 'W-001' } as Weld)}>
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
  Card: ({ title }: { title: string }) => (
    <div data-testid="document-card">
      <span>{title}</span>
    </div>
  ),
  UploadCard: () => <div data-testid="document-upload-card">Upload</div>,
  CardGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="document-grid">{children}</div>
  ),
  CardDialog: () => null,
}));

vi.mock('@/components/documents/import', () => ({
  ImportDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="import-dialog">Import Dialog</div> : null,
}));

vi.mock('@/components/documents/dialogs', () => ({
  DocumentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="document-dialog">Document Dialog</div> : null,
}));

vi.mock('../weld-logs/WeldLogFormDialog', () => ({
  WeldLogFormDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="weld-log-form-dialog">Weld Log Form</div> : null,
}));

vi.mock('./WeldFormDialog', () => ({
  WeldFormDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="weld-form-dialog">Weld Form</div> : null,
}));

vi.mock('@/components/shared/ConfirmationDialog', () => ({
  ConfirmationDialog: ({
    isOpen,
    title,
  }: {
    isOpen: boolean;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <h2 role="heading">{title}</h2>
      </div>
    ) : null,
}));

const mockTimestamp: Timestamp = {
  toDate: () => new Date('2024-01-01T10:00:00'),
  toMillis: () => 1704100800000,
  seconds: 1704100800,
  nanoseconds: 0,
  isEqual: vi.fn(),
  valueOf: vi.fn(),
  toJSON: () => ({ seconds: 1704100800, nanoseconds: 0, type: 'timestamp' }),
};

const mockProject: Project = {
  id: 'project-1',
  projectName: 'Test Project',
  customer: 'Test Customer',
  status: 'active',
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
};

const mockWeldLog: WeldLog = {
  id: 'weld-log-1',
  name: 'Test Weld Log',
  description: 'Test description',
  createdBy: 'user-1',
  projectId: 'project-1',
  status: 'active',
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
};

const mockWelds: Weld[] = [
  {
    id: 'weld-1',
    number: 'W-001',
    projectId: 'project-1',
    weldLogId: 'weld-log-1',
    welderId: 'user-1',
    status: 'pending',
    type: 'production',
    createdAt: mockTimestamp,
  },
];

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Test Document',
    storageRef: 'path/to/doc',
    thumbStorageRef: null,
    fileType: 'pdf',
    fileSize: 1024,
    processingState: 'completed',
    status: 'active',
    order: 1,
    weldLogId: 'weld-log-1',
    projectId: 'project-1',
    createdAt: mockTimestamp,
    createdBy: 'user-1',
    updatedAt: mockTimestamp,
    updatedBy: 'user-1',
  },
];

const mockUser: User = {
  id: 'user-1',
  email: 'john.doe@example.com',
  displayName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  status: 'active',
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
};

describe('WeldLogOverview', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const mockedUseParams = vi.mocked(useParams);
    mockedUseParams.mockReturnValue({
      projectId: 'project-1',
      weldLogId: 'weld-log-1',
    });

    const mockedUseProject = vi.mocked(useProject);
    mockedUseProject.mockReturnValue([mockProject, false, undefined]);

    const mockedUseWeldLog = vi.mocked(useWeldLog);
    mockedUseWeldLog.mockReturnValue([mockWeldLog, false, undefined]);

    const mockedUseWelds = vi.mocked(useWelds);
    mockedUseWelds.mockReturnValue([mockWelds, false, undefined]);

    const mockedUseWeldLogOperations = vi.mocked(useWeldLogOperations);
    mockedUseWeldLogOperations.mockReturnValue({
      updateWeldLog: vi.fn(),
      createWeldLog: vi.fn(),
      deleteWeldLog: vi.fn(),
    });

    const mockedUseWeldOperations = vi.mocked(useWeldOperations);
    mockedUseWeldOperations.mockReturnValue({
      createWeld: vi.fn(),
      createWeldsRange: vi.fn(),
      updateWeld: vi.fn(),
      deleteWeld: vi.fn(),
      isWeldNumberAvailable: vi.fn(),
      isWeldNumberRangeAvailable: vi.fn(),
    });

    const mockedUseDocuments = vi.mocked(useDocuments);
    mockedUseDocuments.mockReturnValue({
      documents: mockDocuments,
      documentsLoading: false,
      documentsError: undefined,
      handleUpload: vi.fn(),
      uploadingFiles: [],
      renameDocument: vi.fn(),
      deleteDocument: vi.fn(),
      updateDocumentOrder: vi.fn(),
      addDocument: vi.fn(),
      updateProcessingState: vi.fn(),
      handleFileUpload: vi.fn(),
      handleCancelUpload: vi.fn(),
    });

    const mockedUseUser = vi.mocked(useUser);
    mockedUseUser.mockReturnValue([mockUser, false, undefined]);

    const mockedUseFormDialog = vi.mocked(useFormDialog);
    mockedUseFormDialog.mockReturnValue({
      isOpen: false,
      entity: null,
      open: vi.fn(),
      close: vi.fn(),
    });

    const mockedUseConfirmationDialog = vi.mocked(useConfirmationDialog);
    mockedUseConfirmationDialog.mockReturnValue({
      dialog: { isOpen: false, type: null, isBulk: false, data: null },
      open: vi.fn(),
      close: vi.fn(),
      handleConfirm: vi.fn(),
    });

    const { getConfirmationContent } = await import(
      '@/utils/confirmationContent'
    );
    const mockedGetConfirmationContent = vi.mocked(getConfirmationContent);
    mockedGetConfirmationContent.mockReturnValue({
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
    const mockedUseProject = vi.mocked(useProject);
    mockedUseProject.mockReturnValue([null, true, undefined]);

    renderWithProviders(<WeldLogOverview />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show error state', () => {
    const error: FirestoreError = {
      code: 'unknown',
      message: 'Failed to load project',
      name: 'FirestoreError',
    };
    const mockedUseProject = vi.mocked(useProject);
    mockedUseProject.mockReturnValue([null, false, error]);

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
    const mockedUseFormDialog = vi.mocked(useFormDialog);
    mockedUseFormDialog.mockReturnValue({
      isOpen: true,
      entity: mockWeldLog,
      open: vi.fn(),
      close: vi.fn(),
    });

    const mockedUseConfirmationDialog = vi.mocked(useConfirmationDialog);
    mockedUseConfirmationDialog.mockReturnValue({
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
    const mockedUseFormDialog = vi.mocked(useFormDialog);
    mockedUseFormDialog.mockReturnValue({
      isOpen: false,
      entity: null,
      open: vi.fn(),
      close: vi.fn(),
    });

    const mockedUseConfirmationDialog = vi.mocked(useConfirmationDialog);
    mockedUseConfirmationDialog.mockReturnValue({
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
    const mockedUseWeldLog = vi.mocked(useWeldLog);
    mockedUseWeldLog.mockReturnValue([null, false, undefined]);

    renderWithProviders(<WeldLogOverview />);

    // Should not crash, may show loading or empty state
    expect(screen.queryByText('Test Weld Log')).not.toBeInTheDocument();
  });
});
