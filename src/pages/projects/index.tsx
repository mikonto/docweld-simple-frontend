import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';
import { useProjects, useProjectOperations } from '@/hooks/useProjects';

import PageHeader from '@/components/layouts/PageHeader';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { ProjectFormDialog } from './ProjectFormDialog';
import { ProjectsTable } from './ProjectsTable';
import type { Project, ProjectFormData } from '@/types';
import type { IdentifiableEntity } from '@/hooks/useConfirmationDialog';

export default function Projects() {
  const { t } = useTranslation();

  // State for active tab (active or archived projects)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Fetch projects based on active tab (active/archived)
  const [projects = [], loading, error] = useProjects(activeTab);

  // Get CRUD operations for projects
  const {
    deleteProject,
    archiveProject,
    restoreProject,
    updateProject,
    createProject,
  } = useProjectOperations();

  // Hooks for managing dialogs
  const formDialog = useFormDialog<Project>();
  const confirmDialog = useConfirmationDialog({
    delete: (id: string) => deleteProject(id).then(() => {}),
    archive: (id: string) => archiveProject(id).then(() => {}),
    restore: (id: string) => restoreProject(id).then(() => {}),
  });

  // Navigate to project overview when a row is clicked
  const navigate = useNavigate();
  const handleRowClick = (rowData: Project) => {
    navigate(`/projects/${rowData.id}/project-overview`);
  };

  // Get confirmation content for the dialog
  const { type, isBulk, data } = confirmDialog.dialog;
  const count = isBulk && Array.isArray(data) ? data.length : 1;
  const confirmContent = type
    ? getConfirmationContent(type, isBulk, count, t, 'projects')
    : { title: '', description: '', actionLabel: '', actionVariant: 'default' as const };

  // Handler for project form submission
  const handleProjectSubmit = async (data: Partial<Project>) => {
    try {
      // Check if we have an existing project to update
      const existingProject = formDialog.entity;

      if (existingProject) {
        await updateProject(existingProject.id, data);
      } else {
        // Convert to ProjectFormData for creation
        const formData: ProjectFormData = {
          projectName: data.projectName!,
          projectNumber: data.projectNumber,
          client: data.client,
          customer: data.customer,
          location: data.location,
          externalReference: data.externalReference,
          status: data.status,
        };
        await createProject(formData);
      }

      // Close the dialog on success
      formDialog.close();
    } catch {
      // Errors are handled by the operation hooks (toast notifications)
      // We don't need to do anything here
    }
  };

  // Handler for form dialog close
  const handleFormDialogChange = (isOpen: boolean) => {
    if (!isOpen) formDialog.close();
  };

  // Handler for confirmation dialog close
  const handleConfirmDialogChange = (isOpen: boolean) => {
    if (!isOpen) confirmDialog.close();
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('projects.title')} />

      <ErrorLoadingWrapper
        error={error || null}
        loading={loading}
        resourceName="projects"
      >
        <ProjectsTable
          projects={projects}
          loading={loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onEdit={formDialog.open}
          onCreateNew={() => formDialog.open()}
          onConfirmAction={(action, data, isBulk) =>
            confirmDialog.open(
              action,
              data as unknown as IdentifiableEntity | IdentifiableEntity[],
              isBulk
            )
          }
          onRowClick={handleRowClick}
        />
      </ErrorLoadingWrapper>

      {/* Project form dialog for create/edit */}
      <ProjectFormDialog
        open={formDialog.isOpen}
        onOpenChange={handleFormDialogChange}
        project={formDialog.entity}
        onSubmit={handleProjectSubmit}
      />

      {/* Unified Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.dialog.isOpen}
        onOpenChange={handleConfirmDialogChange}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmContent.title}
        description={confirmContent.description}
        actionLabel={confirmContent.actionLabel}
        actionVariant={confirmContent.actionVariant}
      />
    </div>
  );
}
