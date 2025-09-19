import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { QuickActionButtons } from './QuickActionButtons';
import { WeldHistoryFormDialog } from './WeldHistoryFormDialog';
import { WeldHistoryItem } from './WeldHistoryItem';
import { useWeldHistory, useWeldHistoryOperations } from '@/hooks/useWeldHistory';
import { useApp } from '@/contexts/AppContext';
import { useProjectParticipants } from '@/hooks/useProjectParticipants';
import { useUsers } from '@/hooks/useUsers';
import { convertToDate, formatDate } from '@/utils/dateFormatting';
import type {
  CreateWeldHistoryInput,
  WeldHistoryEntry,
  WeldActivityType,
  WeldStatus,
} from '@/types/models/welding';

interface WeldHistorySectionProps {
  weldId: string;
  weldLogId: string;
  projectId: string;
  weldStatus: WeldStatus;
  canEdit: boolean;
}

interface GroupedEvents {
  dayLabel: string;
  events: WeldHistoryEntry[];
}

const ROLE_MAP: Record<WeldActivityType, string | null> = {
  weld: 'welder',
  'heat-treatment': 'heatTreatmentOperator',
  'visual-inspection': null,
  comment: null,
};

export function WeldHistorySection({
  weldId,
  weldLogId,
  projectId,
  weldStatus: _weldStatus,
  canEdit,
}: WeldHistorySectionProps): JSX.Element {
  const { t } = useTranslation();
  const { loggedInUser } = useApp();
  const isAdmin = loggedInUser?.role === 'admin';

  const { events, loading, error } = useWeldHistory(weldId);
  const { createEvent } = useWeldHistoryOperations();

  const [participants, participantsLoading] = useProjectParticipants(projectId);
  const [users, usersLoading] = useUsers('active');

  const performerUserMap = useMemo(() => {
    const map = new Map<string, { name: string }>();
    users.forEach((user) => {
      // user.name is already properly constructed by useUsers hook
      map.set(user.id, { name: user.name });
    });
    if (loggedInUser?.uid && !map.has(loggedInUser.uid)) {
      map.set(loggedInUser.uid, {
        name: loggedInUser.displayName ?? loggedInUser.email ?? loggedInUser.uid,
      });
    }
    return map;
  }, [users, loggedInUser]);

  const performersLoading = participantsLoading || (isAdmin && usersLoading);

  const getDisplayName = useCallback(
    (userId: string | null | undefined) => {
      if (!userId) {
        return t('weldHistory.unknownPerformer');
      }
      const entry = performerUserMap.get(userId);
      if (entry?.name) {
        return entry.name;
      }
      if (loggedInUser?.uid === userId && loggedInUser.displayName) {
        return loggedInUser.displayName;
      }
      return t('weldHistory.unknownPerformer');
    },
    [performerUserMap, loggedInUser, t]
  );

  const filterParticipantsForType = useCallback(
    (eventType: WeldActivityType) => {
      const requiredRole = ROLE_MAP[eventType];
      if (!requiredRole) {
        return participants;
      }
      return participants.filter((participant) =>
        participant.participatingAs?.includes(requiredRole)
      );
    },
    [participants]
  );

  const buildPerformerOptions = useCallback(
    (eventType: WeldActivityType) => {
      const eligibleParticipants = filterParticipantsForType(eventType);
      const uniqueIds = Array.from(
        new Set(
          eligibleParticipants
            .map((participant) => participant.userId)
            .filter((id): id is string => Boolean(id))
        )
      );
      const options = uniqueIds
        .map((id) => ({ value: id, label: getDisplayName(id) }))
        .filter((option) => option.label && option.label !== t('weldHistory.unknownPerformer'))
        .sort((a, b) => a.label.localeCompare(b.label));
      const defaultId = options[0]?.value ?? null;
      return { options, defaultId };
    },
    [filterParticipantsForType, getDisplayName, t]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<WeldActivityType>('weld');
  const [currentPerformerOptions, setCurrentPerformerOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [currentDefaultPerformerId, setCurrentDefaultPerformerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timelineEvents = useMemo(() => {
    return events.slice().sort((a, b) => {
      const aDate = convertToDate(a.performedAt) ?? new Date(0);
      const bDate = convertToDate(b.performedAt) ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
  }, [events]);

  const groupedEvents = useMemo<GroupedEvents[]>(() => {
    if (timelineEvents.length === 0) {
      return [];
    }

    const groups = new Map<string, WeldHistoryEntry[]>();

    timelineEvents.forEach((event) => {
      const day = formatDate(event.performedAt, 'date');
      const existing = groups.get(day);
      if (existing) {
        existing.push(event);
      } else {
        groups.set(day, [event]);
      }
    });

    return Array.from(groups.entries()).map(([dayLabel, dayEvents]) => ({
      dayLabel,
      events: dayEvents,
    }));
  }, [timelineEvents]);

  const handleQuickSelect = (type: WeldActivityType) => {
    if (!canEdit || performersLoading) {
      return;
    }

    setSelectedEventType(type);

    if (isAdmin) {
      const { options, defaultId } = buildPerformerOptions(type);
      if (options.length === 0) {
        toast.error(t('weldHistory.performerUnavailable'));
        return;
      }
      setCurrentPerformerOptions(options);
      setCurrentDefaultPerformerId(defaultId);
    } else {
      setCurrentPerformerOptions([]);
      setCurrentDefaultPerformerId(loggedInUser?.uid ?? null);
    }

    setFormOpen(true);
  };

  const handleCreateEvent = async (input: CreateWeldHistoryInput) => {
    setIsSubmitting(true);
    try {
      await createEvent(input);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestampDisplay = (value: unknown, short = false) => {
    const date = convertToDate(value);
    if (!date) return t('weldHistory.meta.unknownDate');
    return short ? format(date, 'MMM d, HH:mm') : format(date, 'MMMM d, yyyy \'at\' HH:mm');
  };

  const renderDoneLoggedText = (event: WeldHistoryEntry) => {
    const performerName = event.performedBy || getDisplayName(event.doneById);
    const loggerName = getDisplayName(event.createdBy);
    const performedDate = convertToDate(event.performedAt);
    const loggedDate = convertToDate(event.createdAt);

    // Check if performed by and logged by are the same person
    const sameUser = event.createdBy === event.doneById;

    // Check if performed and logged times are close (within 5 minutes)
    const timeDiff = performedDate && loggedDate
      ? Math.abs(performedDate.getTime() - loggedDate.getTime()) / 1000 / 60
      : 999;
    const closeInTime = timeDiff < 5;

    // Compact format when same person and close in time
    if (sameUser && closeInTime) {
      return (
        <p className="text-xs text-muted-foreground">
          {t('weldHistory.performedBy', {
            name: performerName || t('weldHistory.unknownPerformer')
          })}
        </p>
      );
    }

    // Show both timestamps when different person or significant time gap
    return (
      <p className="text-xs text-muted-foreground">
        {sameUser
          ? t('weldHistory.performedRecordedBySame', {
              name: performerName || t('weldHistory.unknownPerformer')
            })
          : t('weldHistory.performedRecordedByDifferent', {
              performedName: performerName || t('weldHistory.unknownPerformer'),
              recordedDate: formatTimestampDisplay(event.createdAt, true),
              recordedName: loggerName || t('weldHistory.unknownPerformer')
            })
        }
      </p>
    );
  };

  const timelineContent = (() => {
    if (loading) {
      return (
        <div
          data-testid="weld-history-loading"
          className="space-y-2"
          role="status"
          aria-live="polite"
        >
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>{t('weldHistory.errorTitle')}</AlertTitle>
          <AlertDescription>
            {error.message || t('weldHistory.error')}
          </AlertDescription>
        </Alert>
      );
    }

    if (timelineEvents.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            {t('weldHistory.emptyState')}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {groupedEvents.map(({ dayLabel, events: dayEvents }) => (
          <section key={dayLabel} className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {dayLabel}
            </div>
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <WeldHistoryItem
                  key={event.id}
                  event={event}
                  isSyntheticCreation={false}
                  renderDoneLoggedText={renderDoneLoggedText}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  })();

  return (
    <Card className="overflow-hidden gap-4">
      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">
          {t('weldHistory.sectionTitle')}
        </CardTitle>
        {canEdit ? (
          <QuickActionButtons
            onSelect={handleQuickSelect}
            disabled={!weldId || performersLoading}
          />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6 pt-2">
        {timelineContent}
      </CardContent>

      <WeldHistoryFormDialog
        open={formOpen && canEdit}
        onOpenChange={setFormOpen}
        weldId={weldId}
        weldLogId={weldLogId}
        projectId={projectId}
        selectedEventType={selectedEventType}
        allowPerformerSelection={Boolean(isAdmin)}
        performerOptions={currentPerformerOptions}
        defaultPerformerId={currentDefaultPerformerId}
        currentUserId={loggedInUser?.uid ?? null}
        currentUserName={getDisplayName(loggedInUser?.uid)}
        onSubmit={handleCreateEvent}
        isSubmitting={isSubmitting}
      />
    </Card>
  );
}
