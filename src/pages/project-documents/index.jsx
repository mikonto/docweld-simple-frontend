import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layouts/PageHeader';
import { SectionsContainer } from '@/components/documents/sections';
import { useProject } from '@/hooks/useProjects';
import { Spinner } from '@/components/ui/custom/spinner';
import { Card, CardContent } from '@/components/ui/card';

const ProjectDocuments = () => {
  const { t } = useTranslation();
  const { projectId } = useParams();

  // Fetch the project data
  const [project, loading, error] = useProject(projectId);

  // Define import source configuration
  const importSource = {
    collectionType: 'library',
    entityId: 'main',
  };

  return (
    <>
      {/* Main content with padding */}
      <div className="space-y-6">
        {!loading && !error && project && (
          <PageHeader
            title={t('navigation.projectDocuments')}
            // subtitle="View and manage documents for this project."
            breadcrumbData={{ projectName: project.projectName }}
          />
        )}

        {error && (
          <Card className="flex items-center justify-center py-12">
            <CardContent>
              <p className="text-red-700">
                {t('common.error')}: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card className="flex items-center justify-center py-12">
            <Spinner />
          </Card>
        ) : (
          <>
            {/* SectionsList with import functionality from document-library */}
            <SectionsContainer
              collectionType="project"
              entityId={projectId}
              showImportMenu={true}
              importSource={importSource}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ProjectDocuments;
