import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WeldEventType } from '@/types/models/welding';

interface QuickEventButtonsProps {
  onSelect: (eventType: WeldEventType) => void;
  disabled?: boolean;
}

const quickActions: Array<{
  type: WeldEventType;
  labelKey: string;
}> = [
  { type: 'weld', labelKey: 'weldEvents.quickActions.logWeld' },
  {
    type: 'visual-inspection',
    labelKey: 'weldEvents.quickActions.logInspection',
  },
  {
    type: 'heat-treatment',
    labelKey: 'weldEvents.quickActions.logHeatTreatment',
  },
  {
    type: 'comment',
    labelKey: 'weldEvents.quickActions.addComment',
  },
];

export function QuickEventButtons({
  onSelect,
  disabled = false,
}: QuickEventButtonsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button type="button">{t('weldEvents.quickActions.logEvent')}</Button>
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
