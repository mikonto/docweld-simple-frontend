import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import { MaterialFormDialog } from './MaterialFormDialog';

// Mock react-i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: vi.fn().mockReturnValue({
      t: (key) => {
        const translations = {
          'common.cancel': 'Cancel',
          'common.saveChanges': 'Save Changes',
          'common.addButton': 'Add',
          'materials.addMaterial': 'Add Material',
          'materials.updateMaterial': 'Update Material',
          'materials.editMaterial': 'Edit Material',
          'materials.parentMaterial': 'Parent Material',
          'materials.fillerMaterial': 'Filler Material',
          'materials.alloyMaterial': 'Alloy Material',
          'materials.addParentMaterial': 'Add Parent Material',
          'materials.addFillerMaterial': 'Add Filler Material',
          'materials.addAlloyMaterial': 'Add Alloy Material',
          'materials.editParentMaterial': 'Edit Parent Material',
          'materials.editFillerMaterial': 'Edit Filler Material',
          'materials.editAlloyMaterial': 'Edit Alloy Material',
          'materials.type': 'Type',
          'materials.dimensions': 'Dimensions',
          'materials.thickness': 'Thickness',
          'materials.name': 'Name',
          'materials.materialName': 'Material Name',
          'materials.updateMaterialDescription':
            'Update the material details below.',
          'materials.createMaterialDescription':
            'Fill in the material details below.',
          'materials.createSuccess': 'Material added successfully',
          'materials.updateSuccess': 'Material updated successfully',
          'materials.createError': 'Failed to create material',
          'materials.updateError': 'Failed to update material',
          'materials.enterType': 'Enter type',
          'materials.enterDimensions': 'Enter dimensions',
          'materials.enterThickness': 'Enter thickness',
          'materials.selectAlloyMaterial': 'Select or enter alloy material',
          'materials.noAlloyMaterials': 'No alloy materials found',
          'materials.searchAlloyMaterials': 'Search alloy materials...',
          'materials.enterMaterialName': 'Enter material name',
          'materials.enterFillerMaterialName': 'Enter filler material name',
          'materials.enterAlloyMaterialName': 'Enter alloy material name',
        };
        return translations[key] || key;
      },
    }),
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the useMaterials hook
vi.mock('@/hooks/useMaterials', () => ({
  useAlloyMaterials: vi.fn().mockReturnValue([
    [
      { id: '1', name: 'Alloy 1' },
      { id: '2', name: 'Alloy 2' },
    ],
    false,
    null,
  ]),
}));

describe('MaterialFormDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
    materialType: 'parent',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test different material types using data-driven approach
  const materialTypeTestCases = [
    {
      type: 'parent',
      expectedTitle: 'Add Parent Material',
      editTitle: 'Edit Parent Material',
      expectedFields: ['Type', 'Dimensions', 'Thickness', 'Alloy Material'],
    },
    {
      type: 'filler',
      expectedTitle: 'Add Filler Material',
      editTitle: 'Edit Filler Material',
      expectedFields: ['Filler Material Name'],
    },
    {
      type: 'alloy',
      expectedTitle: 'Add Alloy Material',
      editTitle: 'Edit Alloy Material',
      expectedFields: ['Alloy Material Name'],
    },
  ];

  materialTypeTestCases.forEach(
    ({ type, expectedTitle, editTitle, expectedFields }) => {
      it(`should render ${type} material form correctly`, () => {
        // Test new material
        renderWithProviders(
          <MaterialFormDialog {...defaultProps} materialType={type} />
        );
        expect(screen.getByText(expectedTitle)).toBeInTheDocument();

        expectedFields.forEach((field) => {
          expect(screen.getByText(field)).toBeInTheDocument();
        });

        // Test edit material for parent type (most comprehensive)
        if (type === 'parent') {
          const material = {
            id: '123',
            type: 'Steel',
            dimensions: '100x50',
            thickness: '10mm',
            alloyMaterial: 'Alloy 1',
          };

          const { rerender } = renderWithProviders(
            <MaterialFormDialog {...defaultProps} materialType={type} />
          );
          rerender(
            <MaterialFormDialog
              {...defaultProps}
              materialType={type}
              material={material}
            />
          );

          expect(screen.getByText(editTitle)).toBeInTheDocument();
          expect(screen.getByText('Save Changes')).toBeInTheDocument();
        }
      });
    }
  );

  it('should handle dialog interactions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MaterialFormDialog {...defaultProps} />);

    // Test cancel functionality
    await user.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
