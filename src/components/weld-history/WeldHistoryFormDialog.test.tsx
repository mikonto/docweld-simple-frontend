import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/utils/testUtils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeldHistoryFormDialog } from './WeldHistoryFormDialog';

const mockTimestampFromDate = vi.fn();

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (...args: unknown[]) => mockTimestampFromDate(...args),
  },
}));

vi.mock('@/components/ui/custom/date-time-picker', () => ({
  DateTimePickerSimple: ({ onChange, value }: any) => (
    <input
      type="datetime-local"
      data-testid="date-time-picker"
      onChange={(e) => onChange(new Date(e.target.value))}
      value={
        value && value instanceof Date && !isNaN(value.getTime())
          ? value.toISOString().slice(0, 16)
          : ''
      }
    />
  ),
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>(
    'react-i18next'
  );
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: Record<string, unknown>) =>
        params && 'type' in params ? `${key}.${params.type as string}` : key,
      i18n: { language: 'en' }
    }),
  };
});

describe('WeldHistoryFormDialog', () => {
  beforeAll(() => {
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = () => {};
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => {};
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits form data for basic user with locked performer', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    const timestampValue = { toDate: () => new Date('2024-05-01T10:30') };
    mockTimestampFromDate.mockReturnValue(timestampValue);

    render(
      <WeldHistoryFormDialog
        open
        onOpenChange={onOpenChange}
        weldId="weld-1"
        weldLogId="log-1"
        projectId="project-1"
        selectedEventType="weld"
        allowPerformerSelection={false}
        performerOptions={[]}
        defaultPerformerId="user-1"
        currentUserId="user-1"
        currentUserName="Welder"
        onSubmit={onSubmit}
        isSubmitting={false}
      />
    );

    const commentField = screen.getByLabelText('weldHistory.form.comment');
    const performedAtField = screen.getByTestId('date-time-picker');

    await user.type(commentField, 'Completed root pass');
    await user.clear(performedAtField);
    await user.type(performedAtField, '2024-05-01T10:30');

    await user.click(screen.getByRole('button', { name: 'weldHistory.dialogTitles.weld' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        weldId: 'weld-1',
        weldLogId: 'log-1',
        projectId: 'project-1',
        eventType: 'weld',
        description: 'Completed root pass',
        performedAt: timestampValue,
        performedBy: 'Welder',
        doneById: 'user-1',
      });
    });

    expect(mockTimestampFromDate).toHaveBeenCalledWith(
      new Date('2024-05-01T10:30')
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows validation errors when required fields missing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <WeldHistoryFormDialog
        open
        onOpenChange={vi.fn()}
        weldId="weld-1"
        weldLogId="log-1"
        projectId="project-1"
        selectedEventType="comment"
        allowPerformerSelection={false}
        performerOptions={[]}
        defaultPerformerId="user-1"
        currentUserId="user-1"
        currentUserName="User"
        onSubmit={onSubmit}
        isSubmitting={false}
      />
    );

    // For comment event type, comment field is required
    // Try to submit without filling the comment field
    await user.click(screen.getByRole('button', { name: 'weldHistory.dialogTitles.comment' }));

    // Should show validation error for required comment
    expect(
      await screen.findByText('weldHistory.validation.commentRequired')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows admins to select performer from options', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const timestampValue = { toDate: () => new Date('2024-05-01T12:00') };
    mockTimestampFromDate.mockReturnValue(timestampValue);

    render(
      <WeldHistoryFormDialog
        open
        onOpenChange={vi.fn()}
        weldId="weld-1"
        weldLogId="log-1"
        projectId="project-1"
        selectedEventType="heat-treatment"
        allowPerformerSelection
        performerOptions={[
          { value: 'user-1', label: 'Welder One' },
          { value: 'user-2', label: 'Operator Two' },
        ]}
        defaultPerformerId="user-1"
        currentUserId="admin-1"
        currentUserName="Admin User"
        onSubmit={onSubmit}
        isSubmitting={false}
      />
    );

    await user.click(
      await screen.findByRole('combobox', {
        name: 'weldHistory.form.performedBy',
      })
    );
    await user.click(screen.getByRole('option', { name: 'Operator Two' }));

    await user.type(
      screen.getByLabelText('weldHistory.form.comment'),
      'Heat treatment logged'
    );

    const performedAtField = screen.getByTestId('date-time-picker');
    await user.clear(performedAtField);
    await user.type(performedAtField, '2024-05-01T12:00');

    await user.click(screen.getByRole('button', { name: 'weldHistory.dialogTitles.heat-treatment' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        weldId: 'weld-1',
        weldLogId: 'log-1',
        projectId: 'project-1',
        eventType: 'heat-treatment',
        description: 'Heat treatment logged',
        performedAt: timestampValue,
        performedBy: 'Operator Two',
        doneById: 'user-2',
      });
    });
  });
});
