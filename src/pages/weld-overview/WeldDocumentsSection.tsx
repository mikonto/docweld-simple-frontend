import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { StandaloneSection } from '@/components/documents/sections/standalone/StandaloneSection'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Document, UploadingFile } from '@/types/database'

interface DropdownAction {
  key: string
  label: string
  onSelect: () => void
}

interface WeldDocumentsSectionProps {
  documents: Document[]
  documentsLoading: boolean
  documentsError: Error | null
  onImportClick: () => void
  onDragEnd: (event: DragEndEvent) => void
  onUpload: (files: File[]) => void
  uploadingFiles: UploadingFile[]
  onRenameDocument: (id: string, title: string) => void
  onDeleteDocument: (id: string, title: string) => void
}

export function WeldDocumentsSection({
  documents,
  documentsLoading,
  documentsError,
  onImportClick,
  onDragEnd,
  onUpload,
  uploadingFiles,
  onRenameDocument,
  onDeleteDocument,
}: WeldDocumentsSectionProps): ReactElement {
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
      title={t('welds.weldDocuments')}
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