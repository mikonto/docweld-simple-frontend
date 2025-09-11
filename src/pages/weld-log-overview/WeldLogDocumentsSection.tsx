import React from 'react'
import { useTranslation } from 'react-i18next'
import { StandaloneSection } from '@/components/documents/sections'
import type { Document, UploadingFile } from '@/types/database'
import type { DragEndEvent } from '@dnd-kit/core'

interface DropdownAction {
  key: string
  label: string
  onSelect: () => void
}

interface WeldLogDocumentsSectionProps {
  documents: Document[]
  documentsLoading: boolean
  documentsError: Error | null
  onImportClick: () => void
  onDragEnd: (event: DragEndEvent) => void
  onUpload: (files: FileList) => void
  uploadingFiles: Record<string, UploadingFile>
  onRenameDocument: (id: string, title: string) => void
  onDeleteDocument: (id: string, title: string) => void
}

export function WeldLogDocumentsSection({
  documents,
  documentsLoading,
  documentsError,
  onImportClick,
  onDragEnd,
  onUpload,
  uploadingFiles,
  onRenameDocument,
  onDeleteDocument,
}: WeldLogDocumentsSectionProps): React.ReactElement {
  const { t } = useTranslation()

  // Define dropdown actions for the section
  const dropdownActions: DropdownAction[] = [
    {
      key: 'import',
      label: t('documents.importDocuments'),
      onSelect: onImportClick,
    },
  ]

  return (
    <StandaloneSection
      title={t('weldLogs.weldLogDocuments')}
      documents={documents}
      documentsLoading={documentsLoading}
      documentsError={documentsError}
      uploadingFiles={uploadingFiles}
      onDragEnd={onDragEnd}
      onUpload={onUpload}
      onRenameDocument={onRenameDocument}
      onDeleteDocument={onDeleteDocument}
      dropdownActions={dropdownActions}
      initialExpanded={false}
    />
  )
}