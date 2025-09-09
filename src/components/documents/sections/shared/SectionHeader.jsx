import { MoreHorizontal, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-4">
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
              {t('common.moveUp')}
            </DropdownMenuItem>
          )}
          {index < totalSections - 1 && (
            <DropdownMenuItem
              onClick={() => onMoveSection(sectionData.id, 'down')}
            >
              {t('common.moveDown')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onRenameSection}>
            {t('common.edit')}
          </DropdownMenuItem>

          {showImportMenu && (
            <DropdownMenuItem
              onClick={() =>
                onImportDocuments &&
                onImportDocuments(sectionData.id, sectionData.name)
              }
            >
              {t('documents.importDocuments')}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDeleteSection}>
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

SectionHeader.propTypes = {
  sectionData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  totalSections: PropTypes.number.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  toggleExpand: PropTypes.func.isRequired,
  onMoveSection: PropTypes.func.isRequired,
  onRenameSection: PropTypes.func.isRequired,
  onDeleteSection: PropTypes.func.isRequired,
  showImportMenu: PropTypes.bool,
  onImportDocuments: PropTypes.func,
  documentsCount: PropTypes.number.isRequired,
};
