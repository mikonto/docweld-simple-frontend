import { useParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ArrowLeft } from 'lucide-react';

import { useApp } from '@/contexts/AppContext';
import { getNavigation } from '@/config/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';

import { ProjectSelector } from './ProjectSelector';

/**
 * Project sidebar component
 * Displays project-specific navigation when user is inside a project
 */
export function AppSidebar() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { loggedInUser } = useApp();
  const { t } = useTranslation();

  // Get navigation items for the current project
  // AppSidebar only renders when inside a project (see AppLayout.tsx)
  const navigation = getNavigation(loggedInUser?.role, projectId || null, t);

  return (
    <Sidebar
      className="top-14 h-[calc(100vh-3.5rem)] lg:flex"
      collapsible="offcanvas"
      data-testid="app-sidebar"
    >
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <ProjectSelector projectId={projectId} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.project.map((item) => {
                // Check if current path matches exactly or is a child route
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + '/');
                return (
                  <SidebarMenuItem key={item.path} className="relative mb-1">
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md" />
                    )}
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.path}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <ArrowLeft />
                <span>{t('navigation.backToProjects')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
