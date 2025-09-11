import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { Breadcrumbs } from './Breadcrumbs';
import type { BreadcrumbData } from './Breadcrumbs';

// Helper function to render with router and i18n
const renderWithRouter = (initialEntries = ['/'], breadcrumbData: BreadcrumbData = {}) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="*"
            element={<Breadcrumbs breadcrumbData={breadcrumbData} />}
          />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
};

describe('Breadcrumbs', () => {
  it('should not render on top-level paths', () => {
    renderWithRouter(['/']);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('should render translated labels for main routes', () => {
    const testCases = [
      { path: '/projects/123/project-overview', expectedText: 'Projects' },
      {
        path: '/material-management/some-page',
        expectedText: 'Material Management',
      },
      {
        path: '/document-library/collection/123',
        expectedText: 'Document Library',
      },
      { path: '/user-management/edit/123', expectedText: 'User Management' },
      { path: '/company-profile/edit', expectedText: 'Company Profile' },
    ];

    testCases.forEach(({ path, expectedText }) => {
      renderWithRouter([path]);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  it('should render multiple breadcrumb segments for nested routes', () => {
    renderWithRouter(['/projects/123/weld-logs']);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Weld Logs')).toBeInTheDocument();
  });

  it('should render project documents breadcrumb', () => {
    renderWithRouter(['/projects/123/documents']);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Project Documents')).toBeInTheDocument();
  });

  it('should use project name from breadcrumbData when provided', () => {
    // Need to set up route with params
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/projects/123/project-overview']}>
          <Routes>
            <Route
              path="/projects/:projectId/*"
              element={
                <Breadcrumbs
                  breadcrumbData={{ projectName: 'Steel Bridge Project' }}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Steel Bridge Project')).toBeInTheDocument();
  });

  it('should use collection name from breadcrumbData when provided', () => {
    renderWithRouter(['/document-library/collection/abc'], {
      collectionName: 'Safety Procedures',
    });

    expect(screen.getByText('Document Library')).toBeInTheDocument();
    expect(screen.getByText('Safety Procedures')).toBeInTheDocument();
  });

  it('should use weld log name from breadcrumbData when provided', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/projects/123/weld-logs/456']}>
          <Routes>
            <Route
              path="/projects/:projectId/weld-logs/:weldLogId"
              element={
                <Breadcrumbs
                  breadcrumbData={{
                    projectName: 'Steel Bridge Project',
                    weldLogName: 'WL-2024-001',
                  }}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Steel Bridge Project')).toBeInTheDocument();
    expect(screen.getByText('Weld Logs')).toBeInTheDocument();
    expect(screen.getByText('WL-2024-001')).toBeInTheDocument();
  });

  it('should fall back to IDs when breadcrumbData is not provided', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/projects/abc123/project-overview']}>
          <Routes>
            <Route path="/projects/:projectId/*" element={<Breadcrumbs />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
  });
});