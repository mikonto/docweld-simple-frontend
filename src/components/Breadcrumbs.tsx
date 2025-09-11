import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Route-to-translation-key mapping
const routeTranslationKeys: Record<string, string> = {
  projects: 'navigation.projects',
  'material-management': 'navigation.materialManagement',
  'document-library': 'navigation.documentLibrary',
  'user-management': 'navigation.userManagement',
  'company-profile': 'navigation.companyProfile',
  'project-overview': 'navigation.projectOverview',
  documents: 'navigation.projectDocuments',
  'weld-logs': 'navigation.weldLogs',
  'ndt-orders': 'navigation.ndtOrders',
  reports: 'navigation.reports',
  collection: 'documentLibrary.collection',
};

export interface BreadcrumbData {
  projectName?: string;
  collectionName?: string;
  weldLogName?: string;
  weldNumber?: string;
}

interface BreadcrumbsProps {
  className?: string;
  breadcrumbData?: BreadcrumbData;
}

interface BreadcrumbItem {
  label: string;
  path: string;
}

/**
 * Breadcrumbs component that displays navigation trail
 */
export function Breadcrumbs({ className, breadcrumbData = {} }: BreadcrumbsProps) {
  const location = useLocation();
  const params = useParams();
  const { t } = useTranslation();

  // Extract data from props
  const { projectName, collectionName, weldLogName, weldNumber } =
    breadcrumbData;

  // Determine route context
  const projectId = params.projectId;
  const isProjectRoute = Boolean(projectId);
  const isWeldLogRoute =
    location.pathname.includes('/weld-logs/') && params.weldLogId;
  const isWeldRoute = location.pathname.includes('/welds/') && params.weldId;

  // Top-level paths that don't show breadcrumbs
  const topLevelPaths = [
    '/',
    '/material-management',
    '/user-management',
    '/document-library',
    '/company-profile',
  ];

  if (topLevelPaths.includes(location.pathname)) {
    return null;
  }

  // Parse pathname into breadcrumb items
  const paths = location.pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  paths.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Handle projects root
    if (segment === 'projects' && index === 0) {
      items.push({ label: t('navigation.projects'), path: '/' });
      return;
    }

    // Handle project ID - add project name
    if (segment === projectId && isProjectRoute && index === 1) {
      items.push({
        label: projectName || projectId,
        path: `/projects/${projectId}`,
      });
      return;
    }

    // Handle project-specific pages
    if (isProjectRoute && index === 2) {
      if (segment === 'project-overview') {
        // Don't add Project Overview to breadcrumbs as it's shown in the page title
        return;
      } else if (segment === 'documents') {
        items.push({
          label: t('navigation.projectDocuments'),
          path: currentPath,
        });
        return;
      } else if (segment === 'weld-logs') {
        items.push({
          label: t('navigation.weldLogs'),
          path: currentPath,
        });
        return;
      }
    }

    // Handle weld log ID - add weld log name
    if (segment === params.weldLogId && isWeldLogRoute && index === 3) {
      items.push({
        label: weldLogName || params.weldLogId,
        path: currentPath,
      });
      return;
    }

    // Skip 'welds' segment in the URL - we don't want it in breadcrumbs
    if (segment === 'welds' && isWeldLogRoute && index === 4) {
      return; // Skip this segment
    }

    // Handle weld ID - add weld number (now at index 5 in URL, but will appear after weld log in breadcrumb)
    if (segment === params.weldId && isWeldRoute && index === 5) {
      items.push({
        label: weldNumber || params.weldId,
        path: currentPath,
      });
      return;
    }

    // Handle collection label specially
    if (segment === 'collection' && collectionName) {
      items.push({ label: collectionName, path: currentPath });
      return;
    }

    // Skip params.id, params.projectId, params.weldLogId and params.weldId segments that weren't handled above
    if (
      (params.id && segment === params.id) ||
      (params.projectId && segment === params.projectId) ||
      (params.weldLogId && segment === params.weldLogId) ||
      (params.weldId && segment === params.weldId)
    ) {
      return;
    }

    // Get label from translation key or format the segment
    const translationKey = routeTranslationKeys[segment];
    const label = translationKey
      ? t(translationKey)
      : segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

    items.push({ label, path: currentPath });
  });

  if (items.length === 0) return null;

  return (
    <>
      {/* Separator between title and breadcrumbs */}
      <span className="hidden lg:inline text-sm text-gray-400 dark:text-gray-600">
        ·
      </span>

      <nav
        aria-label="Breadcrumb"
        className={`flex items-center text-sm text-gray-500 dark:text-gray-400${className ? ` ${className}` : ''}`}
      >
        <ol role="list" className="flex items-center space-x-1.5">
          {items.map((item, index) => (
            <React.Fragment key={`${item.path}-${index}`}>
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-600"
                  aria-hidden="true"
                />
              )}
              <li className="flex">
                {index === items.length - 1 ? (
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="transition hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>
    </>
  );
}