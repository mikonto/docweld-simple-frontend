import type { JSX, ReactNode } from 'react';
import type { WeldEvent } from '@/types/models/welding';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface WeldEventItemProps {
  event: WeldEvent;
  isSyntheticCreation: boolean;
  renderDoneLoggedText: (event: WeldEvent) => ReactNode;
}

export function WeldEventItem({
  event,
  isSyntheticCreation,
  renderDoneLoggedText,
}: WeldEventItemProps): JSX.Element {
  const { t } = useTranslation();

  const badgeKey = isSyntheticCreation
    ? 'weldEvents.eventType.creation'
    : `weldEvents.eventType.${event.eventType}`;

  const isComment = event.eventType === 'comment';

  return (
    <article className="rounded-lg border border-border/60 bg-card/75 p-4 shadow-sm transition-colors">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{t(badgeKey)}</p>

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

        <div className="text-xs text-muted-foreground space-y-1">
          {renderDoneLoggedText(event)}
        </div>
      </div>
    </article>
  );
}
