import { render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import WeldOverview from './index';

// Mock the hooks
vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(),
}));

vi.mock('@/hooks/useWeldLogs', () => ({
  useWeldLog: vi.fn(),
}));

vi.mock('@/hooks/useWelds', () => ({
  useWeld: vi.fn(),
  useWeldOperations: vi.fn(() => ({
    updateWeld: vi.fn(),
  })),
}));

vi.mock('@/hooks/useUsers', () => ({
  useUser: vi.fn(),
}));

vi.mock('@/hooks/documents', () => ({
  useDocuments: vi.fn(),
  useDocumentImport: vi.fn(),
}));

vi.mock('@/hooks/firebase/useFirestoreOperations', () => ({
  useFirestoreOperations: vi.fn(() => ({
    documents: [],
    loading: false,
    error: null,
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
  })),
}));

vi.mock('@/hooks/useConfirmationDialog', () => ({
  useConfirmationDialog: vi.fn(() => ({
    dialog: { isOpen: false, data: null },
    open: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mock components that have their own tests
vi.mock('./WeldDetailsCard', () => ({
  WeldDetailsCard: () => (
    <div data-testid="weld-details-card">WeldDetailsCard</div>
  ),
}));

vi.mock('./WeldDocumentsSection', () => ({
  WeldDocumentsSection: () => (
    <div data-testid="weld-documents-section">WeldDocumentsSection</div>
  ),
}));

vi.mock('@/components/layouts/PageHeader', () => ({
  default: ({ title, breadcrumbData }) => (
    <div data-testid="page-header">
      <div>{title}</div>
      <div>{breadcrumbData?.projectName}</div>
      <div>{breadcrumbData?.weldLogName}</div>
      <div>{breadcrumbData?.weldNumber}</div>
    </div>
  ),
}));

vi.mock('@/components/shared/ErrorLoadingWrapper', () => ({
  ErrorLoadingWrapper: ({ children, loading, error }) => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    return <>{children}</>;
  },
}));

// Import hooks after mocking
import { useProject } from '@/hooks/useProjects';
import { useWeldLog } from '@/hooks/useWeldLogs';
import { useWeld } from '@/hooks/useWelds';
import { useUser } from '@/hooks/useUsers';
import { useDocuments, useDocumentImport } from '@/hooks/documents';

describe('WeldOverview', () => {
  const mockProject = {
    id: 'project-123',
    projectName: 'Test Project',
  };

  const mockWeldLog = {
    id: 'weld-log-123',
    name: 'Test Weld Log',
    createdBy: 'user-123',
  };

  const mockWeld = {
    id: 'weld-123',
    number: 'W-001',
    position: '1G',
    parentMaterials: ['mat-1', 'mat-2'],
    fillerMaterials: ['mat-3'],
    description: 'Test weld description',
    heatTreatment: 'PWHT',
    createdAt: new Date('2024-01-01'),
    createdBy: 'user-123',
  };

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockDocuments = [
    { id: 'doc-1', title: 'Document 1' },
    { id: 'doc-2', title: 'Document 2' },
  ];

  const defaultProps = {
    projectId: 'project-123',
    weldLogId: 'weld-log-123',
    weldId: 'weld-123',
  };

  const renderComponent = () => {
    return render(
      <MemoryRouter
        initialEntries={[
          `/projects/${defaultProps.projectId}/weld-logs/${defaultProps.weldLogId}/welds/${defaultProps.weldId}`,
        ]}
      >
        <Routes>
          <Route
            path="/projects/:projectId/weld-logs/:weldLogId/welds/:weldId"
            element={<WeldOverview />}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mock implementations
    useProject.mockReturnValue([mockProject, false, null]);
    useWeldLog.mockReturnValue([mockWeldLog, false, null]);
    useWeld.mockReturnValue([mockWeld, false, null]);
    useUser.mockReturnValue([mockUser]);
    useDocuments.mockReturnValue({
      documents: mockDocuments,
      documentsLoading: false,
      documentsError: null,
      handleUpload: vi.fn(),
      uploadingFiles: [],
      renameDocument: vi.fn(),
      deleteDocument: vi.fn(),
      updateDocumentOrder: vi.fn(),
    });
    useDocumentImport.mockReturnValue({
      importItems: vi.fn(),
      isImporting: false,
    });
  });

  it('renders the page with all sections', async () => {
    renderComponent();

    await waitFor(() => {
      // Check page header is rendered with correct breadcrumb data
      const header = screen.getByTestId('page-header');
      expect(within(header).getByText('Test Project')).toBeInTheDocument();
      expect(within(header).getByText('Test Weld Log')).toBeInTheDocument();
      expect(within(header).getByText('W-001')).toBeInTheDocument();

      // Check main sections are rendered
      expect(screen.getByTestId('weld-details-card')).toBeInTheDocument();
      expect(screen.getByTestId('weld-documents-section')).toBeInTheDocument();
    });
  });

  it('shows loading state when data is loading', () => {
    useProject.mockReturnValue([null, true, null]);
    useWeldLog.mockReturnValue([null, true, null]);
    useWeld.mockReturnValue([null, true, null]);

    renderComponent();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when there is an error loading project', () => {
    const error = new Error('Failed to load project');
    useProject.mockReturnValue([null, false, error]);

    renderComponent();

    expect(
      screen.getByText('Error: Failed to load project')
    ).toBeInTheDocument();
  });

  it('shows error state when there is an error loading weld log', () => {
    const error = new Error('Failed to load weld log');
    useWeldLog.mockReturnValue([null, false, error]);

    renderComponent();

    expect(
      screen.getByText('Error: Failed to load weld log')
    ).toBeInTheDocument();
  });

  it('shows error state when there is an error loading weld', () => {
    const error = new Error('Failed to load weld');
    useWeld.mockReturnValue([null, false, error]);

    renderComponent();

    expect(screen.getByText('Error: Failed to load weld')).toBeInTheDocument();
  });

  it('correctly calls useDocuments with weld entity type', () => {
    renderComponent();

    expect(useDocuments).toHaveBeenCalledWith({
      entityType: 'weld',
      entityId: 'weld-123',
      additionalForeignKeys: {
        projectId: 'project-123',
        weldLogId: 'weld-log-123',
      },
    });
  });

  it('correctly calls useDocumentImport with weld entity type', () => {
    renderComponent();

    expect(useDocumentImport).toHaveBeenCalledWith('weld', 'weld-123');
  });

  it('does not render page header when data is loading', () => {
    useProject.mockReturnValue([null, true, null]);

    renderComponent();

    expect(screen.queryByTestId('page-header')).not.toBeInTheDocument();
  });

  it('does not render page header when there is an error', () => {
    const error = new Error('Failed to load');
    useWeld.mockReturnValue([null, false, error]);

    renderComponent();

    expect(screen.queryByTestId('page-header')).not.toBeInTheDocument();
  });
});
