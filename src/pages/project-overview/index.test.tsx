import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import type { FirestoreError } from 'firebase/firestore';

import { renderWithProviders } from '@/test/utils/testUtils';
import ProjectOverview from './index';
import type { Project, ProjectParticipant, User } from '@/types';
import { createMockTimestamp } from '@/test/utils/mockTimestamp';

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
  ParticipantsTable: vi.fn(
    ({ onAddParticipant }: { onAddParticipant: () => void }) => (
      <div data-testid="participants-table">
        <button onClick={onAddParticipant}>Add Participant</button>
      </div>
    )
  ),
}));

vi.mock('./ParticipantFormDialog', () => ({
  ParticipantFormDialog: vi.fn(() => null),
}));

vi.mock('../projects/ProjectFormDialog', () => ({
  ProjectFormDialog: vi.fn(() => null),
}));

vi.mock('@/components/shared/ConfirmationDialog', () => ({
  ConfirmationDialog: ({
    isOpen,
    title,
    description,
    actionLabel,
  }: {
    isOpen?: boolean;
    title?: string;
    description?: string;
    actionLabel?: string;
  }) =>
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button>{actionLabel}</button>
      </div>
    ) : null,
}));

// Import hooks after mocking
import { useProject } from '@/hooks/useProjects';
import { useProjectParticipants } from '@/hooks/useProjectParticipants';

// Define return types

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
    {
      userId: 'user1',
      role: 'welder',
      addedAt: createMockTimestamp(),
      addedBy: 'admin-user',
    },
    {
      userId: 'user2',
      role: 'inspector',
      addedAt: createMockTimestamp(),
      addedBy: 'admin-user',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useProject as MockedFunction<typeof useProject>).mockReturnValue([
      mockProject,
      false,
      undefined,
    ]);
    (
      useProjectParticipants as MockedFunction<typeof useProjectParticipants>
    ).mockReturnValue([mockParticipants, false, undefined]);
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

  it('should display participants table', async () => {
    renderWithProviders(<ProjectOverview />);

    await waitFor(() => {
      expect(screen.getByTestId('participants-table')).toBeInTheDocument();
    });
  });

  // Loading states
  it('should show project loading state', () => {
    (useProject as MockedFunction<typeof useProject>).mockReturnValue([
      null,
      true,
      undefined,
    ]);
    (
      useProjectParticipants as MockedFunction<typeof useProjectParticipants>
    ).mockReturnValue([[], false, undefined]);

    renderWithProviders(<ProjectOverview />);

    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // Error states
  it('should show project error state', () => {
    const error = new Error('Failed to load project') as FirestoreError;
    (useProject as MockedFunction<typeof useProject>).mockReturnValue([
      null,
      false,
      error,
    ]);
    (
      useProjectParticipants as MockedFunction<typeof useProjectParticipants>
    ).mockReturnValue([[], false, undefined]);

    renderWithProviders(<ProjectOverview />);

    // Should show error message
    expect(screen.getByText(/Error loading/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load project/)).toBeInTheDocument();
  });

  it('should show participants error state', () => {
    const error = new Error('Failed to load participants') as FirestoreError;
    (useProject as MockedFunction<typeof useProject>).mockReturnValue([
      mockProject,
      false,
      undefined,
    ]);
    (
      useProjectParticipants as MockedFunction<typeof useProjectParticipants>
    ).mockReturnValue([[], false, error]);

    renderWithProviders(<ProjectOverview />);

    // Project should still display
    expect(screen.getByText('Test Project')).toBeInTheDocument();

    // Should show error in participants section
    expect(screen.getByText(/Error loading/)).toBeInTheDocument();
  });
});
