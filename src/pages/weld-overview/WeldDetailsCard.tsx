import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatting';
import type { Weld, User } from '@/types';
import type { Timestamp } from 'firebase/firestore';

interface WeldDetailsCardProps {
  weld: Weld | null;
  creator: User | null;
  onEdit: (weld: Weld) => void;
}

export function WeldDetailsCard({
  weld,
  creator,
  onEdit,
}: WeldDetailsCardProps): ReactElement {
  const { t } = useTranslation();

  // Format timestamp for display using locale-aware formatting
  const formatTimestamp = (timestamp: Timestamp): string => {
    // Convert Timestamp to Date for formatting
    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp as unknown as Date);
    return formatDate(date, 'dateTime');
  };

  // Format material for display
  const formatMaterial = (): string => {
    if (!weld?.material) {
      return '—';
    }
    const material = weld.material;
    if (material.name && material.specification) {
      return `${material.name} (${material.specification})`;
    }
    return material.name || material.specification || material.type || '—';
  };

  // Get display value for welder (would need to fetch user info in real app)
  const getWelderDisplay = (): string => {
    // In a real app, you'd fetch the welder's info from the users collection
    return weld?.welderId || '—';
  };

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('welds.weldDetails')}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => weld && onEdit(weld)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('welds.editWeld')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-3 gap-px bg-border">
            {/* Row 1 */}
            {/* Weld Number */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('weldLogs.weldNumber')}
              </h4>
              <p className="text-sm font-medium">{weld?.number || '—'}</p>
            </div>

            {/* Status */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.status')}
              </h4>
              <p className="text-sm font-medium">{weld?.status || '—'}</p>
            </div>

            {/* Type */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.type')}
              </h4>
              <p className="text-sm font-medium">{weld?.type || '—'}</p>
            </div>

            {/* Row 2 */}
            {/* Process */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.process')}
              </h4>
              <p className="text-sm font-medium">{weld?.process || '—'}</p>
            </div>

            {/* Material */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('materials.material')}
              </h4>
              <p className="text-sm font-medium">{formatMaterial()}</p>
            </div>

            {/* Welder */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.welder')}
              </h4>
              <p className="text-sm font-medium">{getWelderDisplay()}</p>
            </div>

            {/* Row 3 */}
            {/* Inspector */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.inspector')}
              </h4>
              <p className="text-sm font-medium">{weld?.inspectorId || '—'}</p>
            </div>

            {/* Completed At */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.completedAt')}
              </h4>
              <p className="text-sm font-medium">
                {weld?.completedAt ? formatTimestamp(weld.completedAt) : '—'}
              </p>
            </div>

            {/* Inspected At */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.inspectedAt')}
              </h4>
              <p className="text-sm font-medium">
                {weld?.inspectedAt ? formatTimestamp(weld.inspectedAt) : '—'}
              </p>
            </div>

            {/* Row 4 */}
            {/* Notes - spans 2 columns */}
            <div className="bg-card px-6 py-3 col-span-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.notes')}
              </h4>
              <p className="text-sm font-medium">{weld?.notes || '—'}</p>
            </div>

            {/* Created At */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.createdAt')}
              </h4>
              <p className="text-sm font-medium">
                {weld?.createdAt ? formatTimestamp(weld.createdAt) : '—'}
              </p>
            </div>

            {/* Row 5 */}
            {/* Created By - spans 3 columns */}
            <div className="bg-card px-6 py-3 col-span-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.createdBy')}
              </h4>
              <p className="text-sm font-medium">
                {creator ? creator.displayName || creator.email : '—'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
