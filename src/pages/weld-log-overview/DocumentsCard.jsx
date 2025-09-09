import React from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import {
  Card as DocumentCard,
  UploadCard,
  CardGrid,
} from '@/components/documents/cards';
import {
  UPLOAD_CONFIG,
  DND_ACTIVATION_CONSTRAINT,
} from '@/components/documents/constants';

// Documents card component for displaying and managing documents
export function DocumentsCard({
  documents,
  documentsLoading,
  documentsError,
  onImportClick,
  onDragEnd,
  onUpload,
  uploadingFiles,
  onRenameDocument,
  onDeleteDocument,
}) {
  const { t } = useTranslation();

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: DND_ACTIVATION_CONSTRAINT,
    })
  );

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('weldLogs.weldLogDocuments')}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onImportClick}>
              {t('documents.importDocuments')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {documentsError ? (
          <div className="p-4 text-red-500">
            {t('documents.errorLoadingDocuments')}: {documentsError.message}
          </div>
        ) : documentsLoading ? (
          <div className="flex justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={documents.map((doc) => doc.id)}
              strategy={rectSortingStrategy}
            >
              <CardGrid>
                {documents.map((document) => (
                  <DocumentCard
                    key={document.id}
                    id={document.id}
                    title={document.title}
                    url={document.url}
                    mimeType={document.mimeType}
                    thumbnailUrl={document.thumbnailUrl}
                    metadata={document.metadata}
                    onRename={onRenameDocument}
                    onDelete={onDeleteDocument}
                  />
                ))}
                <UploadCard
                  onUpload={onUpload}
                  uploadingFiles={uploadingFiles}
                  config={UPLOAD_CONFIG}
                />
              </CardGrid>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
