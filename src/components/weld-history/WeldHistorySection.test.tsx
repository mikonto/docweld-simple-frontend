import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/utils/testUtils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { WeldHistorySection } from './WeldHistorySection';
import type { Weld, WeldHistoryEntry } from '@/types/models/welding';
import type { Timestamp } from 'firebase/firestore';
import * as AppContextModule from '@/contexts/AppContext';

const mockUseWeldHistory = vi.fn();
const mockCreateEvent = vi.fn();
const mockUseWeldHistoryOperations = vi.fn();
const mockTimestampFromDate = vi.fn();
const mockUseProjectParticipants = vi.fn();
const mockUseUsers = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/hooks/useWeldHistory', () => ({
  useWeldHistory: (...args: unknown[]) => mockUseWeldHistory(...args),
  useWeldHistoryOperations: (...args: unknown[]) =>
    mockUseWeldHistoryOperations(...args),
}));

vi.mock('@/hooks/useProjectParticipants', () => ({
  useProjectParticipants: (...args: unknown[]) =>
    mockUseProjectParticipants(...args),
}));

vi.mock('@/hooks/useUsers', () => ({
  useUsers: (...args: unknown[]) => mockUseUsers(...args),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (...args: unknown[]) => mockTimestampFromDate(...args),
  },
}));

vi.mock('@/components/ui/custom/date-time-picker', () => ({
  DateTimePickerSimple: ({ value, onChange, ...props }: any) => {
    const formattedValue =
      value instanceof Date && !Number.isNaN(value.getTime())
        ? value.toISOString().slice(0, 16)
        : '';

    const [inputValue, setInputValue] = useState(formattedValue);

    useEffect(() => {
      setInputValue(formattedValue);
    }, [formattedValue]);

    return (
      <input
        type="datetime-local"
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInputValue(nextValue);

          if (!nextValue) {
            onChange?.(undefined);
            return;
          }

          if (nextValue.length === 16) {
            const parsed = new Date(nextValue);
            if (!Number.isNaN(parsed.getTime())) {
              onChange?.(parsed);
            }
          }
        }}
        {...props}
      />
    );
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
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

const useAppSpy = vi.spyOn(AppContextModule, 'useApp');

const mockTimestamp = { toDate: () => new Date('2024-05-01T09:00:00Z') } as unknown as Timestamp;

const baseWeld: Weld = {
  id: 'weld-1',
  projectId: 'project-1',
  weldLogId: 'log-1',
  number: 'W-001',
  welderId: 'user-2',
  status: 'in-progress',
  type: 'production',
  createdAt: mockTimestamp,
} as unknown as Weld;

const defaultParticipants = [
  {
    id: 'participant-1',
    userId: 'user-1',
    role: 'welder',
    participatingAs: ['welder'],
    addedAt: mockTimestamp,
    addedBy: 'user-9',
  },
  {
    id: 'participant-2',
    userId: 'user-2',
    role: 'welder',
    participatingAs: ['welder'],
    addedAt: mockTimestamp,
    addedBy: 'user-9',
  },
  {
    id: 'participant-3',
    userId: 'user-3',
    role: 'viewer',
    participatingAs: ['heatTreatmentOperator'],
    addedAt: mockTimestamp,
    addedBy: 'user-9',
  },
];

const defaultUsers = [
  {
    id: 'user-1',
    firstName: 'Default',
    lastName: 'User',
    name: 'Default User',
  },
  {
    id: 'user-2',
    firstName: 'Welder',
    lastName: 'One',
    name: 'Welder One',
  },
  {
    id: 'user-3',
    firstName: 'Operator',
    lastName: 'Two',
    name: 'Operator Two',
  },
] as unknown[];

const createMockEvent = (overrides: Partial<WeldHistoryEntry> = {}): WeldHistoryEntry => ({
  id: overrides.id ?? 'event-1',
  weldId: 'weld-1',
  weldLogId: 'log-1',
  projectId: 'project-1',
  eventType: 'weld',
  description: 'Root pass completed',
  performedAt: {
    toDate: () => new Date('2024-05-02T10:00:00Z'),
  } as unknown as Timestamp,
  performedBy: 'Welder A',
  doneById: 'user-2',
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  createdBy: 'user-2',
  updatedBy: 'user-2',
  status: 'active',
  ...overrides,
});

describe('WeldHistorySection', () => {
  beforeAll(() => {
    if (!Element.prototype.scrollIntoView) {
      // @ts-expect-error jsdom polyfill
      Element.prototype.scrollIntoView = () => {};
    }
    if (!Element.prototype.hasPointerCapture) {
      // @ts-expect-error jsdom polyfill
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.releasePointerCapture) {
      // @ts-expect-error jsdom polyfill
      Element.prototype.releasePointerCapture = () => {};
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWeldHistory.mockReturnValue({
      events: [],
      loading: false,
      error: undefined,
    });
    mockUseWeldHistoryOperations.mockReturnValue({
      createEvent: mockCreateEvent,
    });
    useAppSpy.mockReturnValue({
      loggedInUser: {
        uid: 'user-1',
        displayName: 'Default User',
        role: 'user',
      },
    } as unknown as ReturnType<typeof AppContextModule.useApp>);
    mockUseProjectParticipants.mockReturnValue([
      defaultParticipants,
      false,
      undefined,
    ]);
    mockUseUsers.mockReturnValue([defaultUsers as never, false, undefined]);
  });

  const baseProps = {
    weld: baseWeld,
    weldId: 'weld-1',
    weldLogId: 'log-1',
    projectId: 'project-1',
    weldStatus: 'in-progress' as const,
    canEdit: true,
    welderName: 'Welder One',
  };

  it('shows loading state when fetching events', () => {
    mockUseWeldHistory.mockReturnValueOnce({
      events: [],
      loading: true,
      error: undefined,
    });

    render(<WeldHistorySection {...baseProps} />);

    expect(screen.getByTestId('weld-history-loading')).toBeInTheDocument();
  });

  it('renders error state when hook returns error', () => {
    mockUseWeldHistory.mockReturnValueOnce({
      events: [],
      loading: false,
      error: new Error('Failed to load'),
    });

    render(<WeldHistorySection {...baseProps} />);

    expect(screen.getByText('weldHistory.errorTitle')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders creation event when no additional events exist', () => {
    mockUseWeldHistory.mockReturnValueOnce({
      events: [],
      loading: false,
      error: undefined,
    });

    render(<WeldHistorySection {...baseProps} />);

    expect(
      screen.getByText('weldHistory.creation.description')
    ).toBeInTheDocument();
  });

  it('renders timeline with fetched events and creation entry', () => {
    const events = [
      createMockEvent({ id: '1', description: 'Event A' }),
      createMockEvent({
        id: '2',
        description: 'Event B',
        eventType: 'visual-inspection',
        performedAt: {
          toDate: () => new Date('2024-05-03T08:00:00Z'),
        } as unknown as Timestamp,
      }),
    ];

    mockUseWeldHistory.mockReturnValueOnce({
      events,
      loading: false,
      error: undefined,
    });

    render(<WeldHistorySection {...baseProps} />);

    expect(screen.getByText('Event A')).toBeInTheDocument();
    expect(screen.getByText('Event B')).toBeInTheDocument();
    expect(
      screen.getByText('weldHistory.activityType.visual-inspection')
    ).toBeInTheDocument();
    // Synthetic creation event
    expect(
      screen.getByText('weldHistory.creation.description')
    ).toBeInTheDocument();
  });

  it('allows creating a new event through quick actions for basic user', async () => {
    const user = userEvent.setup();
    mockTimestampFromDate.mockImplementation((date: Date) => ({
      toDate: () => date,
    }));
    mockCreateEvent.mockResolvedValueOnce(undefined);

    render(<WeldHistorySection {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'weldHistory.quickActions.logEvent' }));
    await user.click(
      screen.getByRole('menuitem', { name: 'weldHistory.quickActions.logWeld' })
    );

    await user.type(
      await screen.findByLabelText('weldHistory.form.comment'),
      'New weld logged'
    );
    const performedAtField = screen.getByLabelText('weldHistory.form.performedAt');
    await user.clear(performedAtField);
    await user.type(performedAtField, '2024-06-01T12:30');
    await user.click(
      screen.getByRole('button', { name: /weldHistory\.dialogTitles\./ })
    );

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith({
        weldId: 'weld-1',
        weldLogId: 'log-1',
        projectId: 'project-1',
        eventType: 'weld',
        description: 'New weld logged',
        performedAt: expect.objectContaining({
          toDate: expect.any(Function),
        }),
        performedBy: 'Default User',
        doneById: 'user-1',
      });
      expect(screen.getAllByText('weldHistory.meta.done')[0]).toBeInTheDocument();
      expect(screen.getAllByText('weldHistory.meta.logged')[0]).toBeInTheDocument();
    });
  });

  it('allows admin to select performer constrained by event type', async () => {
    const user = userEvent.setup();
    useAppSpy.mockReturnValue({
      loggedInUser: {
        uid: 'admin-1',
        displayName: 'Admin User',
        role: 'admin',
      },
    } as unknown as ReturnType<typeof AppContextModule.useApp>);

    mockUseProjectParticipants.mockReturnValueOnce([
      defaultParticipants,
      false,
      undefined,
    ]);

    mockUseUsers.mockReturnValueOnce([
      [
        {
          id: 'user-1',
          firstName: 'Default',
          lastName: 'User',
          name: 'Default User',
        },
        {
          id: 'user-3',
          firstName: 'Operator',
          lastName: 'Two',
          name: 'Operator Two',
        },
      ] as never,
      false,
      undefined,
    ]);

    mockTimestampFromDate.mockImplementation((date: Date) => ({
      toDate: () => date,
    }));
    mockCreateEvent.mockResolvedValueOnce(undefined);

    render(<WeldHistorySection {...baseProps} />);

    await user.click(
      screen.getByRole('button', { name: 'weldHistory.quickActions.logEvent' })
    );
    await user.click(
      screen.getByRole('menuitem', {
        name: 'weldHistory.quickActions.logHeatTreatment',
      })
    );

    const performerSelect = await screen.findByRole('combobox', {
      name: 'weldHistory.form.doneBy',
    });
    await user.click(performerSelect);
    await user.click(screen.getByRole('option', { name: 'Operator Two' }));

    await user.type(
      screen.getByLabelText('weldHistory.form.comment'),
      'Heat treatment performed'
    );
    const performedAtField = screen.getByLabelText('weldHistory.form.performedAt');
    await user.clear(performedAtField);
    await user.type(performedAtField, '2024-06-02T09:15');
    await user.click(screen.getByRole('button', { name: /weldHistory\.dialogTitles\./ }));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith({
        weldId: 'weld-1',
        weldLogId: 'log-1',
        projectId: 'project-1',
        eventType: 'heat-treatment',
        description: 'Heat treatment performed',
        performedAt: expect.objectContaining({
          toDate: expect.any(Function),
        }),
        performedBy: 'Operator Two',
        doneById: 'user-3',
      });
    });
  });

  it('shows error toast when no eligible performers available', async () => {
    useAppSpy.mockReturnValueOnce({
      loggedInUser: {
        uid: 'admin-1',
        displayName: 'Admin User',
        role: 'admin',
      },
    } as unknown as ReturnType<typeof AppContextModule.useApp>);

    mockUseProjectParticipants.mockReturnValueOnce([
      [
        {
          id: 'participant-9',
          userId: 'user-9',
          role: 'viewer',
          participatingAs: ['viewer'],
          addedAt: mockTimestamp,
          addedBy: 'user-9',
        },
      ],
      false,
      undefined,
    ]);

    render(<WeldHistorySection {...baseProps} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'weldHistory.quickActions.logEvent' })
    );
    await userEvent.click(
      screen.getByRole('menuitem', {
        name: 'weldHistory.quickActions.logHeatTreatment',
      })
    );

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('weldHistory.performerUnavailable');
    });
    expect(
      screen.queryByLabelText('weldHistory.form.comment')
    ).not.toBeInTheDocument();
  });

  afterAll(() => {
    useAppSpy.mockRestore();
  });
});
