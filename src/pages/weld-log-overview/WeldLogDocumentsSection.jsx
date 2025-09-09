import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { StandaloneSection } from '@/components/documents/sections';

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
}) {
  const { t } = useTranslation();

  // Define dropdown actions for the section
  const dropdownActions = [
    {
      key: 'import',
      label: t('documents.importDocuments'),
      onSelect: onImportClick,
    },
  ];

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
  );
}

WeldLogDocumentsSection.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      storageRef: PropTypes.string,
      thumbStorageRef: PropTypes.string,
      processingState: PropTypes.string,
      uploadStatus: PropTypes.string,
      fileType: PropTypes.string,
      createdAt: PropTypes.object,
      fileSize: PropTypes.number,
    })
  ).isRequired,
  documentsLoading: PropTypes.bool.isRequired,
  documentsError: PropTypes.object,
  onImportClick: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  uploadingFiles: PropTypes.array.isRequired,
  onRenameDocument: PropTypes.func.isRequired,
  onDeleteDocument: PropTypes.func.isRequired,
};
