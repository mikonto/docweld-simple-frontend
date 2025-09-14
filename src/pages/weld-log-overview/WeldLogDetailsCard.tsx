import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/utils/dateFormatting';
import type { WeldLog, User } from '@/types/app';
import type { Timestamp } from 'firebase/firestore';

interface WeldLogDetailsCardProps {
  weldLog?: WeldLog | null;
  creator?: User | null;
  onEdit: (weldLog: WeldLog) => void;
}

// Weld log details card component for displaying weld log information
export function WeldLogDetailsCard({
  weldLog,
  creator,
  onEdit,
}: WeldLogDetailsCardProps): React.ReactElement {
  const { t } = useTranslation();

  // Format timestamp for display using locale-aware formatting
  const formatTimestamp = (timestamp?: Timestamp | null): string => {
    if (!timestamp) return '—';
    return formatDate(timestamp, 'dateTime');
  };

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('weldLogs.weldLogDetails')}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => weldLog && onEdit(weldLog)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('weldLogs.editWeldLog')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-border">
            {/* Name - top-left */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.name')}
              </h4>
              <p className="text-sm font-medium">{weldLog?.name || '—'}</p>
            </div>

            {/* Description - top-right */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.description')}
              </h4>
              <p className="text-sm">{weldLog?.description || '—'}</p>
            </div>

            {/* Created By - bottom-left */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.createdBy')}
              </h4>
              <p className="text-sm font-medium">
                {creator
                  ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() ||
                    creator.displayName
                  : '—'}
              </p>
            </div>

            {/* Created Date - bottom-right */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.createdAt')}
              </h4>
              <p className="text-sm font-medium">
                {formatTimestamp(weldLog?.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
