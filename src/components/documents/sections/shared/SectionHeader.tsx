import React from 'react';
import {
  MoreHorizontal,
  ChevronRight,
  Edit,
  Import,
  Trash2,
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
  attributes?: any;
  listeners?: any;
  isDragging?: boolean;
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
  attributes,
  listeners,
  isDragging = false,
}: SectionHeaderProps) {
  const { t } = useTranslation();
  const [isMouseDown, setIsMouseDown] = React.useState(false);

  // Track mousedown/mouseup for immediate cursor feedback
  const handleMouseDown = React.useCallback(() => {
    setIsMouseDown(true);
  }, []);

  const handleMouseUp = React.useCallback(() => {
    setIsMouseDown(false);
  }, []);

  React.useEffect(() => {
    // Clean up on unmount or when dragging ends
    if (!isDragging) {
      setIsMouseDown(false);
    }
  }, [isDragging]);

  // Add global mouseup listener to handle mouse release outside element
  React.useEffect(() => {
    if (isMouseDown) {
      const handleGlobalMouseUp = () => setIsMouseDown(false);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isMouseDown]);

  const showGrabbingCursor = isMouseDown || isDragging;

  return (
    <div
      className={`flex items-center justify-between p-4 hover:bg-accent/50 cursor-${
        showGrabbingCursor ? 'grabbing' : 'grab'
      } relative`}
      {...attributes}
    >
      {/* Draggable Handle - covers most of the header */}
      <div
        {...listeners}
        className="absolute inset-0 right-12 z-10"
        aria-label="Drag handle"
        style={{ cursor: showGrabbingCursor ? 'grabbing' : 'pointer' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={toggleExpand}
      />

      <div className="flex items-center gap-2 flex-1 relative z-0">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 relative z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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