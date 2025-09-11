import React from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

interface BreadcrumbData {
  projectName?: string;
  collectionName?: string;
  weldLogName?: string;
  weldNumber?: string;
}

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional data for breadcrumb entity names */
  breadcrumbData?: BreadcrumbData;
}

/**
 * PageHeader component displays page title with optional breadcrumbs and subtitle
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbData }) => {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {/* Title and breadcrumbs together */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
        {/* Title - always in the same position */}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

        {/* Breadcrumbs - baseline aligned with title */}
        <Breadcrumbs breadcrumbData={breadcrumbData} />
      </div>

      {/* Subtitle on its own line */}
      {subtitle && (
        <p className="text-muted-foreground text-base">{subtitle}</p>
      )}
    </div>
  );
};

export default PageHeader;