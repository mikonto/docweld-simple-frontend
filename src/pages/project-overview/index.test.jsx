import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@/test/utils/testUtils';
import ProjectOverview from './index';

// Mock dependencies
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: vi.fn(() => ({ id: 'test-project-id' })),
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
  useUsers: vi.fn(() => [[], false, null]),
}));

// Mock child components
vi.mock('./ParticipantsTable', () => ({
  ParticipantsTable: vi.fn(({ onAddParticipant }) => (
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
  ConfirmationDialog: ({ isOpen, title, description, actionLabel }) =>
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button>{actionLabel}</button>
      </div>
    ) : null,
}));

describe('ProjectOverview', () => {
  const mockProject = {
    id: 'test-project-id',
    projectName: 'Test Project',
    projectNumber: 'P123',
    customer: 'Test Customer',
    description: 'Test Description',
    externalReference: 'EXT-123',
    fillerMaterialTraceable: true,
    parentMaterialTraceable: false,
  };

  const mockParticipants = [
    { id: '1', name: 'John Doe', role: 'WELDER' },
    { id: '2', name: 'Jane Smith', role: 'INSPECTOR' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    const { useProject } = await import('@/hooks/useProjects');
    const { useProjectParticipants } = await import(
      '@/hooks/useProjectParticipants'
    );

    useProject.mockReturnValue([mockProject, false, null]);
    useProjectParticipants.mockReturnValue([mockParticipants, false, null]);
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

    useProject.mockReturnValue([null, true, null]);
    useProjectParticipants.mockReturnValue([[], false, null]);

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

    useProject.mockReturnValue([
      null,
      false,
      new Error('Failed to load project'),
    ]);
    useProjectParticipants.mockReturnValue([[], false, null]);

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

    useProject.mockReturnValue([mockProject, false, null]);
    useProjectParticipants.mockReturnValue([
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

    useProject.mockReturnValue([null, false, null]);
    useProjectParticipants.mockReturnValue([[], false, null]);

    renderWithProviders(<ProjectOverview />);

    // Should not show content when project is null
    expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Details')).not.toBeInTheDocument();
  });
});
