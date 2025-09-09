import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ChevronsUpDown, Check } from 'lucide-react';

import { useProjects } from '@/hooks/useProjects';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { SidebarMenuButton } from '@/components/ui/sidebar';

/**
 * Project selector component for switching between projects
 * Displays current project and allows selection from available projects
 */
export function ProjectSelector({ projectId }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [projects, loading] = useProjects('active');
  const currentProject = projects.find((p) => p.id === projectId);
  const { t } = useTranslation();

  const handleProjectSelect = (value) => {
    const selectedProject = projects.find((p) => p.id === value);
    if (selectedProject) {
      navigate(`/projects/${value}/project-overview`);
      setOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-2 w-2 bg-sidebar-primary animate-pulse rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-sidebar-accent animate-pulse rounded w-3/4 mb-1" />
          <div className="h-3 bg-sidebar-accent animate-pulse rounded w-1/2" />
        </div>
      </div>
    );
  }

  // Get display values once to avoid duplication
  const projectName =
    currentProject?.projectName || t('navigation.selectProject');
  const customerName = currentProject?.customer || t('navigation.noCustomer');

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex flex-col items-start flex-1 truncate">
            <span className="font-semibold truncate">{projectName}</span>
            <span className="text-xs text-sidebar-foreground/60 truncate">
              {customerName}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto shrink-0" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[280px] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t('navigation.searchProjects')} />
          <CommandList>
            <CommandEmpty>{t('navigation.noProjectsFound')}</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => handleProjectSelect(project.id)}
                  className="cursor-pointer"
                >
                  <span className="flex-1">{project.projectName}</span>
                  {project.id === projectId && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

ProjectSelector.propTypes = {
  projectId: PropTypes.string,
};
