import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@/test/utils/testUtils';
import ProjectOverview from './index';
import type { Project, ProjectParticipant, User } from '@/types/database';

// Mock dependencies
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: vi.fn(() => ({ projectId: 'test-project-id' })),
}));

vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(),
  useProjectOperations: vi.fn(() => ({
    updateProject: vi.fn(),
  })),
}));

vi.mock('@/hooks/useCrudPage', () => ({
  useCrudPage: vi.fn(() => ({
    confirmDialog: { isOpen: false, type: null, isBulk: false, data: null },
    formDialog: { isOpen: false, entity: null },
    openFormDialog: vi.fn(),
    closeFormDialog: vi.fn(),
    openConfirmDialog: vi.fn(),
    closeConfirmDialog: vi.fn(),
    handleConfirmAction: vi.fn(),
  })),
}));

vi.mock('@/hooks/useProjectParticipants', () => ({
  useProjectParticipants: vi.fn(),
  useParticipantOperations: vi.fn(() => ({
    addParticipant: vi.fn(),
    updateParticipant: vi.fn(),
    removeParticipant: vi.fn(),
  })),
}));

vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(() => [[], false, null] as [User[], boolean, Error | null]),
}));

// Mock child components
vi.mock('./ParticipantsTable', () => ({
  ParticipantsTable: vi.fn(({ onAddParticipant }: any) => (
    <div data-testid="participants-table">
      <button onClick={onAddParticipant}>Add Participant</button>
    </div>
  )),
}));

vi.mock('./ParticipantFormDialog', () => ({
  ParticipantFormDialog: vi.fn(() => null),
}));

vi.mock('../projects/ProjectFormDialog', () => ({
  ProjectFormDialog: vi.fn(() => null),
}));

vi.mock('@/components/shared/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ isOpen, title, description, actionLabel }: any) =>
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button>{actionLabel}</button>
      </div>
    ) : null,
}));

describe('ProjectOverview', () => {
  const mockProject: Project = {
    id: 'test-project-id',
    projectName: 'Test Project',
    projectNumber: 'P123',
    customer: 'Test Customer',
    description: 'Test Description',
    externalReference: 'EXT-123',
    fillerMaterialTraceable: true,
    parentMaterialTraceable: false,
  } as Project;

  const mockParticipants: ProjectParticipant[] = [
    { id: '1', userId: 'user1', projectId: 'test-project-id', role: 'WELDER' } as ProjectParticipant,
    { id: '2', userId: 'user2', projectId: 'test-project-id', role: 'INSPECTOR' } as ProjectParticipant,
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    const { useProject } = await import('@/hooks/useProjects');
    const { useProjectParticipants } = await import(
      '@/hooks/useProjectParticipants'
    );

    (useProject as any).mockReturnValue([mockProject, false, null]);
    (useProjectParticipants as any).mockReturnValue([mockParticipants, false, null]);
  });

  // Critical user journeys
  it('should display project overview with key information', async () => {
    renderWithProviders(<ProjectOverview />);

    await waitFor(() => {
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
      expect(screen.getByText('Project Details')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('P123')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
  });

  it('should have dropdown menu button for actions', async () => {
    renderWithProviders(<ProjectOverview />);

    await waitFor(() => {
      expect(screen.getByText('Project Details')).toBeInTheDocument();
    });

    // Verify there's a dropdown menu button (with aria-haspopup="menu")
    const buttons = screen.getAllByRole('button');
    const menuButton = buttons.find(
      (btn) => btn.getAttribute('aria-haspopup') === 'menu'
    );

    expect(menuButton).toBeInTheDocument();
  });

  it('should render participants table', async () => {
    renderWithProviders(<ProjectOverview />);

    await waitFor(() => {
      expect(screen.getByTestId('participants-table')).toBeInTheDocument();
      expect(screen.getByText('Add Participant')).toBeInTheDocument();
    });
  });

  // Loading state
  it('should display loading state', async () => {
    const { useProject } = await import('@/hooks/useProjects');
    const { useProjectParticipants } = await import(
      '@/hooks/useProjectParticipants'
    );

    (useProject as any).mockReturnValue([null, true, null]);
    (useProjectParticipants as any).mockReturnValue([[], false, null]);

    renderWithProviders(<ProjectOverview />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // Error states
  it('should display error state for project', async () => {
    const { useProject } = await import('@/hooks/useProjects');
    const { useProjectParticipants } = await import(
      '@/hooks/useProjectParticipants'
    );

    (useProject as any).mockReturnValue([
      null,
      false,
      new Error('Failed to load project'),
    ]);
    (useProjectParticipants as any).mockReturnValue([[], false, null]);

    renderWithProviders(<ProjectOverview />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load project/)).toBeInTheDocument();
    });
  });

  it('should display error state for participants', async () => {
    const { useProject } = await import('@/hooks/useProjects');
    const { useProjectParticipants } = await import(
      '@/hooks/useProjectParticipants'
    );

    (useProject as any).mockReturnValue([mockProject, false, null]);
    (useProjectParticipants as any).mockReturnValue([
      null,
      false,
      new Error('Failed to load participants'),
    ]);

    renderWithProviders(<ProjectOverview />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading/)).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to load participants/)
      ).toBeInTheDocument();
    });
  });

  // Handle null data gracefully
  it('should handle null project gracefully', async () => {
    const { useProject } = await import('@/hooks/useProjects');
    const { useProjectParticipants } = await import(
      '@/hooks/useProjectParticipants'
    );

    (useProject as any).mockReturnValue([null, false, null]);
    (useProjectParticipants as any).mockReturnValue([[], false, null]);

    renderWithProviders(<ProjectOverview />);

    // Should not show content when project is null
    expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Details')).not.toBeInTheDocument();
  });
});