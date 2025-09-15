import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import WeldLogs from './index';
import type { Project } from '@/types/models/project';
import type { WeldLog } from '@/types/models/welding';
import type { WeldLogFormData } from '@/types/forms';
import type { FirestoreError, Timestamp } from 'firebase/firestore';
import { mockTimestamp } from '@/test/utils/mockTimestamp';

// Mock hooks
vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(),
}));

vi.mock('@/hooks/useWeldLogs', () => ({
  useWeldLogs: vi.fn(),
  useWeldLogOperations: vi.fn(),
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

// Mock child components
vi.mock('./WeldLogFormDialog', () => ({
  WeldLogFormDialog: vi.fn(({ open }: { open: boolean }) =>
    open ? <div data-testid="weld-log-form-dialog" /> : null
  ),
}));

vi.mock('./WeldLogsTable', () => ({
  WeldLogsTable: vi.fn(
    ({ onRowClick }: { onRowClick: (row: WeldLog) => void }) => (
      <div data-testid="weld-logs-table">
        <button onClick={() => onRowClick({ id: 'log-123' } as WeldLog)}>
          Row Click
        </button>
      </div>
    )
  ),
}));

vi.mock('@/components/shared/ConfirmationDialog', () => ({
  ConfirmationDialog: vi.fn(({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="confirmation-dialog" /> : null
  ),
}));

const mockNavigate = vi.fn();
vi.mock('@/components/layouts/PageHeader', () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ projectId: 'project-123' }),
  };
});

// Import hooks after mocking
import { useProject } from '@/hooks/useProjects';
import { useWeldLogs, useWeldLogOperations } from '@/hooks/useWeldLogs';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';

// Define return types
type UseWeldLogOperationsReturn = {
  createWeldLog: (
    projectId: string,
    weldLogData: WeldLogFormData
  ) => Promise<string>;
  updateWeldLog: (
    weldLogId: string,
    updates: Partial<WeldLog>
  ) => Promise<void>;
  deleteWeldLog: (weldLogId: string, projectId: string) => Promise<void>;
};

describe('WeldLogs', () => {
  const mockProject: Project = {
    id: 'project-123',
    projectName: 'Test Project',
    customer: 'Test Customer',
    status: 'active',
    createdAt: mockTimestamp as Timestamp,
    updatedAt: mockTimestamp as Timestamp,
  };

  const mockWeldLogs: WeldLog[] = [
    {
      id: '1',
      name: 'WL-001',
      description: 'Test weld log 1',
      projectId: 'project-123',
      status: 'active',
      createdAt: mockTimestamp as Timestamp,
      updatedAt: mockTimestamp as Timestamp,
      createdBy: 'user-123',
    },
    {
      id: '2',
      name: 'WL-002',
      description: 'Test weld log 2',
      projectId: 'project-123',
      status: 'active',
      createdAt: mockTimestamp as Timestamp,
      updatedAt: mockTimestamp as Timestamp,
      createdBy: 'user-123',
    },
  ];

  const mockFormDialog = {
    isOpen: false,
    entity: null,
    open: vi.fn(),
    close: vi.fn(),
  };

  const mockConfirmDialog = {
    dialog: { isOpen: false, type: null, isBulk: false, data: null },
    open: vi.fn(),
    close: vi.fn(),
    handleConfirm: vi.fn(),
  };

  const mockOperations: UseWeldLogOperationsReturn = {
    createWeldLog: vi.fn(),
    updateWeldLog: vi.fn(),
    deleteWeldLog: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    (useProject as MockedFunction<typeof useProject>).mockReturnValue([
      mockProject,
      false,
      undefined,
    ]);
    (useWeldLogs as MockedFunction<typeof useWeldLogs>).mockReturnValue([
      mockWeldLogs,
      false,
      undefined,
    ]);
    (
      useWeldLogOperations as MockedFunction<typeof useWeldLogOperations>
    ).mockReturnValue(mockOperations);
    (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue(
      mockFormDialog
    );
    (
      useConfirmationDialog as MockedFunction<typeof useConfirmationDialog>
    ).mockReturnValue(mockConfirmDialog);
    (
      getConfirmationContent as MockedFunction<typeof getConfirmationContent>
    ).mockReturnValue({
      title: 'Delete Weld Log',
      description: 'Are you sure?',
      actionLabel: 'Delete',
      actionVariant: 'destructive',
    });
  });

  // Critical user journeys
  it('should display weld logs page with table', () => {
    renderWithProviders(<WeldLogs />);

    expect(screen.getByText('Weld Logs')).toBeInTheDocument();
    expect(screen.getByTestId('weld-logs-table')).toBeInTheDocument();
  });

  it('should navigate to weld log details on row click', async () => {
    renderWithProviders(<WeldLogs />);

    const rowButton = screen.getByText('Row Click');
    await userEvent.click(rowButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/projects/project-123/weld-logs/log-123'
    );
  });

  // Loading states
  it('should show project loading state', () => {
    (useProject as MockedFunction<typeof useProject>).mockReturnValue([
      null,
      true,
      undefined,
    ]);

    renderWithProviders(<WeldLogs />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show weld logs loading state', () => {
    (useWeldLogs as MockedFunction<typeof useWeldLogs>).mockReturnValue([
      [],
      true,
      undefined,
    ]);

    renderWithProviders(<WeldLogs />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // Error states
  it('should show project error state', () => {
    (useProject as MockedFunction<typeof useProject>).mockReturnValue([
      null,
      false,
      new Error('Failed to load project') as FirestoreError,
    ]);

    renderWithProviders(<WeldLogs />);

    expect(screen.getByText(/Error loading/)).toBeInTheDocument();
  });

  it('should show weld logs error state', () => {
    (useWeldLogs as MockedFunction<typeof useWeldLogs>).mockReturnValue([
      [],
      false,
      new Error('Failed to load weld logs') as FirestoreError,
    ]);

    renderWithProviders(<WeldLogs />);

    expect(screen.getByText(/Error loading/)).toBeInTheDocument();
  });

  // Dialog states
  it('should render form dialog when open', () => {
    (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
      ...mockFormDialog,
      isOpen: true,
      entity: null,
    });

    renderWithProviders(<WeldLogs />);

    expect(screen.getByTestId('weld-log-form-dialog')).toBeInTheDocument();
  });

  it('should render confirmation dialog when open', () => {
    (
      useConfirmationDialog as MockedFunction<typeof useConfirmationDialog>
    ).mockReturnValue({
      ...mockConfirmDialog,
      dialog: {
        isOpen: true,
        type: 'delete',
        isBulk: false,
        data: null,
      },
    });

    renderWithProviders(<WeldLogs />);

    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
  });
});
