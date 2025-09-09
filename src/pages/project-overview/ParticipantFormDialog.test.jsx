import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantFormDialog } from './ParticipantFormDialog';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({
    t: (key) => {
      const translations = {
        'common.cancel': 'Cancel',
        'common.addButton': 'Add',
        'common.saveChanges': 'Save Changes',
        'projects.addParticipant': 'Add Participant',
        'projects.editParticipant': 'Edit Participant',
        'projects.updateParticipant': 'Update Participant',
        'projects.participant': 'Participant',
        'projects.user': 'User',
        'projects.selectUser': 'Select a user',
        'projects.participatingAs': 'Participating as',
        'projects.addParticipantDescription':
          'Select a user and assign roles to add them to this project.',
        'projects.updateParticipantDescription':
          'Update the participant details below.',
        'projects.roles.viewer': 'Viewer',
        'projects.roles.projectLeader': 'Project leader',
        'projects.roles.weldingCoordinator': 'Welding coordinator',
        'projects.roles.responsibleWeldingCoordinator':
          'Responsible welding coordinator',
        'projects.roles.welder': 'Welder',
        'projects.roles.heatTreatmentOperator': 'Heat treatment operator',
        'projects.roles.ndtOperator': 'NDT operator',
        'validation.userRequired': 'User is required',
        'validation.roleRequired': 'At least one role is required',
        'projects.participantAddedSuccess': 'Participant added successfully',
        'projects.participantUpdatedSuccess':
          'Participant updated successfully',
        'projects.participantAddError': 'Failed to add participant',
        'projects.participantUpdateError': 'Failed to update participant',
        'errors.userNotFound': 'Selected user not found',
        'errors.unknownError': 'Unknown error',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useUsers hook
vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(() => [
    [
      { id: '1', firstName: 'John', lastName: 'Doe' },
      { id: '2', firstName: 'Jane', lastName: 'Smith' },
    ],
    false, // not loading
  ]),
}));

describe('ParticipantFormDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with translated text for new participant', () => {
    render(<ParticipantFormDialog {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: 'Add Participant' })
    ).toBeInTheDocument();
    // Description is commented out in the component
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('should render with translated text for edit participant', () => {
    const participant = {
      id: 'participant-1',
      userId: '1',
      participatingAs: ['welder', 'viewer'],
    };

    render(
      <ParticipantFormDialog {...defaultProps} participant={participant} />
    );

    expect(screen.getByText('Edit Participant')).toBeInTheDocument();
    // Description is commented out in the component
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('should render translated form labels', () => {
    render(<ParticipantFormDialog {...defaultProps} />);

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Participating as')).toBeInTheDocument();
  });

  it('should render translated role labels', () => {
    render(<ParticipantFormDialog {...defaultProps} />);

    expect(screen.getByText('Viewer')).toBeInTheDocument();
    expect(screen.getByText('Project leader')).toBeInTheDocument();
    expect(screen.getByText('Welding coordinator')).toBeInTheDocument();
    expect(
      screen.getByText('Responsible welding coordinator')
    ).toBeInTheDocument();
    expect(screen.getByText('Welder')).toBeInTheDocument();
    expect(screen.getByText('Heat treatment operator')).toBeInTheDocument();
    expect(screen.getByText('NDT operator')).toBeInTheDocument();
  });

  it('should call onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ParticipantFormDialog {...defaultProps} />);

    await user.click(screen.getByText('Cancel'));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show validation errors with translated messages', async () => {
    const user = userEvent.setup();
    render(<ParticipantFormDialog {...defaultProps} />);

    // Try to submit without selecting user or roles
    await user.click(screen.getByText('Add', { selector: 'button' }));

    // Check for translated validation messages
    expect(await screen.findByText('User is required')).toBeInTheDocument();
    expect(
      await screen.findByText('At least one role is required')
    ).toBeInTheDocument();
  });
});
