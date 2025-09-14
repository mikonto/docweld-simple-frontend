import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ProjectsTable } from './ProjectsTable';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import type { ProjectsTableProps } from './ProjectsTable';
import type { Project } from '@/types';
import type { Timestamp } from 'firebase/firestore';

describe('ProjectsTable', () => {
  const mockProjects: Project[] = [
    {
      id: '1',
      projectName: 'Test Project 1',
      projectNumber: 'P001',
      customer: 'Customer A',
      description: 'Test description 1',
      location: '',
      startDate: undefined,
      endDate: undefined,
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
    },
    {
      id: '2',
      projectName: 'Test Project 2',
      projectNumber: 'P002',
      customer: 'Customer B',
      description: 'Test description 2',
      location: '',
      startDate: undefined,
      endDate: undefined,
      status: 'active',
      createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
      updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
    },
  ];

  const defaultProps: ProjectsTableProps = {
    projects: mockProjects,
    loading: false,
    activeTab: 'active',
    onTabChange: vi.fn(),
    onEdit: vi.fn(),
    onCreateNew: vi.fn(),
    onConfirmAction: vi.fn(),
    onRowClick: vi.fn(),
  };

  const renderWithI18n = (component: React.ReactElement) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display table structure with translations', () => {
    renderWithI18n(<ProjectsTable {...defaultProps} />);

    // Column headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Project Number')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();

    // Tabs
    expect(screen.getByRole('tab', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Archived' })).toBeInTheDocument();

    // Action button
    expect(
      screen.getByRole('button', { name: /Add Project/i })
    ).toBeInTheDocument();
  });

  // Test different data states using data-driven approach
  const dataStateTestCases = [
    {
      name: 'loading state',
      props: { ...defaultProps, loading: true },
      expectedText: 'Loading...',
    },
    {
      name: 'empty state',
      props: { ...defaultProps, projects: [] },
      expectedText: 'No results found.',
    },
  ];

  dataStateTestCases.forEach(({ name, props, expectedText }) => {
    it(`should display ${name}`, () => {
      renderWithI18n(<ProjectsTable {...props} />);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  // Test different tab contexts using data-driven approach
  const tabContextTestCases = [
    {
      tab: 'active' as const,
      expectedBulkActions: ['Archive Selected', 'Delete Selected'],
    },
    {
      tab: 'archived' as const,
      expectedBulkActions: ['Restore Selected', 'Delete Selected'],
    },
  ];

  tabContextTestCases.forEach(({ tab, expectedBulkActions }) => {
    it(`should show correct bulk actions for ${tab} tab`, async () => {
      const user = userEvent.setup();
      renderWithI18n(<ProjectsTable {...defaultProps} activeTab={tab} />);

      // Select a row to trigger bulk actions
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First is select all, second is first row

      expectedBulkActions.forEach((action) => {
        expect(
          screen.getByRole('button', { name: new RegExp(action, 'i') })
        ).toBeInTheDocument();
      });
    });
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ProjectsTable {...defaultProps} />);

    // Test row click
    await user.click(screen.getByText('Test Project 1'));
    expect(defaultProps.onRowClick).toHaveBeenCalledWith(mockProjects[0]);

    // Test tab change
    await user.click(screen.getByRole('tab', { name: 'Archived' }));
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('archived');

    // Test create new action
    await user.click(screen.getByRole('button', { name: /Add Project/i }));
    expect(defaultProps.onCreateNew).toHaveBeenCalled();
  });
});
