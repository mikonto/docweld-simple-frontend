import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layouts/PageHeader';
import { SectionsContainer } from '@/components/documents/sections';
import { useDocumentCollection } from '@/hooks/useDocumentLibrary';

const DocumentLibraryCollection: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [collection] = useDocumentCollection(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('documentLibrary.documentCollection')}
        breadcrumbData={{ collectionName: collection?.name }}
      />

      {/* SectionsContainer now handles its own loading/error state */}
      <SectionsContainer collectionType="library" entityId={id} />
    </div>
  );
};

export default DocumentLibraryCollection;