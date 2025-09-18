import {
  MoreHorizontal,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Edit,
  Import,
  Trash2,
  GripVertical
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SectionData {
  id: string;
  name: string;
}

interface SectionHeaderProps {
  sectionData: SectionData;
  index: number;
  totalSections: number;
  isExpanded: boolean;
  toggleExpand: () => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onRenameSection: () => void;
  onDeleteSection: () => void;
  showImportMenu?: boolean;
  onImportDocuments?: (sectionId: string, sectionName: string) => void;
  documentsCount: number;
  dragHandleProps?: any;
}

export function SectionHeader({
  sectionData,
  index,
  totalSections,
  isExpanded,
  toggleExpand,
  onMoveSection,
  onRenameSection,
  onDeleteSection,
  showImportMenu = false,
  onImportDocuments,
  documentsCount,
  dragHandleProps,
}: SectionHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2 flex-1">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab hover:bg-accent rounded p-1 -ml-2"
          title={t('common.dragToReorder')}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div
          className="flex items-center gap-2 flex-1 cursor-pointer"
          onClick={toggleExpand}
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <h3 className="font-medium text-sm">{sectionData.name}</h3>
          <span className="text-sm text-muted-foreground ml-2">
            ({documentsCount})
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {index > 0 && (
            <DropdownMenuItem
              onClick={() => onMoveSection(sectionData.id, 'up')}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              {t('common.moveUp')}
            </DropdownMenuItem>
          )}
          {index < totalSections - 1 && (
            <DropdownMenuItem
              onClick={() => onMoveSection(sectionData.id, 'down')}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              {t('common.moveDown')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onRenameSection}>
            <Edit className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </DropdownMenuItem>

          {showImportMenu && (
            <DropdownMenuItem
              onClick={() =>
                onImportDocuments &&
                onImportDocuments(sectionData.id, sectionData.name)
              }
            >
              <Import className="mr-2 h-4 w-4" />
              {t('documents.importDocuments')}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDeleteSection}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
