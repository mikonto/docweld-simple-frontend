import { useTranslation } from 'react-i18next';
import { StandaloneSection } from '@/components/documents/sections/standalone/StandaloneSection';
import PropTypes from 'prop-types';

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
  );
}

WeldDocumentsSection.propTypes = {
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
