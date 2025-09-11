import { Outlet, useParams } from 'react-router-dom';

import { SidebarProvider } from '@/components/ui/sidebar';

import { AppSidebar } from './AppSidebar';
import { SiteHeader } from './SiteHeader';

export function AppLayout() {
  const params = useParams();
  const isInProject = Boolean(params.projectId);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full flex-col">
        <SiteHeader />

        <div className="flex flex-1 w-full">
          {isInProject && <AppSidebar />}

          <main
            role="main"
            className="flex-1 overflow-y-auto bg-main-background p-4 lg:p-8 scrollbar-thin"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}