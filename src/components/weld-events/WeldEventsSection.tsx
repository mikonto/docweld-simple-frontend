import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { QuickEventButtons } from './QuickEventButtons';
import { WeldEventFormDialog } from './WeldEventFormDialog';
import { WeldEventItem } from './WeldEventItem';
import { useWeldEvents, useWeldEventOperations } from '@/hooks/useWeldEvents';
import { useApp } from '@/contexts/AppContext';
import { useProjectParticipants } from '@/hooks/useProjectParticipants';
import { useUsers } from '@/hooks/useUsers';
import { convertToDate, formatDate } from '@/utils/dateFormatting';
import { STATUS } from '@/types/common/status';
import type {
  CreateWeldEventInput,
  Weld,
  WeldEvent,
  WeldEventType,
  WeldStatus,
} from '@/types/models/welding';

interface WeldEventsSectionProps {
  weld: Weld | null;
  weldId: string;
  weldLogId: string;
  projectId: string;
  weldStatus: WeldStatus;
  canEdit: boolean;
  welderName?: string;
}

interface GroupedEvents {
  dayLabel: string;
  events: WeldEvent[];
}

const ROLE_MAP: Record<WeldEventType, string | null> = {
  weld: 'welder',
  'heat-treatment': 'heatTreatmentOperator',
  'visual-inspection': null,
  comment: null,
};

export function WeldEventsSection({
  weld,
  weldId,
  weldLogId,
  projectId,
  weldStatus: _weldStatus,
  canEdit,
  welderName,
}: WeldEventsSectionProps): JSX.Element {
  const { t } = useTranslation();
  const { loggedInUser } = useApp();
  const isAdmin = loggedInUser?.role === 'admin';

  const { events, loading, error } = useWeldEvents(weldId);
  const { createEvent } = useWeldEventOperations();

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
        return t('weldEvents.unknownPerformer');
      }
      const entry = performerUserMap.get(userId);
      if (entry?.name) {
        return entry.name;
      }
      if (loggedInUser?.uid === userId && loggedInUser.displayName) {
        return loggedInUser.displayName;
      }
      return t('weldEvents.unknownPerformer');
    },
    [performerUserMap, loggedInUser, t]
  );

  const filterParticipantsForType = useCallback(
    (eventType: WeldEventType) => {
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
    (eventType: WeldEventType) => {
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
        .filter((option) => option.label && option.label !== t('weldEvents.unknownPerformer'))
        .sort((a, b) => a.label.localeCompare(b.label));
      const defaultId = options[0]?.value ?? null;
      return { options, defaultId };
    },
    [filterParticipantsForType, getDisplayName, t]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<WeldEventType>('weld');
  const [currentPerformerOptions, setCurrentPerformerOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [currentDefaultPerformerId, setCurrentDefaultPerformerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creationEvent = useMemo(() => {
    if (!weld || !weld.createdAt) {
      return null;
    }

    const performerId =
      (weld as Partial<Weld> & { createdBy?: string }).createdBy || weld.welderId || null;
    const performerName =
      getDisplayName(performerId) || welderName || t('weldEvents.unknownPerformer');

    const creation: WeldEvent = {
      id: `creation-${weld.id}`,
      weldId: weld.id,
      weldLogId,
      projectId,
      eventType: 'weld',
      description: t('weldEvents.creation.description'),
      performedAt: weld.createdAt,
      performedBy: performerName,
      doneById: performerId ?? undefined,
      createdAt: weld.createdAt,
      updatedAt: weld.createdAt,
      createdBy: performerId ?? 'system',
      updatedBy: performerId ?? 'system',
      status: STATUS.ACTIVE,
      metadata: { __synthetic: 'creation' },
    };

    return creation;
  }, [weld, weldLogId, projectId, getDisplayName, welderName, t]);

  const timelineEvents = useMemo(() => {
    if (!creationEvent) {
      return events;
    }

    const hasCreationEvent = events.some((event) => event.id === creationEvent.id);
    const merged = hasCreationEvent ? events : [...events, creationEvent];

    return merged.slice().sort((a, b) => {
      const aDate = convertToDate(a.performedAt) ?? new Date(0);
      const bDate = convertToDate(b.performedAt) ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
  }, [events, creationEvent]);

  const groupedEvents = useMemo<GroupedEvents[]>(() => {
    if (timelineEvents.length === 0) {
      return [];
    }

    const groups = new Map<string, WeldEvent[]>();

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

  const handleQuickSelect = (type: WeldEventType) => {
    if (!canEdit || performersLoading) {
      return;
    }

    setSelectedEventType(type);

    if (isAdmin) {
      const { options, defaultId } = buildPerformerOptions(type);
      if (options.length === 0) {
        toast.error(t('weldEvents.performerUnavailable'));
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

  const handleCreateEvent = async (input: CreateWeldEventInput) => {
    setIsSubmitting(true);
    try {
      await createEvent(input);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestampDisplay = (value: unknown) => {
    const date = convertToDate(value);
    return date ? format(date, 'dd.MM.yyyy HH:mm') : t('weldEvents.meta.unknownDate');
  };

  const renderDoneLoggedText = (event: WeldEvent) => {
    const performerName = event.performedBy || getDisplayName(event.doneById);
    const loggerName = getDisplayName(event.createdBy);
    const performedAtText = formatTimestampDisplay(event.performedAt);
    const loggedAtText = formatTimestampDisplay(event.createdAt);

    return (
      <div className="space-y-1">
        <p>
          {t('weldEvents.meta.done', {
            date: performedAtText,
            name: performerName || t('weldEvents.unknownPerformer'),
          })}
        </p>
        <p>
          {t('weldEvents.meta.logged', {
            date: loggedAtText,
            name: loggerName || t('weldEvents.unknownPerformer'),
          })}
        </p>
      </div>
    );
  };

  const timelineContent = (() => {
    if (loading) {
      return (
        <div
          data-testid="weld-events-loading"
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
          <AlertTitle>{t('weldEvents.errorTitle')}</AlertTitle>
          <AlertDescription>
            {error.message || t('weldEvents.error')}
          </AlertDescription>
        </Alert>
      );
    }

    if (timelineEvents.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            {t('weldEvents.emptyState')}
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
              {dayEvents.map((event) => {
                const isSyntheticCreation =
                  !!event.metadata &&
                  (event.metadata as Record<string, unknown>).__synthetic === 'creation';

                return (
                  <WeldEventItem
                    key={event.id}
                    event={event}
                    isSyntheticCreation={isSyntheticCreation}
                    renderDoneLoggedText={renderDoneLoggedText}
                  />
                );
              })}
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
          {t('weldEvents.sectionTitle')}
        </CardTitle>
        {canEdit ? (
          <QuickEventButtons
            onSelect={handleQuickSelect}
            disabled={!weldId || performersLoading}
          />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6 pt-2">
        {timelineContent}
      </CardContent>

      <WeldEventFormDialog
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
