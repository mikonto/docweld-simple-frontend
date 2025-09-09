import { render, screen, waitFor, act } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import { Welds } from './Welds';
import { vi } from 'vitest';

// Mock react-i18next because the welds.* translation keys are missing from the translation files
// TODO: Add proper translations for welds.* namespace to src/i18n/locales/*/translation.json
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => {
        const translations = {
          'weldLogs.welds': 'Welds',
          'weldLogs.weldNumber': 'Weld Number',
          'weldLogs.position': 'Position',
          'weldLogs.parentMaterials': 'Parent Materials',
          'weldLogs.fillerMaterials': 'Filler Materials',
          'weldLogs.heatTreatment': 'Heat Treatment',
          'weldLogs.addWeld': 'Add Weld',
          'common.edit': 'Edit',
          'common.delete': 'Delete',
          'common.deleteSelected': 'Delete Selected',
          'common.yes': 'Yes',
          'common.no': 'No',
          'common.loading': 'Loading...',
          'common.search': 'Search',
          'table.noResults': 'No results found',
        };
        return translations[key] || key;
      },
    }),
  };
});

// Mock the useMaterials hook
vi.mock('@/hooks/useMaterials', () => ({
  useMaterials: vi.fn((type) => {
    if (type === 'parent') {
      return [
        [
          {
            id: '1',
            type: 'Pipe',
            dimensions: 'DN100',
            alloyMaterial: 'Carbon Steel',
          },
          {
            id: '2',
            type: 'Plate',
            dimensions: '10mm',
            alloyMaterial: 'Stainless Steel',
          },
        ],
        false, // loading state
      ];
    } else if (type === 'filler') {
      return [
        [
          { id: '3', name: 'E7018' },
          { id: '4', name: 'ER70S-6' },
        ],
        false, // loading state
      ];
    }
    return [[], false];
  }),
}));

describe('Welds', () => {
  const mockWelds = [
    {
      id: '1',
      number: 'W001',
      position: '1G',
      parentMaterials: ['1', '2'],
      fillerMaterials: ['3'],
      heatTreatment: true,
    },
    {
      id: '2',
      number: 'W002',
      position: '2G',
      parentMaterials: ['2'],
      fillerMaterials: ['3', '4'],
      heatTreatment: false,
    },
  ];

  const defaultProps = {
    welds: mockWelds,
    loading: false,
    onEdit: vi.fn(),
    onCreateNew: vi.fn(),
    onConfirmAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display table with translated headers and action button', () => {
    render(<Welds {...defaultProps} />);

    // Table structure
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Column headers
    expect(screen.getByText('Weld Number')).toBeInTheDocument();
    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Parent Materials')).toBeInTheDocument();
    expect(screen.getByText('Filler Materials')).toBeInTheDocument();
    expect(screen.getByText('Heat Treatment')).toBeInTheDocument();

    // Action button
    expect(screen.getByText('Add Weld')).toBeInTheDocument();
  });

  // Test different data states using data-driven approach
  const dataStateTestCases = [
    {
      name: 'loading state',
      props: { ...defaultProps, loading: true },
      expectedText: 'Loading...',
    },
    {
      name: 'empty data state',
      props: { ...defaultProps, welds: [] },
      expectedText: 'No results found.',
    },
  ];

  dataStateTestCases.forEach(({ name, props, expectedText }) => {
    it(`should display ${name}`, () => {
      render(<Welds {...props} />);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  it('should display formatted material data and heat treatment values', () => {
    render(<Welds {...defaultProps} />);

    // Formatted materials - check that formatting is working
    const pipeElements = screen.getAllByText(/Pipe - DN100 - Carbon Steel/);
    const plateElements = screen.getAllByText(/Plate - 10mm - Stainless Steel/);
    const e7018Elements = screen.getAllByText(/E7018/);
    const er70s6Elements = screen.getAllByText(/ER70S-6/);

    expect(pipeElements.length).toBeGreaterThan(0);
    expect(plateElements.length).toBeGreaterThan(0);
    expect(e7018Elements.length).toBeGreaterThan(0);
    expect(er70s6Elements.length).toBeGreaterThan(0);

    // Heat treatment translations
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No').length).toBeGreaterThan(0);
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<Welds {...defaultProps} />);

    // Test create action
    screen.getByText('Add Weld').click();
    expect(defaultProps.onCreateNew).toHaveBeenCalledTimes(1);

    // Test row actions menu
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const actionButtons = screen.getAllByText('Open menu');
    await user.click(actionButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    // Test bulk actions
    const selectAllCheckbox = screen.getByLabelText(/select all/i);
    act(() => {
      selectAllCheckbox.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Delete Selected')).toBeInTheDocument();
    });
  });
});
