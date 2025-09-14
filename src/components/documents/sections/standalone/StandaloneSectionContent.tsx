import type { CSSProperties } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Card, UploadCard } from '@/components/documents/cards';
import {
  DND_ACTIVATION_CONSTRAINT,
  SECTION_SIZE_CONFIG,
} from '@/components/documents/constants';
import type { Document } from '@/types/database';
import type { ProcessingState } from '@/components/documents/constants';

export interface StandaloneSectionContentProps {
  documents: Document[];
  uploadingFiles: Record<string, { uploadStatus?: string }>;
  onDragEnd: (event: DragEndEvent) => void;
  onUpload: (files: File[]) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  maxFilesAllowed: number;
}

/**
 * StandaloneSectionContent - Content area for standalone sections
 * Displays documents in a grid layout
 * Simplified to match MULTI section behavior - no internal scrolling
 */
export function StandaloneSectionContent({
  documents,
  uploadingFiles,
  onDragEnd,
  onUpload,
  onRename,
  onDelete,
  maxFilesAllowed,
}: StandaloneSectionContentProps) {
  // Configure drag sensors to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: DND_ACTIVATION_CONSTRAINT,
    })
  );

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${SECTION_SIZE_CONFIG.STANDALONE.CARD_MIN_WIDTH}px, 1fr))`,
    gap: '1rem',
  };

  const cardStyle: CSSProperties = {
    aspectRatio: 1 / SECTION_SIZE_CONFIG.STANDALONE.CARD_HEIGHT_RATIO,
  };

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
          {/* Grid container like CardGrid */}
          <div style={gridStyle}>
            {/* Upload card */}
            <div style={cardStyle}>
              <UploadCard
                onUpload={onUpload}
                maxFilesAllowed={maxFilesAllowed}
              />
            </div>

            {/* Document cards */}
            {documents.map((doc) => (
              <div key={doc.id} style={cardStyle}>
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
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
