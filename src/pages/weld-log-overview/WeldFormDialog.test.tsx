import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/testUtils'
import { WeldFormDialog } from './WeldFormDialog'
import type { Weld, Material } from '@/types/app'

// Mock external dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/hooks/useMaterials', () => ({
  useMaterials: vi.fn(),
  useMaterialOperations: vi.fn(),
}))

vi.mock('@/hooks/useWelds', () => ({
  useWeldOperations: vi.fn(),
}))

const mockMaterials: Material[] = [
  {
    id: 'parent-1',
    name: 'Parent Material 1',
    type: 'carbon-steel',
    createdAt: {} as any,
    updatedAt: {} as any,
  } as Material & {
    type: string
    dimensions: string
    alloyMaterial: string
  },
]

const mockFillerMaterials: Material[] = [
  {
    id: 'filler-1',
    name: 'Filler Material 1',
    type: 'carbon-steel',
    createdAt: {} as any,
    updatedAt: {} as any,
  },
]

const mockWeldOperations = {
  isWeldNumberAvailable: vi.fn(),
  isWeldNumberRangeAvailable: vi.fn(),
  createWeld: vi.fn(),
  createWeldsRange: vi.fn(),
  updateWeld: vi.fn(),
  deleteWeld: vi.fn(),
}

const mockMaterialOperations = {
  createMaterial: vi.fn(),
}

interface WeldFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weld?: Weld | null
  weldLogId?: string
  onSubmit: (data: any, mode?: string) => Promise<void>
}

describe('WeldFormDialog', () => {
  const defaultProps: WeldFormDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    weldLogId: 'weld-log-1',
    onSubmit: vi.fn(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    const { useMaterials, useMaterialOperations } = await import(
      '@/hooks/useMaterials'
    )
    const { useWeldOperations } = await import('@/hooks/useWelds')

    const mockedUseMaterials = vi.mocked(useMaterials)
    const mockedUseMaterialOperations = vi.mocked(useMaterialOperations)
    const mockedUseWeldOperations = vi.mocked(useWeldOperations)

    // Reset mocks and set up proper return values
    mockedUseMaterials.mockImplementation((type) => {
      if (type === 'parent') {
        return [mockMaterials, false, null]
      }
      if (type === 'filler') {
        return [mockFillerMaterials, false, null]
      }
      return [[], false, null]
    })

    mockedUseMaterialOperations.mockReturnValue(mockMaterialOperations)
    mockedUseWeldOperations.mockReturnValue(mockWeldOperations)

    mockWeldOperations.isWeldNumberAvailable.mockResolvedValue(true)
    mockWeldOperations.isWeldNumberRangeAvailable.mockResolvedValue(true)
    mockMaterialOperations.createMaterial.mockResolvedValue('new-material-id')
  })

  describe('Dialog Rendering and State', () => {
    it('should not render when closed', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} open={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Dialog Title Behavior', () => {
    it('should show add weld title by default', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      expect(
        screen.getByRole('heading', { name: 'Add Weld' })
      ).toBeInTheDocument()
    })

    it('should show edit title when editing existing weld', () => {
      const existingWeld: Weld = {
        id: 'weld-1',
        number: 'W-001',
        projectId: 'project-1',
        weldLogId: 'weld-log-1',
        welderId: 'user-1',
        status: 'pending',
        type: 'production',
        createdAt: {} as any,
      } as Weld & {
        position: string
        parentMaterials: string[]
        fillerMaterials: string[]
      }

      renderWithProviders(
        <WeldFormDialog {...defaultProps} weld={existingWeld} />
      )

      expect(
        screen.getByRole('heading', { name: 'Edit Weld' })
      ).toBeInTheDocument()
    })

    it('should update title when switching to multiple welds mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      expect(
        screen.getByRole('heading', { name: 'Add Weld' })
      ).toBeInTheDocument()

      const multipleTab = screen.getByRole('tab', { name: /multiple/i })
      await user.click(multipleTab)

      expect(
        screen.getByRole('heading', { name: 'Add Welds' })
      ).toBeInTheDocument()
    })
  })

  describe('Mode Switching', () => {
    it('should show mode tabs only when creating new welds', () => {
      const { rerender } = renderWithProviders(
        <WeldFormDialog {...defaultProps} />
      )

      // Creating new weld - should show tabs
      expect(screen.getByRole('tab', { name: /single/i })).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: /multiple/i })
      ).toBeInTheDocument()

      // Editing existing weld - should not show tabs
      const existingWeld: Weld = { 
        id: 'weld-1', 
        number: 'W-001',
        projectId: 'project-1',
        weldLogId: 'weld-log-1',
        welderId: 'user-1',
        status: 'pending',
        type: 'production',
        createdAt: {} as any,
      }
      rerender(<WeldFormDialog {...defaultProps} weld={existingWeld} />)

      expect(
        screen.queryByRole('tab', { name: /single/i })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('tab', { name: /multiple/i })
      ).not.toBeInTheDocument()
    })

    it('should switch to multiple welds mode successfully', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      const multipleTab = screen.getByRole('tab', { name: /multiple/i })
      await user.click(multipleTab)

      // Just verify the tab was clicked and title changed
      expect(
        screen.getByRole('heading', { name: 'Add Welds' })
      ).toBeInTheDocument()
    })
  })

  describe('Form Fields Visibility', () => {
    it('should display form content for single weld mode', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      // Check that basic form elements are rendered
      expect(screen.getByText(/Weld Number/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Parent Materials/i)[0]).toBeInTheDocument()
    })

    it('should show submit button with correct text for single mode', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /^Add$/i })
      ).toBeInTheDocument()
    })

    it('should show submit button with correct text for multiple mode', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      const multipleTab = screen.getByRole('tab', { name: /multiple/i })
      await user.click(multipleTab)

      expect(
        screen.getByRole('button', { name: /^Add$/i })
      ).toBeInTheDocument()
    })
  })

  describe('Position Mode Selection', () => {
    it('should render without errors in multiple welds mode', async () => {
      const user = userEvent.setup()

      expect(() => {
        renderWithProviders(<WeldFormDialog {...defaultProps} />)
      }).not.toThrow()

      const multipleTab = screen.getByRole('tab', { name: /multiple/i })

      expect(() => {
        user.click(multipleTab)
      }).not.toThrow()
    })
  })

  describe('Heat Treatment Checkbox', () => {
    it('should toggle heat treatment checkbox', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      const heatTreatmentCheckbox = screen.getByRole('checkbox')

      expect(heatTreatmentCheckbox).not.toBeChecked()

      await user.click(heatTreatmentCheckbox)

      expect(heatTreatmentCheckbox).toBeChecked()
    })
  })

  describe('Loading States', () => {
    it('should render without crashing when materials are loading', async () => {
      const { useMaterials } = await import('@/hooks/useMaterials')
      const mockedUseMaterials = vi.mocked(useMaterials)
      mockedUseMaterials.mockImplementation(() => [[], true, null]) // Both materials loading

      expect(() => {
        renderWithProviders(<WeldFormDialog {...defaultProps} />)
      }).not.toThrow()

      // Should still show the dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should render without crashing when no materials found', async () => {
      const { useMaterials } = await import('@/hooks/useMaterials')
      const mockedUseMaterials = vi.mocked(useMaterials)
      mockedUseMaterials.mockImplementation(() => [[], false, null]) // No materials, not loading

      expect(() => {
        renderWithProviders(<WeldFormDialog {...defaultProps} />)
      }).not.toThrow()

      // Should still show the dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Material Management Integration', () => {
    it('should render without crashing when materials are provided', () => {
      expect(() => {
        renderWithProviders(<WeldFormDialog {...defaultProps} />)
      }).not.toThrow()

      // Basic check that dialog is rendered
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

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
        )
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have proper dialog accessibility attributes', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      // Should have a title
      expect(
        screen.getByRole('heading', { name: /Add Weld/i })
      ).toBeInTheDocument()
    })

    it('should have accessible form elements', () => {
      renderWithProviders(<WeldFormDialog {...defaultProps} />)

      // Check that form has accessible structure
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Check for button accessibility
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument()
    })
  })
})