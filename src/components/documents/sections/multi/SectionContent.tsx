import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Card, UploadCard, CardGrid } from '@/components/documents/cards';
import {
  DND_ACTIVATION_CONSTRAINT,
  SECTION_SIZE_CONFIG,
} from '@/types/documents';
import type { Document } from '@/types/api/firestore';
import type { ProcessingState } from '@/types/documents';

interface UploadingFile {
  uploadStatus?: string;
  progress?: number;
}

interface SectionContentProps {
  documents: Document[];
  uploadingFiles: Record<string, UploadingFile>;
  onDragEnd: (event: DragEndEvent) => void;
  onUpload: (files: File[]) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  maxFilesAllowed: number;
}

export function SectionContent({
  documents,
  uploadingFiles,
  onDragEnd,
  onUpload,
  onRename,
  onDelete,
  maxFilesAllowed,
}: SectionContentProps) {
  // Configure drag sensors to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: DND_ACTIVATION_CONSTRAINT,
    })
  );

  return (
    <div className="p-4">
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
            <div
              style={{
                aspectRatio: 1 / SECTION_SIZE_CONFIG.MULTI.CARD_HEIGHT_RATIO,
              }}
            >
              <UploadCard
                onUpload={onUpload}
                maxFilesAllowed={maxFilesAllowed}
              />
            </div>

            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  aspectRatio: 1 / SECTION_SIZE_CONFIG.MULTI.CARD_HEIGHT_RATIO,
                }}
              >
                <Card
                  id={doc.id}
                  title={doc.title}
                  storageRef={doc.storageRef}
                  thumbStorageRef={doc.thumbStorageRef}
                  processingState={
                    doc.processingState as ProcessingState | null | undefined
                  }
                  fileType={doc.fileType}
                  fileSize={doc.fileSize}
                  createdAt={doc.createdAt}
                  uploadStatus={uploadingFiles[doc.id]?.uploadStatus}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </CardGrid>
        </SortableContext>
      </DndContext>
    </div>
  );
}
