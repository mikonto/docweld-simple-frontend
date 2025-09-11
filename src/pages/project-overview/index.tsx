import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useProject, useProjectOperations } from '@/hooks/useProjects';
import {
  useProjectParticipants,
  useParticipantOperations,
} from '@/hooks/useProjectParticipants';
import { useUsers } from '@/hooks/useUsers';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';

import PageHeader from '@/components/layouts/PageHeader';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { ProjectFormDialog } from '../projects/ProjectFormDialog';
import { ProjectDetailsCard } from './ProjectDetailsCard';
import { ParticipantsTable } from './ParticipantsTable';
import { ParticipantFormDialog } from './ParticipantFormDialog';
import type { Project, ProjectParticipant } from '@/types/database';

export default function ProjectOverview() {
  const { t } = useTranslation();

  // Get the project ID from the URL parameters
  const { projectId } = useParams<{ projectId: string }>();

  // Fetch project and participants data
  const [project, loading, error] = useProject(projectId);
  const [participants, participantsLoading, participantsError] =
    useProjectParticipants(projectId);

  // Fetch all users to look up participant details
  const [users, usersLoading] = useUsers();

  // Get CRUD operations for participants and projects
  const { addParticipant, updateParticipant, removeParticipant } =
    useParticipantOperations();
  const { updateProject } = useProjectOperations();

  // Hooks for managing dialogs
  const participantFormDialog = useFormDialog<ProjectParticipant>();
  const participantConfirmDialog = useConfirmationDialog({
    remove: removeParticipant,
  });

  // State for project edit dialog (separate since it's edit-only)
  const [projectFormDialog, setProjectFormDialog] = useState<{
    isOpen: boolean;
    project: Project | null;
  }>({
    isOpen: false,
    project: null,
  });

  // Get confirmation content for the dialog
  const { type, isBulk, data } = participantConfirmDialog.dialog;
  const count = isBulk ? (data as ProjectParticipant[])?.length : 1;
  const confirmContent = getConfirmationContent(
    type,
    isBulk,
    count,
    t,
    'projects'
  );

  // Handler for participant form submission
  const handleParticipantSubmit = async (data: Partial<ProjectParticipant>) => {
    try {
      // Check if we have an existing participant to update
      const existingParticipant = participantFormDialog.entity;

      if (existingParticipant) {
        await updateParticipant(existingParticipant.id, data);
      } else {
        await addParticipant(projectId!, data);
      }

      // Close the dialog on success
      participantFormDialog.close();
    } catch {
      // Errors are handled by the operation hooks (toast notifications)
      // We don't need to do anything here
    }
  };

  // Handler for project form submission
  const handleProjectSubmit = async (data: Partial<Project>) => {
    try {
      // Update the project details
      await updateProject(projectId!, data);

      // Close the dialog on success
      setProjectFormDialog({ isOpen: false, project: null });
    } catch {
      // Errors are handled by the operation hooks (toast notifications)
      // We don't need to do anything here
    }
  };

  // Handler for opening project edit dialog
  const handleProjectEdit = (project: Project) => {
    setProjectFormDialog({
      isOpen: true,
      project,
    });
  };

  // Handler for participant dialog close
  const handleParticipantDialogChange = (isOpen: boolean) => {
    if (!isOpen) participantFormDialog.close();
  };

  // Handler for project dialog close
  const handleProjectDialogChange = (isOpen: boolean) => {
    setProjectFormDialog((prev) => ({ ...prev, isOpen }));
  };

  // Handler for confirmation dialog close
  const handleConfirmDialogChange = (isOpen: boolean) => {
    if (!isOpen) participantConfirmDialog.close();
  };

  return (
    <>
      <div className="space-y-6">
        {!loading && !error && project && (
          <PageHeader
            title={t('projects.projectOverview')}
            breadcrumbData={{ projectName: project.projectName }}
          />
        )}

        <ErrorLoadingWrapper
          error={error}
          loading={loading}
          resourceName={t('common.project')}
        >
          {project && (
            <div className="space-y-4">
              <ProjectDetailsCard
                project={project}
                onEdit={handleProjectEdit}
              />

              <ErrorLoadingWrapper
                error={participantsError}
                loading={participantsLoading}
                resourceName={t('projects.participants')}
              >
                <ParticipantsTable
                  participants={participants}
                  users={users}
                  loading={usersLoading}
                  onAddParticipant={() => participantFormDialog.open()}
                  onEdit={participantFormDialog.open}
                  onConfirmAction={participantConfirmDialog.open}
                />
              </ErrorLoadingWrapper>
            </div>
          )}
        </ErrorLoadingWrapper>
      </div>

      {/* Participant form dialog for create/edit */}
      <ParticipantFormDialog
        open={participantFormDialog.isOpen}
        onOpenChange={handleParticipantDialogChange}
        participant={participantFormDialog.entity}
        onSubmit={handleParticipantSubmit}
      />

      {/* Project form dialog for edit only */}
      <ProjectFormDialog
        open={projectFormDialog.isOpen}
        onOpenChange={handleProjectDialogChange}
        project={projectFormDialog.project}
        onSubmit={handleProjectSubmit}
      />

      {/* Unified Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={participantConfirmDialog.dialog.isOpen}
        onOpenChange={handleConfirmDialogChange}
        onConfirm={participantConfirmDialog.handleConfirm}
        title={confirmContent.title}
        description={confirmContent.description}
        actionLabel={confirmContent.actionLabel}
        actionVariant={confirmContent.actionVariant}
      />
    </>
  );
}