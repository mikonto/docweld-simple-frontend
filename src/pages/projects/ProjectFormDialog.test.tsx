import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { ProjectFormDialog } from './ProjectFormDialog';
import type { ProjectFormDialogProps } from './ProjectFormDialog';
import type { Project } from '@/types';
import type { Timestamp } from 'firebase/firestore';

// Mock sonner toast (no longer used in this component)

// Helper function to render with i18n
const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('ProjectFormDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps: ProjectFormDialogProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  };

  const mockProject: Project = {
    id: '123',
    projectName: 'Test Project',
    projectNumber: 'PROJ-001',
    customer: 'Test Customer',
    externalReference: 'EXT-001',
    description: 'Test description',
    parentMaterialTraceable: true,
    fillerMaterialTraceable: false,
    location: '',
    startDate: undefined,
    endDate: undefined,
    status: 'active',
    createdAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
    updatedAt: { seconds: 1640000000, nanoseconds: 0 } as Timestamp,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test form modes using data-driven approach
  const formModeTestCases = [
    {
      mode: 'create',
      props: defaultProps,
      expectedTitle: 'Add Project',
      expectedButton: 'Add',
    },
    {
      mode: 'edit',
      props: { ...defaultProps, project: mockProject },
      expectedTitle: 'Edit Project',
      expectedButton: 'Save Changes',
    },
  ];

  formModeTestCases.forEach(
    ({ mode, props, expectedTitle, expectedButton }) => {
      it(`should render ${mode} form correctly with translations`, () => {
        renderWithI18n(<ProjectFormDialog {...props} />);

        expect(
          screen.getByRole('heading', { name: expectedTitle })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: expectedButton })
        ).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    }
  );

  it('should display all form fields with proper labels and placeholders', () => {
    renderWithI18n(<ProjectFormDialog {...defaultProps} />);

    // Form labels
    const expectedLabels = [
      'Name',
      'Project Number',
      'Customer',
      'External Reference',
      'Description',
      'Parent Material Traceable',
      'Filler Material Traceable',
    ];
    expectedLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    // Form placeholders
    const expectedPlaceholders = [
      'Enter project name',
      'Enter project number',
      'Enter customer name',
      'Enter external reference',
      'Enter description',
    ];
    expectedPlaceholders.forEach((placeholder) => {
      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    });
  });

  it('should handle dialog interactions', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ProjectFormDialog {...defaultProps} />);

    await user.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
