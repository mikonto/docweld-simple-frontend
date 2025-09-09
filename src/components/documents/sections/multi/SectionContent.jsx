import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Card, UploadCard, CardGrid } from '@/components/documents/cards';
import {
  DND_ACTIVATION_CONSTRAINT,
  SECTION_SIZE_CONFIG,
} from '@/components/documents/constants';

export function SectionContent({
  documents,
  uploadingFiles,
  onDragEnd,
  onUpload,
  onRename,
  onDelete,
  maxFilesAllowed,
}) {
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
                  processingState={doc.processingState}
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

SectionContent.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      storageRef: PropTypes.string.isRequired,
      thumbStorageRef: PropTypes.string,
      processingState: PropTypes.string,
      fileType: PropTypes.string,
      fileSize: PropTypes.number,
      createdAt: PropTypes.object,
    })
  ).isRequired,
  uploadingFiles: PropTypes.object.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  maxFilesAllowed: PropTypes.number.isRequired,
};
