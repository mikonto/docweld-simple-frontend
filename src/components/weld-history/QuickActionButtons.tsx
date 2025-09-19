import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WeldActivityType } from '@/types/models/welding';

interface QuickActionButtonsProps {
  onSelect: (eventType: WeldActivityType) => void;
  disabled?: boolean;
}

const quickActions: Array<{
  type: WeldActivityType;
  labelKey: string;
}> = [
  { type: 'weld', labelKey: 'weldHistory.quickActions.logWeld' },
  {
    type: 'visual-inspection',
    labelKey: 'weldHistory.quickActions.logInspection',
  },
  {
    type: 'heat-treatment',
    labelKey: 'weldHistory.quickActions.logHeatTreatment',
  },
  {
    type: 'comment',
    labelKey: 'weldHistory.quickActions.addComment',
  },
];

export function QuickActionButtons({
  onSelect,
  disabled = false,
}: QuickActionButtonsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button type="button">{t('weldHistory.quickActions.logEvent')}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {quickActions.map(({ type, labelKey }) => (
          <DropdownMenuItem
            key={type}
            onSelect={() => onSelect(type)}
            data-event-type={type}
          >
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
