import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ParticipantsTable } from './ParticipantsTable';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

describe('ParticipantsTable', () => {
  const mockParticipants = [
    {
      id: '1',
      userId: 'user-1',
      participatingAs: ['welder', 'projectLeader'],
    },
    {
      id: '2',
      userId: 'user-2',
      participatingAs: ['weldingCoordinator'],
    },
  ];

  const mockUsers = [
    {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    },
  ];

  const defaultProps = {
    participants: mockParticipants,
    users: mockUsers,
    loading: false,
    onAddParticipant: vi.fn(),
    onEdit: vi.fn(),
    onConfirmAction: vi.fn(),
  };

  const renderWithI18n = (component) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render column headers with translations', () => {
    renderWithI18n(<ParticipantsTable {...defaultProps} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Participating as')).toBeInTheDocument();
  });

  it('should render roles with translations', () => {
    renderWithI18n(<ParticipantsTable {...defaultProps} />);

    // Check that roles are translated
    expect(screen.getByText('Welder, Project leader')).toBeInTheDocument();
    expect(screen.getByText('Welding coordinator')).toBeInTheDocument();
  });

  it('should render action button with translation', () => {
    renderWithI18n(<ParticipantsTable {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: /Add Participant/i })
    ).toBeInTheDocument();
  });

  it('should show translated bulk action when rows are selected', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ParticipantsTable {...defaultProps} />);

    // Select the first row
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // First is select all, second is first row

    expect(
      screen.getByRole('button', { name: /Remove from Project/i })
    ).toBeInTheDocument();
  });

  it('should show empty state when no participants', () => {
    renderWithI18n(<ParticipantsTable {...defaultProps} participants={[]} />);

    // The DataTable component shows "No results found." text
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithI18n(<ParticipantsTable {...defaultProps} loading={true} />);

    // The DataTable component shows "Loading..." text in a row
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle add participant click', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ParticipantsTable {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Add Participant/i }));

    expect(defaultProps.onAddParticipant).toHaveBeenCalled();
  });

  it('should handle edit action from row menu', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ParticipantsTable {...defaultProps} />);

    // Find and click the action menu for the first row
    const actionButtons = screen.getAllByRole('button', { name: /open menu/i });
    await user.click(actionButtons[0]);

    // Click edit in the menu
    const editButton = screen.getByRole('menuitem', { name: /Edit/i });
    await user.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockParticipants[0]);
  });

  it('should handle remove action from row menu', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ParticipantsTable {...defaultProps} />);

    // Find and click the action menu for the first row
    const actionButtons = screen.getAllByRole('button', { name: /open menu/i });
    await user.click(actionButtons[0]);

    // Click remove in the menu
    const removeButton = screen.getByRole('menuitem', {
      name: /Remove from Project/i,
    });
    await user.click(removeButton);

    expect(defaultProps.onConfirmAction).toHaveBeenCalledWith(
      'remove',
      mockParticipants[0]
    );
  });

  it('should handle bulk remove action', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ParticipantsTable {...defaultProps} />);

    // Select multiple rows
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // First row
    await user.click(checkboxes[2]); // Second row

    // Click bulk remove button
    await user.click(
      screen.getByRole('button', { name: /Remove from Project/i })
    );

    expect(defaultProps.onConfirmAction).toHaveBeenCalledWith(
      'remove',
      mockParticipants,
      true
    );
  });
});
