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
import { useMaterials } from '@/hooks/useMaterials';
import PropTypes from 'prop-types';

export function WeldDetailsCard({ weld, creator, onEdit }) {
  const { t } = useTranslation();

  // Fetch parent and filler materials for display
  const [parentMaterials, parentLoading] = useMaterials('parent');
  const [fillerMaterials, fillerLoading] = useMaterials('filler');

  // Format timestamp for display using locale-aware formatting
  const formatTimestamp = (timestamp) => {
    return formatDate(timestamp, 'dateTime');
  };

  // Get material names from IDs
  const getMaterialName = (materialId, materials) => {
    const material = materials?.find((m) => m.id === materialId);
    if (material) {
      return material.specification
        ? `${material.name} (${material.specification})`
        : material.name;
    }
    return materialId; // Return ID if material not found
  };

  // Format parent materials for display
  const formatParentMaterials = () => {
    if (!weld?.parentMaterials || weld.parentMaterials.length === 0) {
      return '—';
    }
    if (parentLoading) return t('common.loading');

    return weld.parentMaterials
      .map((id) => getMaterialName(id, parentMaterials))
      .join(', ');
  };

  // Format filler materials for display
  const formatFillerMaterials = () => {
    if (!weld?.fillerMaterials || weld.fillerMaterials.length === 0) {
      return '—';
    }
    if (fillerLoading) return t('common.loading');

    return weld.fillerMaterials
      .map((id) => getMaterialName(id, fillerMaterials))
      .join(', ');
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
            <DropdownMenuItem onSelect={() => onEdit(weld)}>
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

            {/* Position */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.position')}
              </h4>
              <p className="text-sm font-medium">{weld?.position || '—'}</p>
            </div>

            {/* Heat Treatment */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('welds.heatTreatment')}
              </h4>
              <p className="text-sm font-medium">
                {weld?.heatTreatment || '—'}
              </p>
            </div>

            {/* Row 2 */}
            {/* Parent Materials */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('materials.parentMaterials')}
              </h4>
              <p className="text-sm font-medium">{formatParentMaterials()}</p>
            </div>

            {/* Filler Materials */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('materials.fillerMaterials')}
              </h4>
              <p className="text-sm font-medium">{formatFillerMaterials()}</p>
            </div>

            {/* Created By */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.createdBy')}
              </h4>
              <p className="text-sm font-medium">
                {creator ? `${creator.firstName} ${creator.lastName}` : '—'}
              </p>
            </div>

            {/* Row 3 */}
            {/* Description - spans 2 columns */}
            <div className="bg-card px-6 py-3 col-span-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.description')}
              </h4>
              <p className="text-sm font-medium">{weld?.description || '—'}</p>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

WeldDetailsCard.propTypes = {
  weld: PropTypes.shape({
    id: PropTypes.string,
    number: PropTypes.string,
    position: PropTypes.string,
    parentMaterials: PropTypes.arrayOf(PropTypes.string),
    fillerMaterials: PropTypes.arrayOf(PropTypes.string),
    description: PropTypes.string,
    heatTreatment: PropTypes.string,
    createdAt: PropTypes.object,
    createdBy: PropTypes.string,
  }),
  creator: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onEdit: PropTypes.func.isRequired,
};
