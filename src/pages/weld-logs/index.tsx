import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layouts/PageHeader';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { getConfirmationContent } from '@/utils/confirmationContent';
import { useProject } from '@/hooks/useProjects';
import { useWeldLogs, useWeldLogOperations } from '@/hooks/useWeldLogs';
import { WeldLogFormDialog } from './WeldLogFormDialog';
import { WeldLogsTable } from './WeldLogsTable';
import { Spinner } from '@/components/ui/custom/spinner';
import { Card, CardContent } from '@/components/ui/card';
import type { WeldLog, WeldLogFormData } from '@/types/app';

export default function WeldLogs() {
  const { t } = useTranslation();

  // Get the project ID from the URL parameters
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Fetch the project and weld logs data
  const [project, projectLoading, projectError] = useProject(projectId);
  const [weldLogs = [], weldLogsLoading, weldLogsError] =
    useWeldLogs(projectId);

  // Get CRUD operations for weld logs
  const { createWeldLog, updateWeldLog, deleteWeldLog } =
    useWeldLogOperations();

  // Hooks for managing dialogs
  const formDialog = useFormDialog<WeldLog>();
  const confirmDialog = useConfirmationDialog({
    delete: deleteWeldLog,
  });

  // Navigate to weld log details when a row is clicked
  const handleRowClick = (rowData: WeldLog) => {
    navigate(`/projects/${projectId}/weld-logs/${rowData.id}`);
  };

  // Get confirmation content for the dialog
  const { type, isBulk, data } = confirmDialog.dialog;
  const count = isBulk ? data?.length : 1;
  const confirmContent = getConfirmationContent(
    type,
    isBulk,
    count,
    t,
    'weldLogs'
  );

  // Handler for weld log form submission
  const handleWeldLogSubmit = async (data: WeldLogFormData) => {
    try {
      // Check if we have an existing weld log to update
      const existingWeldLog = formDialog.entity;

      if (existingWeldLog) {
        await updateWeldLog(existingWeldLog.id, data);
      } else {
        if (projectId) {
          await createWeldLog(projectId, data);
        }
      }

      // Close the dialog on success
      formDialog.close();
    } catch {
      // Errors are handled by the operation hooks (toast notifications)
      // We don't need to do anything here
    }
  };

  return (
    <>
      {/* Main content with padding */}
      <div className="space-y-6">
        {!projectLoading && !projectError && project && (
          <PageHeader
            title={t('weldLogs.title')}
            subtitle=""
            breadcrumbData={{ projectName: project.projectName }}
          />
        )}

        {projectError && (
          <Card className="flex items-center justify-center py-12">
            <CardContent>
              <p className="text-red-700">
                {t('common.error')} {t('common.loading').toLowerCase()}{' '}
                {t('weldLogs.project').toLowerCase()}: {projectError.message}
              </p>
            </CardContent>
          </Card>
        )}

        {projectLoading ? (
          <Card className="flex items-center justify-center py-12">
            <Spinner />
          </Card>
        ) : (
          <ErrorLoadingWrapper
            error={weldLogsError || null}
            loading={weldLogsLoading}
            resourceName={t('weldLogs.title').toLowerCase()}
          >
            <WeldLogsTable
              weldLogs={weldLogs}
              loading={weldLogsLoading}
              onEdit={formDialog.open}
              onCreateNew={() => formDialog.open()}
              onConfirmAction={confirmDialog.open}
              onRowClick={handleRowClick}
            />
          </ErrorLoadingWrapper>
        )}
      </div>

      {/* Weld log form dialog for create/edit */}
      <WeldLogFormDialog
        open={formDialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) formDialog.close();
        }}
        weldLog={formDialog.entity}
        onSubmit={handleWeldLogSubmit}
      />

      {/* Unified Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.dialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) confirmDialog.close();
        }}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmContent.title}
        description={confirmContent.description}
        actionLabel={confirmContent.actionLabel}
        actionVariant={confirmContent.actionVariant}
      />
    </>
  );
}