import type { JSX, ReactNode } from 'react';
import type { WeldHistoryEntry } from '@/types/models/welding';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { convertToDate } from '@/utils/dateFormatting';
import { format } from 'date-fns';

interface WeldHistoryItemProps {
  event: WeldHistoryEntry;
  isSyntheticCreation: boolean;
  renderDoneLoggedText: (event: WeldHistoryEntry) => ReactNode;
}

export function WeldHistoryItem({
  event,
  isSyntheticCreation,
  renderDoneLoggedText,
}: WeldHistoryItemProps): JSX.Element {
  const { t } = useTranslation();

  const badgeKey = isSyntheticCreation
    ? 'weldHistory.activityType.creation'
    : `weldHistory.activityType.${event.eventType}`;

  const isComment = event.eventType === 'comment';

  const performedDate = convertToDate(event.performedAt);
  const formattedTime = performedDate ? format(performedDate, 'MMMM d, yyyy \'at\' HH:mm') : '';

  return (
    <article className="rounded-lg border border-border/60 bg-card/75 p-4 shadow-sm transition-colors">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{t(badgeKey)}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{formattedTime}</span>
        </div>

        {event.description ? (
          <p
            className={cn(
              'text-sm leading-relaxed text-muted-foreground',
              !isComment && 'text-foreground'
            )}
          >
            {event.description}
          </p>
        ) : null}

        {renderDoneLoggedText(event)}
      </div>
    </article>
  );
}
