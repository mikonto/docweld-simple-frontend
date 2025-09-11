import * as React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Mock } from 'vitest'
import { WeldDetailsCard } from './WeldDetailsCard'
import type { Weld, User, Material } from '@/types'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: 'en',
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock the useMaterials hook
vi.mock('@/hooks/useMaterials', () => ({
  useMaterials: vi.fn(),
}))

// Import after mocking
import { useMaterials } from '@/hooks/useMaterials'

describe('WeldDetailsCard', () => {
  const mockWeld: Weld = {
    id: 'weld-123',
    number: 'W-001',
    position: '1G',
    parentMaterials: ['mat-1', 'mat-2'],
    fillerMaterials: ['mat-3'],
    description: 'Test weld description',
    heatTreatment: 'PWHT',
    weldLogId: 'weld-log-123',
    projectId: 'project-123',
    createdAt: new Date('2024-01-01T10:00:00'),
    createdBy: 'user-123',
    archivedAt: null,
    archivedBy: null,
  }

  const mockCreator: User = {
    id: 'user-123',
    displayName: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: {} as any, // Mock Timestamp
    updatedAt: {} as any, // Mock Timestamp
    isActive: true,
  }

  const mockParentMaterials: Material[] = [
    { 
      id: 'mat-1', 
      name: 'Carbon Steel', 
      specification: 'A36',
      type: 'parent',
      createdAt: new Date('2024-01-01'),
      createdBy: 'user-123',
      archivedAt: null,
      archivedBy: null,
    },
    { 
      id: 'mat-2', 
      name: 'Stainless Steel', 
      specification: '316L',
      type: 'parent',
      createdAt: new Date('2024-01-01'),
      createdBy: 'user-123',
      archivedAt: null,
      archivedBy: null,
    },
  ]

  const mockFillerMaterials: Material[] = [
    { 
      id: 'mat-3', 
      name: 'ER70S-6', 
      specification: 'AWS A5.18',
      type: 'filler',
      createdAt: new Date('2024-01-01'),
      createdBy: 'user-123',
      archivedAt: null,
      archivedBy: null,
    },
  ]

  const mockOnEdit = vi.fn()

  const defaultProps = {
    weld: mockWeld,
    creator: mockCreator,
    onEdit: mockOnEdit,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock materials hook to return materials
    ;(useMaterials as Mock).mockImplementation((type: string) => {
      if (type === 'parent') {
        return [mockParentMaterials, false]
      }
      if (type === 'filler') {
        return [mockFillerMaterials, false]
      }
      return [[], false]
    })
  })

  it('renders weld details correctly', () => {
    render(<WeldDetailsCard {...defaultProps} />)

    // Check title
    expect(screen.getByText('welds.weldDetails')).toBeInTheDocument()

    // Check weld number
    expect(screen.getByText('W-001')).toBeInTheDocument()

    // Check position
    expect(screen.getByText('1G')).toBeInTheDocument()

    // Check description
    expect(screen.getByText('Test weld description')).toBeInTheDocument()

    // Check heat treatment
    expect(screen.getByText('PWHT')).toBeInTheDocument()

    // Check creator name
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('displays parent materials correctly', () => {
    render(<WeldDetailsCard {...defaultProps} />)

    // Parent materials should be displayed with their names combined
    expect(
      screen.getByText('Carbon Steel (A36), Stainless Steel (316L)')
    ).toBeInTheDocument()
  })

  it('displays filler materials correctly', () => {
    render(<WeldDetailsCard {...defaultProps} />)

    // Filler material should be displayed with its name
    expect(screen.getByText('ER70S-6 (AWS A5.18)')).toBeInTheDocument()
  })

  it('shows edit menu when clicking more button', async () => {
    const user = userEvent.setup()
    render(<WeldDetailsCard {...defaultProps} />)

    // Find and click the more button (it has no accessible name, so find by data attribute or class)
    const moreButton = screen.getByRole('button')
    await user.click(moreButton)

    // Check that edit option appears
    expect(screen.getByText('welds.editWeld')).toBeInTheDocument()
  })

  it('calls onEdit when edit menu item is clicked', async () => {
    const user = userEvent.setup()
    render(<WeldDetailsCard {...defaultProps} />)

    // Open menu
    const moreButton = screen.getByRole('button')
    await user.click(moreButton)

    // Click edit
    const editButton = screen.getByText('welds.editWeld')
    await user.click(editButton)

    // Check that onEdit was called with the weld
    expect(mockOnEdit).toHaveBeenCalledWith(mockWeld)
  })

  it('handles missing optional fields gracefully', () => {
    const weldWithoutOptionalFields: Weld = {
      ...mockWeld,
      description: '',
      heatTreatment: '',
    }

    render(
      <WeldDetailsCard {...defaultProps} weld={weldWithoutOptionalFields} />
    )

    // Check that the component renders without crashing
    // and that the translation keys for the labels are shown
    expect(screen.getByText('common.description')).toBeInTheDocument()
    expect(screen.getByText('welds.heatTreatment')).toBeInTheDocument()

    // Check that multiple em dashes are shown for missing fields
    const emDashes = screen.getAllByText('—')
    expect(emDashes.length).toBeGreaterThan(1) // At least 2 for description and heat treatment
  })

  it('handles materials that are not found in materials list', () => {
    // Mock materials hook to return empty arrays
    ;(useMaterials as Mock).mockImplementation(() => [[], false])

    render(<WeldDetailsCard {...defaultProps} />)

    // Should display material IDs when materials are not found, combined with comma
    expect(screen.getByText('mat-1, mat-2')).toBeInTheDocument()
    expect(screen.getByText('mat-3')).toBeInTheDocument()
  })

  it('handles empty materials arrays', () => {
    const weldWithoutMaterials: Weld = {
      ...mockWeld,
      parentMaterials: [],
      fillerMaterials: [],
    }

    render(<WeldDetailsCard {...defaultProps} weld={weldWithoutMaterials} />)

    // Check that material labels are shown
    expect(screen.getByText('materials.parentMaterials')).toBeInTheDocument()
    expect(screen.getByText('materials.fillerMaterials')).toBeInTheDocument()

    // Check that em dashes are shown for empty arrays
    const emDashes = screen.getAllByText('—')
    expect(emDashes.length).toBeGreaterThanOrEqual(2) // At least 2 for parent and filler materials
  })

  it('handles missing creator gracefully', () => {
    render(<WeldDetailsCard {...defaultProps} creator={null} />)

    // Should show em dash for missing creator
    const creatorSection = screen
      .getByText('common.createdBy')
      .closest('div')!.parentElement!
    expect(within(creatorSection).getByText('—')).toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    render(<WeldDetailsCard {...defaultProps} />)

    // Check that the date is formatted (exact format depends on locale)
    // Just verify that some date representation is shown
    const dateSection = screen
      .getByText('common.createdAt')
      .closest('div')!.parentElement!
    const dateText = within(dateSection).getByText(/2024/)
    expect(dateText).toBeInTheDocument()
  })
})