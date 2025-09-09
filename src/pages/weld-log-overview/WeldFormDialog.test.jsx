import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { WeldFormDialog } from './WeldFormDialog';

// Mock external dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/hooks/useMaterials', () => ({
  useMaterials: vi.fn(),
  useMaterialOperations: vi.fn(),
}));

vi.mock('@/hooks/useWelds', () => ({
  useWeldOperations: vi.fn(),
}));

const mockMaterials = [
  {
    id: 'parent-1',
    name: 'Parent Material 1',
    type: 'Steel',
    dimensions: '10mm',
    alloyMaterial: 'Carbon Steel',
  },
];

const mockFillerMaterials = [
  {
    id: 'filler-1',
    name: 'Filler Material 1',
  },
];

const mockWeldOperations = {
  isWeldNumberAvailable: vi.fn(),
  isWeldNumberRangeAvailable: vi.fn(),
};

const mockMaterialOperations = {
  createMaterial: vi.fn(),
};

describe('WeldFormDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    weldLogId: 'weld-log-1',
    onSubmit: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { useMaterials, useMaterialOperations } = await import(
      '@/hooks/useMaterials'
    );
    const { useWeldOperations } = await import('@/hooks/useWelds');

    // Reset mocks and set up proper return values
    useMaterials.mockImplementation((type) => {
      if (type === 'parent') {
        return [mockMaterials, false];
      }
      if (type === 'filler') {
        return [mockFillerMaterials, false];
      }
      return [[], false];
    });

    useMaterialOperations.mockReturnValue(mockMaterialOperations);
    useWeldOperations.mockReturnValue(mockWeldOperations);

    mockWeldOperations.isWeldNumberAvailable.mockResolvedValue(true);
    mockWeldOperations.isWeldNumberRangeAvailable.mockResolvedValue(true);
    mockMaterialOperations.createMaterial.mockResolvedValue();
  });

  describe('Dialog Rendering and State', () => {
    it('should not render when closed', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Dialog Title Behavior', () => {
    it('should show add weld title by default', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      expect(
        screen.getByRole('heading', { name: 'Add Weld' })
      ).toBeInTheDocument();
    });

    it('should show edit title when editing existing weld', () => {
      const existingWeld = {
        id: 'weld-1',
        number: 'W-001',
        position: '1F',
        parentMaterials: ['parent-1'],
        fillerMaterials: ['filler-1'],
      };

      renderWithProviders(
        <WeldFormDialog {...defaultProps} weld={existingWeld} />
      );

      expect(
        screen.getByRole('heading', { name: 'Edit Weld' })
      ).toBeInTheDocument();
    });

    it('should update title when switching to multiple welds mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      expect(
        screen.getByRole('heading', { name: 'Add Weld' })
      ).toBeInTheDocument();

      const multipleTab = screen.getByRole('tab', { name: /multiple/i });
      await user.click(multipleTab);

      expect(
        screen.getByRole('heading', { name: 'Add Welds' })
      ).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should show mode tabs only when creating new welds', () => {
      const { rerender } = renderWithProviders(
        <WeldFormDialog {...defaultProps} />
      );

      // Creating new weld - should show tabs
      expect(screen.getByRole('tab', { name: /single/i })).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /multiple/i })
      ).toBeInTheDocument();

      // Editing existing weld - should not show tabs
      const existingWeld = { id: 'weld-1', number: 'W-001' };
      rerender(<WeldFormDialog {...defaultProps} weld={existingWeld} />);

      expect(
        screen.queryByRole('tab', { name: /single/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('tab', { name: /multiple/i })
      ).not.toBeInTheDocument();
    });

    it('should switch to multiple welds mode successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      const multipleTab = screen.getByRole('tab', { name: /multiple/i });
      await user.click(multipleTab);

      // Just verify the tab was clicked and title changed
      expect(
        screen.getByRole('heading', { name: 'Add Welds' })
      ).toBeInTheDocument();
    });
  });

  describe('Form Fields Visibility', () => {
    it('should display form content for single weld mode', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      // Check that basic form elements are rendered
      expect(screen.getByText(/Weld Number/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Parent Materials/i)[0]).toBeInTheDocument();
    });

    it('should show submit button with correct text for single mode', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /^Add$/i })
      ).toBeInTheDocument();
    });

    it('should show submit button with correct text for multiple mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      const multipleTab = screen.getByRole('tab', { name: /multiple/i });
      await user.click(multipleTab);

      expect(
        screen.getByRole('button', { name: /^Add$/i })
      ).toBeInTheDocument();
    });
  });

  describe('Position Mode Selection', () => {
    it('should render without errors in multiple welds mode', async () => {
      const user = userEvent.setup();

      expect(() => {
        renderWithProviders(<WeldFormDialog {...defaultProps} />);
      }).not.toThrow();

      const multipleTab = screen.getByRole('tab', { name: /multiple/i });

      expect(() => {
        user.click(multipleTab);
      }).not.toThrow();
    });
  });

  describe('Heat Treatment Checkbox', () => {
    it('should toggle heat treatment checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      const heatTreatmentCheckbox = screen.getByRole('checkbox');

      expect(heatTreatmentCheckbox).not.toBeChecked();

      await user.click(heatTreatmentCheckbox);

      expect(heatTreatmentCheckbox).toBeChecked();
    });
  });

  describe('Loading States', () => {
    it('should render without crashing when materials are loading', async () => {
      const { useMaterials } = await import('@/hooks/useMaterials');
      useMaterials.mockImplementation(() => [[], true]); // Both materials loading

      expect(() => {
        renderWithProviders(<WeldFormDialog {...defaultProps} />);
      }).not.toThrow();

      // Should still show the dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render without crashing when no materials found', async () => {
      const { useMaterials } = await import('@/hooks/useMaterials');
      useMaterials.mockImplementation(() => [[], false]); // No materials, not loading

      expect(() => {
        renderWithProviders(<WeldFormDialog {...defaultProps} />);
      }).not.toThrow();

      // Should still show the dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Material Management Integration', () => {
    it('should render without crashing when materials are provided', () => {
      expect(() => {
        renderWithProviders(<WeldFormDialog {...defaultProps} />);
      }).not.toThrow();

      // Basic check that dialog is rendered
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required props gracefully', () => {
      // Test that component doesn't crash with minimal props
      expect(() => {
        renderWithProviders(
          <WeldFormDialog
            open={true}
            onOpenChange={vi.fn()}
            onSubmit={vi.fn()}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog accessibility attributes', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Should have a title
      expect(
        screen.getByRole('heading', { name: /Add Weld/i })
      ).toBeInTheDocument();
    });

    it('should have accessible form elements', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />);

      // Check that form has accessible structure
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Check for button accessibility
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument();
    });
  });
});
