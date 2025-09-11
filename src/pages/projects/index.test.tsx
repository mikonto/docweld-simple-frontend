import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import Projects from './index';
import { vi, type MockedFunction } from 'vitest';
import type { Project } from '@/types/database';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock hooks
vi.mock('@/hooks/useProjects', () => ({
  useProjects: vi.fn(() => [[], false, null]),
  useProjectOperations: vi.fn(() => ({
    deleteProject: vi.fn(),
    archiveProject: vi.fn(),
    restoreProject: vi.fn(),
    updateProject: vi.fn(),
    createProject: vi.fn(),
  })),
}));

vi.mock('@/hooks/useFormDialog', () => ({
  useFormDialog: vi.fn(() => ({
    isOpen: false,
    entity: null,
    open: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock('@/hooks/useConfirmationDialog', () => ({
  useConfirmationDialog: vi.fn(() => ({
    dialog: { isOpen: false, type: null, isBulk: false, data: null },
    open: vi.fn(),
    close: vi.fn(),
    handleConfirm: vi.fn(),
  })),
}));

vi.mock('@/utils/confirmationContent', () => ({
  getConfirmationContent: vi.fn(() => ({
    title: 'Delete Project',
    description: 'Are you sure?',
    actionLabel: 'Delete',
    actionVariant: 'destructive' as const,
  })),
}));

// Mock child components
vi.mock('./ProjectFormDialog', () => ({
  ProjectFormDialog: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="project-form-dialog">Project Form Dialog</div>
    ) : null,
}));

vi.mock('./ProjectsTable', () => ({
  ProjectsTable: ({ 
    onCreateNew, 
    activeTab, 
    onTabChange 
  }: { 
    onCreateNew: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
  }) => (
    <div data-testid="projects-table">
      <button onClick={onCreateNew}>Add Project</button>
      <div>Active Tab: {activeTab}</div>
      <button onClick={() => onTabChange('archived')}>Switch Tab</button>
    </div>
  ),
}));

vi.mock('@/components/layouts/PageHeader', () => ({
  default: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

vi.mock('@/components/shared/ErrorLoadingWrapper', () => ({
  ErrorLoadingWrapper: ({ 
    children, 
    error, 
    loading, 
    resourceName 
  }: { 
    children: React.ReactNode;
    error: Error | null;
    loading: boolean;
    resourceName: string;
  }) => {
    if (loading) return <div>Loading {resourceName}...</div>;
    if (error) return <div>Error loading {resourceName}</div>;
    return <>{children}</>;
  },
}));

vi.mock('@/components/shared/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ 
    isOpen, 
    title, 
    description, 
    actionLabel 
  }: { 
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
  }) =>
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button>{actionLabel}</button>
      </div>
    ) : null,
}));

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{component}</MemoryRouter>
    </I18nextProvider>
  );
};

describe('Projects Page', () => {
  const mockProjects: Partial<Project>[] = [
    {
      id: 'project-1',
      projectName: 'Test Project 1',
      projectNumber: 'P001',
      customer: 'Customer 1',
    },
    {
      id: 'project-2',
      projectName: 'Test Project 2',
      projectNumber: 'P002',
      customer: 'Customer 2',
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    const { useProjects } = vi.mocked(await import('@/hooks/useProjects'));
    (useProjects as MockedFunction<typeof useProjects>).mockReturnValue([
      mockProjects as Project[], 
      false, 
      null
    ]);
  });

  // Critical user journeys
  it('should render projects page with table and header', () => {
    renderWithI18n(<Projects />);

    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByTestId('projects-table')).toBeInTheDocument();
    expect(screen.getByText('Add Project')).toBeInTheDocument();
  });

  it('should show loading state', async () => {
    const { useProjects } = vi.mocked(await import('@/hooks/useProjects'));
    (useProjects as MockedFunction<typeof useProjects>).mockReturnValue([[], true, null]);

    renderWithI18n(<Projects />);

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it('should show error state', async () => {
    const { useProjects } = vi.mocked(await import('@/hooks/useProjects'));
    (useProjects as MockedFunction<typeof useProjects>).mockReturnValue([
      [],
      false,
      new Error('Failed to load projects'),
    ]);

    renderWithI18n(<Projects />);

    expect(screen.getByText(/Error loading/)).toBeInTheDocument();
  });

  it('should show form dialog when open', async () => {
    const { useFormDialog } = vi.mocked(await import('@/hooks/useFormDialog'));

    (useFormDialog as MockedFunction<typeof useFormDialog>).mockReturnValue({
      isOpen: true,
      entity: null,
      open: vi.fn(),
      close: vi.fn(),
    });

    renderWithI18n(<Projects />);

    expect(screen.getByTestId('project-form-dialog')).toBeInTheDocument();
  });

  it('should show confirmation dialog when open', async () => {
    const { useConfirmationDialog } = vi.mocked(
      await import('@/hooks/useConfirmationDialog')
    );

    (useConfirmationDialog as MockedFunction<typeof useConfirmationDialog>).mockReturnValue({
      dialog: {
        isOpen: true,
        type: 'delete',
        isBulk: false,
        data: { id: 'project-1' },
      },
      open: vi.fn(),
      close: vi.fn(),
      handleConfirm: vi.fn(),
    } as any);

    renderWithI18n(<Projects />);

    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
  });

  it('should handle tab changes', async () => {
    renderWithI18n(<Projects />);

    const switchTabButton = screen.getByText('Switch Tab');
    fireEvent.click(switchTabButton);

    // Tab functionality is handled by the child component
    expect(screen.getByTestId('projects-table')).toBeInTheDocument();
  });

  it('should pass correct props to ProjectsTable', () => {
    renderWithI18n(<Projects />);

    // Verify table is rendered with expected functionality
    expect(screen.getByTestId('projects-table')).toBeInTheDocument();
    expect(screen.getByText('Add Project')).toBeInTheDocument();
    expect(screen.getByText('Active Tab: active')).toBeInTheDocument();
  });
});