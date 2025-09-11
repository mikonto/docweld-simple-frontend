import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/types';

interface ProjectDetailsCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

// Project details card component for displaying project information
export function ProjectDetailsCard({ project, onEdit }: ProjectDetailsCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('projects.projectDetails')}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(project)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('projects.editProject')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
            {/* Project Name - top-left corner */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.name')}
              </h4>
              <p className="text-sm font-medium">
                {project.projectName || '—'}
              </p>
            </div>

            {/* Customer */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('projects.customer')}
              </h4>
              <p className="text-sm font-medium">{project.customer || '—'}</p>
            </div>

            {/* Project Number */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('projects.projectNumber')}
              </h4>
              <p className="text-sm font-medium">
                {project.projectNumber || '—'}
              </p>
            </div>

            {/* External Reference */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('projects.externalReference')}
              </h4>
              <p className="text-sm font-medium">
                {project.externalReference || '—'}
              </p>
            </div>

            {/* Filler Materials */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('projects.fillerMaterials')}
              </h4>
              <Badge
                variant={
                  project.fillerMaterialTraceable ? 'success' : 'secondary'
                }
                className="text-sm"
              >
                {project.fillerMaterialTraceable
                  ? t('common.yes')
                  : t('common.no')}
              </Badge>
            </div>

            {/* Parent Materials */}
            <div className="bg-card px-6 py-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('projects.parentMaterials')}
              </h4>
              <Badge
                variant={
                  project.parentMaterialTraceable ? 'success' : 'secondary'
                }
                className="text-sm"
              >
                {project.parentMaterialTraceable
                  ? t('common.yes')
                  : t('common.no')}
              </Badge>
            </div>

            {/* Description - spans 2 columns */}
            <div className="bg-card px-6 py-3 md:col-span-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('common.description')}
              </h4>
              <p className="text-sm">{project.description || '—'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}