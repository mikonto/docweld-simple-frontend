import type { JSX, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle, XCircle, MessageSquare, Wrench, Eye, Flame } from 'lucide-react';
import type { WeldEvent } from '@/types/models/welding';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { convertToDate } from '@/utils/dateFormatting';

const formatTime24 = (value: unknown): string => {
  const date = convertToDate(value);
  if (!date) {
    return '—';
  }
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

interface WeldEventItemProps {
  event: WeldEvent;
  isSyntheticCreation: boolean;
  renderDoneLoggedText: (event: WeldEvent) => ReactNode;
}

const EVENT_ICONS: Record<string, ({ className }: { className?: string }) => JSX.Element> = {
  weld: Wrench,
  'visual-inspection': Eye,
  'heat-treatment': Flame,
  comment: MessageSquare,
  creation: ChevronRight,
};

const EVENT_COLORS: Record<string, string> = {
  weld: 'bg-blue-50 text-blue-700 border-blue-200',
  'visual-inspection': 'bg-purple-50 text-purple-700 border-purple-200',
  'heat-treatment': 'bg-orange-50 text-orange-700 border-orange-200',
  comment: 'bg-gray-50 text-gray-700 border-gray-200',
  creation: 'bg-green-50 text-green-700 border-green-200',
};

export function WeldEventItem({
  event,
  isSyntheticCreation,
  renderDoneLoggedText,
}: WeldEventItemProps): JSX.Element {
  const { t } = useTranslation();

  const eventType = isSyntheticCreation ? 'creation' : event.eventType;
  const Icon = EVENT_ICONS[eventType] || ChevronRight;
  const colorClass = EVENT_COLORS[eventType] || EVENT_COLORS.comment;

  const badgeKey = isSyntheticCreation
    ? 'weldEvents.eventType.creation'
    : `weldEvents.eventType.${event.eventType}`;

  const isComment = event.eventType === 'comment';

  return (
    <div className="group relative flex gap-3 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border/60 group-last:hidden" />

      {/* Icon circle - smaller and less dominant */}
      <div className={cn(
        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
        colorClass
      )}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content with better spacing and structure */}
      <div className="flex-1 min-w-0">
        {/* Card container for better visual grouping */}
        <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
          {/* Header section */}
          <div className="space-y-3">
            {/* Event type and status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs font-medium">
                {t(badgeKey)}
              </Badge>
              {event.inspectionResult && (
                <Badge
                  variant={event.inspectionResult === 'approved' ? 'default' : 'destructive'}
                  className="text-xs gap-1"
                >
                  {event.inspectionResult === 'approved' ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {t(`weldEvents.inspectionResult.${event.inspectionResult}`)}
                </Badge>
              )}
              {/* Time badge */}
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                {formatTime24(event.performedAt)}
              </Badge>
            </div>

            {/* Description - smaller font for comments */}
            {event.description && (
              <p className={cn(
                "text-foreground leading-relaxed",
                isComment ? "text-xs text-muted-foreground" : "text-sm font-medium"
              )}>
                {event.description}
              </p>
            )}

            {/* Performer info */}
            <div className="text-xs text-muted-foreground pt-1 border-t">
              {renderDoneLoggedText(event)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}