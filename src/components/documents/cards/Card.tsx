import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Timestamp } from 'firebase/firestore';

import { Card as CardPrimitive } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDocumentDisplay } from '@/hooks/documents';
import { PROCESSING_STATES, UPLOAD_STATES } from '../constants';
import { getDisplayName } from '../utils/fileUtils';
import { formatDate } from '@/utils/dateFormatting';
import { formatFileSize } from '@/utils/formatFileSize';
import { CardImage } from './CardImage';
import { CardOverlay } from './CardOverlay';
import { ImageViewDialog } from './ImageViewDialog';

interface CardProps {
  id: string;
  title: string;
  storageRef: string;
  thumbStorageRef?: string | null;
  fileType?: string;
  createdAt?: Timestamp | null;
  fileSize?: number;
  processingState?: string | null;
  uploadStatus?: string | null;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
}

export const Card = React.memo(function Card({
  id,
  title,
  storageRef,
  thumbStorageRef = null,
  processingState = null,
  uploadStatus = null,
  fileType = '',
  createdAt = null,
  fileSize = 0,
  onRename,
  onDelete,
}: CardProps) {
  const { t } = useTranslation();

  // Drag & drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Document display hook for image handling
  const { imageToShow, isLoading, fullUrl, showFullImage, setShowFullImage } =
    useDocumentDisplay(storageRef, thumbStorageRef, false, processingState);

  // Get display name (handles HEIC to JPG conversion)
  const displayName = getDisplayName(title, storageRef, processingState);

  // Drag animation styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Event Handlers
  const handleRename = React.useCallback(() => {
    onRename(id, title);
  }, [id, onRename, title]);

  const handleDelete = React.useCallback(() => {
    onDelete(id, title);
  }, [id, onDelete, title]);

  return (
    <CardPrimitive
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`cursor-${
        isDragging ? 'grabbing' : 'grab'
      } relative overflow-hidden group h-full w-full`}
    >
      <CardImage
        imageToShow={imageToShow}
        isLoading={isLoading}
        processingState={processingState}
        uploadStatus={uploadStatus}
        title={title}
        showFullImage={showFullImage}
        setShowFullImage={setShowFullImage}
      />

      {/* Draggable Handle */}
      <div
        {...listeners}
        className="absolute inset-0 bottom-10 z-30 cursor-pointer"
        aria-label="Drag handle"
        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
        onClick={() => {
          if (!isDragging && !isLoading && fullUrl) {
            window.open(fullUrl, '_blank');
          }
        }}
      ></div>

      {/* Menu Button - Top Right Corner */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1.5 right-1.5 h-6 w-6 p-0 bg-background/50 backdrop-blur-sm text-foreground/70 hover:bg-background/90 hover:text-foreground z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 touch:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRename}>
            <Edit className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload Status Overlay */}
      {(uploadStatus === UPLOAD_STATES.UPLOADING ||
        processingState === PROCESSING_STATES.PENDING) && (
        <CardOverlay
          uploadStatus={uploadStatus}
          processingState={processingState}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 h-10 bg-background px-3 flex items-center z-40 cursor-default border-t border-border">
        <TooltipProvider>
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <p className="text-sm font-medium truncate text-foreground w-full">
                {displayName}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              <div className="space-y-1">
                <p className="font-medium">{displayName}</p>
                {createdAt && (
                  <p className="text-xs">
                    {t('documents.uploadedAt')}:{' '}
                    {formatDate(createdAt, 'shortDate')}
                  </p>
                )}
                <div className="text-xs space-y-0.5">
                  {fileSize > 0 && (
                    <p>
                      {t('documents.fileSize')}: {formatFileSize(fileSize)}
                    </p>
                  )}
                  {fileType && (
                    <p>
                      {t('documents.fileType')}:{' '}
                      {(fileType.toLowerCase() === 'heic' ||
                        fileType.toLowerCase() === 'heif') &&
                      processingState === PROCESSING_STATES.COMPLETED
                        ? 'JPG'
                        : fileType.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Full Image Dialog */}
      <ImageViewDialog
        isOpen={showFullImage}
        onClose={() => setShowFullImage(false)}
        imageUrl={fullUrl}
        title={title}
      />
    </CardPrimitive>
  );
});