import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, MoreHorizontal, AlertCircle, Import } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
  type CollisionDescriptor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/custom/spinner';
import { Section } from './Section';
import { SectionHeader } from '../shared/SectionHeader';
import { DND_ACTIVATION_CONSTRAINT } from '@/types/documents';
import type { Section as SectionType, Document } from '@/types/api/firestore';

const centerAwareCollisionDetection: CollisionDetection = (args) => {
  const {
    collisionRect,
    droppableContainers,
    droppableRects,
  } = args;

  if (!collisionRect) {
    return [];
  }

  const centerX = collisionRect.left + collisionRect.width / 2;
  const centerY = collisionRect.top + collisionRect.height / 2;

  const collisions: CollisionDescriptor[] = [];

  for (const droppable of droppableContainers) {
    const rect = droppableRects.get(droppable.id) ?? droppable.rect.current;

    if (!rect) {
      continue;
    }

    if (
      centerX >= rect.left &&
      centerX <= rect.right &&
      centerY >= rect.top &&
      centerY <= rect.bottom
    ) {
      const droppableCenterX = rect.left + rect.width / 2;
      const droppableCenterY = rect.top + rect.height / 2;

      collisions.push({
        id: droppable.id,
        data: { droppableContainer: droppable },
        distance: Math.hypot(centerX - droppableCenterX, centerY - droppableCenterY),
      });
    }
  }

  if (collisions.length > 0) {
    return collisions.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }

  return closestCenter(args);
};

interface SectionsListProps {
  sections?: SectionType[];
  allDocuments?: Document[];
  isLoading: boolean;
  error?: Error | null;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onReorderSections?: (oldIndex: number, newIndex: number) => Promise<void>;
  onAddSection: () => void;
  onImportSections?: () => void;
  onImportDocuments?: (sectionId: string, sectionName: string) => void;
  collectionType: 'project' | 'library';
  entityId?: string;
  showImportMenu?: boolean;
}

export function SectionsList({
  sections,
  allDocuments,
  isLoading,
  error,
  onMoveSection,
  onReorderSections,
  onAddSection,
  onImportSections,
  onImportDocuments,
  collectionType,
  entityId,
  showImportMenu = false,
}: SectionsListProps) {
  const { t } = useTranslation();

  // Local state for immediate UI updates during drag
  const [localSections, setLocalSections] = React.useState(sections);
  const [activeSectionId, setActiveSectionId] = React.useState<string | null>(
    null
  );

  // Update local sections when props change
  React.useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  // Configure drag sensors to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: DND_ACTIVATION_CONSTRAINT,
    })
  );

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const { active } = event;

      if (typeof active.id === 'string') {
        setActiveSectionId(active.id);
      }
    },
    []
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveSectionId(null);

    if (!over || active.id === over.id || !localSections) {
      return;
    }

    const oldIndex = localSections.findIndex((s) => s.id === active.id);
    const newIndex = localSections.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Create reordered array for immediate UI update
      const reordered = [...localSections];
      const [movedSection] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, movedSection);

      // Update local state immediately for smooth animation
      setLocalSections(reordered);

      // Call the reorder function to update database
      if (onReorderSections) {
        try {
          await onReorderSections(oldIndex, newIndex);
        } catch (error) {
          // Revert on error
          setLocalSections(sections);
        }
      }
    }
  };

  const handleDragCancel = React.useCallback(() => {
    setActiveSectionId(null);
  }, []);

  const activeSection = React.useMemo(() => {
    if (!activeSectionId || !localSections) {
      return null;
    }

    return localSections.find((section) => section.id === activeSectionId) || null;
  }, [activeSectionId, localSections]);

  const getDocumentsCount = React.useCallback(
    (sectionId: string) => {
      if (!allDocuments) {
        return 0;
      }

      return allDocuments.filter((doc) => doc.sectionId === sectionId).length;
    },
    [allDocuments]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <CardTitle className="text-red-700 mb-2">
            {t('documents.errorLoadingSections')}
          </CardTitle>
          <p className="text-red-700">
            {error.message || t('common.unexpectedError')}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            {t('common.tryAgainOrContact')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!localSections || localSections.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row justify-between border-b h-12 pr-6 pl-3">
          {showImportMenu && onImportSections && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={onImportSections}>
                  <Import className="mr-2 h-4 w-4" />
                  {t('documents.importSections')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="flex-1"></div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[40vh] text-center py-12">
          <p className="text-muted-foreground mb-4">
            {t('documents.noSectionsFound')}
          </p>
          <Button variant="default" onClick={onAddSection}>
            <PlusIcon className="size-4 mr-2" />
            {t('documents.addSection')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row justify-between border-b h-12 pr-6 pl-3">
        {showImportMenu && onImportSections && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onImportSections}>
                <Import className="mr-2 h-4 w-4" />
                {t('documents.importSections')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className="flex-1"></div>
        <Button variant="default" onClick={onAddSection} size="sm">
          <PlusIcon className="size-4 mr-2" />
          {t('documents.addSection')}
        </Button>
      </CardHeader>

      <CardContent className="p-0 pt-0 mt-0">
        <DndContext
          sensors={sensors}
          collisionDetection={centerAwareCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={localSections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {localSections.map((section, index) => (
              <Section
                collectionType={collectionType}
                entityId={entityId}
                key={section.id}
                sectionData={section}
                allDocuments={allDocuments || []}
                index={index}
                onMoveSection={onMoveSection}
                totalSections={localSections.length}
                showImportMenu={showImportMenu}
                onImportDocuments={onImportDocuments}
              />
            ))}
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
            {activeSection ? (
              <div className="w-full border-b bg-background">
                <SectionHeader
                  sectionData={activeSection}
                  index={localSections.findIndex(
                    (section) => section.id === activeSection.id
                  )}
                  totalSections={localSections.length}
                  isExpanded={false}
                  toggleExpand={() => {}}
                  onMoveSection={() => {}}
                  onRenameSection={() => {}}
                  onDeleteSection={() => {}}
                  documentsCount={getDocumentsCount(activeSection.id)}
                  showImportMenu={showImportMenu}
                  onImportDocuments={onImportDocuments}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
