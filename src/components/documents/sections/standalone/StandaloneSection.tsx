import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StandaloneSectionContent } from './StandaloneSectionContent';
import {
  UPLOAD_CONFIG,
  SECTION_SIZE_CONFIG,
} from '@/components/documents/constants';
import type { Document } from '@/types/database';
import type { DragEndEvent } from '@dnd-kit/core';
import type { LucideIcon } from 'lucide-react';

export interface DropdownAction {
  key?: string;
  label: string;
  onSelect: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface StandaloneSectionProps {
  title: string;
  documents?: Document[];
  documentsLoading?: boolean;
  documentsError?: Error | null;
  uploadingFiles?: Record<string, { uploadStatus?: string }>;
  onDragEnd: (event: DragEndEvent) => void;
  onUpload: (files: File[]) => void;
  onRenameDocument: (id: string, title: string) => void;
  onDeleteDocument: (id: string, title: string) => void;
  dropdownActions?: DropdownAction[];
  initialExpanded?: boolean;
  className?: string;
}

/**
 * StandaloneSection - A reusable component for single document sections
 * Used for features that need a single collapsible document section
 * (e.g., Attachments, future standalone document sections)
 */
export function StandaloneSection({
  title,
  documents = [],
  documentsLoading = false,
  documentsError = null,
  uploadingFiles = {},
  onDragEnd,
  onUpload,
  onRenameDocument,
  onDeleteDocument,
  dropdownActions = [],
  initialExpanded = false,
  className = '',
}: StandaloneSectionProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`w-full border rounded-lg bg-card ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={toggleExpand}
          className="flex items-center gap-2 flex-1 text-left -m-2 p-2 rounded cursor-pointer"
          aria-label={t('documents.toggleSection')}
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground ml-2">
            ({documents.length})
          </span>
        </button>

        {/* Actions Menu - only show if there are actions */}
        {dropdownActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                aria-label={t('documents.sectionMenu')}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dropdownActions.map((action, index) => (
                <DropdownMenuItem
                  key={action.key || index}
                  onSelect={action.onSelect}
                  disabled={action.disabled}
                >
                  {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Section Content with Expand/Collapse Animation */}
      <div
        data-testid="section-content"
        className={`overflow-hidden transition-all ease-in-out ${
          isExpanded ? 'max-h-[5000px]' : 'max-h-0'
        }`}
        style={{
          transitionDuration: `${SECTION_SIZE_CONFIG.STANDALONE.ANIMATION_DURATION}ms`,
        }}
      >
        {documentsError ? (
          <div className="p-4 text-red-500">
            {t('documents.errorLoadingDocuments')}: {documentsError.message}
          </div>
        ) : documentsLoading ? (
          <div className="flex justify-center p-8">
            <div
              data-testid="loading-spinner"
              className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            />
          </div>
        ) : (
          <StandaloneSectionContent
            documents={documents}
            uploadingFiles={uploadingFiles}
            onDragEnd={onDragEnd}
            onUpload={onUpload}
            onRename={onRenameDocument}
            onDelete={onDeleteDocument}
            maxFilesAllowed={UPLOAD_CONFIG.MAX_FILES}
          />
        )}
      </div>
    </div>
  );
}
