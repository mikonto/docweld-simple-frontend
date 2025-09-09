import {
  FolderOpen,
  Package,
  FileText,
  FolderIcon,
  FlameIcon,
  ClipboardList,
  BarChart3,
  Library,
  Users,
  Building2,
} from 'lucide-react';

/**
 * Complete navigation configuration for DocWeld
 *
 * This file defines ALL navigation items for the application.
 * All routes, icons, and role-based access are managed here.
 */

// System-wide navigation items (main sections of the app)
export const getSystemNavigation = (t, userRole = 'user') => {
  const allItems = [
    {
      name: t ? t('navigation.projects') : 'Projects',
      path: '/',
      icon: FolderOpen,
      roles: ['admin'],
    },
    {
      name: t ? t('navigation.materialManagement') : 'Material Management',
      path: '/material-management',
      icon: Package,
      roles: ['admin'],
    },
    {
      name: t ? t('navigation.documentLibrary') : 'Document Library',
      path: '/document-library',
      icon: Library,
      roles: ['admin'],
    },
    {
      name: t ? t('navigation.userManagement') : 'User Management',
      path: '/user-management',
      icon: Users,
      roles: ['admin'],
    },
    {
      name: t ? t('navigation.companyProfile') : 'Company Profile',
      path: '/company-profile',
      icon: Building2,
      roles: ['admin'],
    },
  ];

  // Filter items based on user role
  return allItems.filter((item) => item.roles.includes(userRole));
};

// Project-specific navigation items (when inside a project)
export const getProjectNavigation = (projectId, t) => {
  if (!projectId) return [];

  return [
    {
      name: t ? t('navigation.projectOverview') : 'Project Overview',
      path: `/projects/${projectId}/project-overview`,
      icon: FolderIcon,
    },
    {
      name: t ? t('navigation.projectDocuments') : 'Project Documents',
      path: `/projects/${projectId}/documents`,
      icon: FileText,
    },
    {
      name: t ? t('navigation.weldLogs') : 'Weld Logs',
      path: `/projects/${projectId}/weld-logs`,
      icon: FlameIcon,
    },
    {
      name: t ? t('navigation.ndtOrders') : 'NDT Orders',
      path: `/projects/${projectId}/ndt-orders`,
      icon: ClipboardList,
      // TODO: Implement NDT Orders page
    },
    {
      name: t ? t('navigation.reports') : 'Reports',
      path: `/projects/${projectId}/reports`,
      icon: BarChart3,
      // TODO: Implement Reports page
    },
  ];
};

// Combined navigation helper
export const getNavigation = (userRole = 'user', projectId, t) => {
  return {
    system: getSystemNavigation(t, userRole),
    project: getProjectNavigation(projectId, t),
  };
};
