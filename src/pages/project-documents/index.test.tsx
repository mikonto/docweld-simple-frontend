import { screen, waitFor } from '@testing-library/react';
import { vi, type MockedFunction } from 'vitest';
import ProjectDocuments from './index';
import { renderWithProviders } from '@/test/utils/testUtils';
import { useProject } from '@/hooks/useProjects';
import type { Project } from '@/types';
import type { FirestoreError } from 'firebase/firestore';

// Mock hooks
vi.mock('@/hooks/useProjects');

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ projectId: 'test-project-id' })),
  };
});

// Mock SectionsContainer
vi.mock('@/components/documents/sections/multi/SectionsContainer', () => ({
  SectionsContainer: ({
    collectionType,
    entityId,
    showImportMenu,
    importSource,
  }: {
    collectionType: string;
    entityId: string;
    showImportMenu?: boolean;
    importSource?: {
      collectionType: string;
      entityId: string;
    };
  }) => (
    <div data-testid="document-section-list">
      <div>Collection Type: {collectionType}</div>
      <div>Entity ID: {entityId}</div>
      <div>Show Import Menu: {showImportMenu ? 'true' : 'false'}</div>
      <div>Import Source Type: {importSource?.collectionType}</div>
      <div>Import Source Entity: {importSource?.entityId}</div>
    </div>
  ),
}));

describe('ProjectDocuments', () => {
  const mockProject = {
    id: 'test-project-id',
    projectName: 'Test Project',
    projectNumber: 'TEST-001',
    customer: 'Test Customer',
  } as Project;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test different loading states using data-driven approach
  const stateTestCases = [
    {
      name: 'loading state',
      mockReturn: [null, true, undefined] as [
        Project | null,
        boolean,
        FirestoreError | undefined,
      ],
      expectations: {
        spinner: true,
        header: false,
        errorText: null,
      },
    },
    {
      name: 'error state',
      mockReturn: [
        null,
        false,
        {
          code: 'unknown',
          message: 'Failed to load project',
        } as FirestoreError,
      ] as [Project | null, boolean, FirestoreError | undefined],
      expectations: {
        spinner: false,
        header: false,
        errorText: 'Error: Failed to load project',
      },
    },
    {
      name: 'null project state',
      mockReturn: [null, false, undefined] as [
        Project | null,
        boolean,
        FirestoreError | undefined,
      ],
      expectations: {
        spinner: false,
        header: false,
        errorText: null,
      },
    },
    {
      name: 'loaded state',
      mockReturn: [mockProject, false, undefined] as [
        Project | null,
        boolean,
        FirestoreError | undefined,
      ],
      expectations: {
        spinner: false,
        header: true,
        errorText: null,
      },
    },
  ];

  stateTestCases.forEach(({ name, mockReturn, expectations }) => {
    it(`should handle ${name} correctly`, async () => {
      (useProject as MockedFunction<typeof useProject>).mockReturnValue(
        mockReturn
      );
      renderWithProviders(<ProjectDocuments />);

      if (expectations.spinner) {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
        expect(spinner).toHaveClass('lucide-loader-circle');
      }

      if (expectations.header) {
        await waitFor(() => {
          expect(
            screen.getByRole('heading', { name: 'Project Documents' })
          ).toBeInTheDocument();
        });
      } else {
        expect(
          screen.queryByRole('heading', { name: 'Project Documents' })
        ).not.toBeInTheDocument();
      }

      if (expectations.errorText) {
        expect(screen.getByText(expectations.errorText)).toBeInTheDocument();
      }
    });
  });

  it('should render SectionsContainer with correct configuration', async () => {
    (useProject as MockedFunction<typeof useProject>).mockReturnValue([
      mockProject,
      false,
      undefined,
    ]);
    renderWithProviders(<ProjectDocuments />);

    await waitFor(() => {
      const container = screen.getByTestId('document-section-list');
      expect(container).toBeInTheDocument();

      // Verify correct props are passed to child component
      expect(screen.getByText('Collection Type: project')).toBeInTheDocument();
      expect(
        screen.getByText('Entity ID: test-project-id')
      ).toBeInTheDocument();
      expect(screen.getByText('Show Import Menu: true')).toBeInTheDocument();
      expect(
        screen.getByText('Import Source Type: library')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Import Source Entity: main')
      ).toBeInTheDocument();
    });
  });
});
