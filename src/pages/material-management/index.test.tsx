import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import MaterialManagement from './index';
import type { Material } from '@/types/database';

// Mock the hooks
vi.mock('@/hooks/useMaterials', () => ({
  useMaterials: vi.fn(),
  useMaterialOperations: vi.fn(),
}));

vi.mock('@/hooks/useFormDialog', () => ({
  useFormDialog: () => ({
    isOpen: false,
    entity: null,
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('@/hooks/useConfirmationDialog', () => ({
  useConfirmationDialog: () => ({
    dialog: { isOpen: false, type: null, isBulk: false, data: null },
    open: vi.fn(),
    close: vi.fn(),
    handleConfirm: vi.fn(),
  }),
}));

vi.mock('@/utils/confirmationContent', () => ({
  getConfirmationContent: () => ({
    title: 'Delete Material',
    description: 'Are you sure?',
    actionLabel: 'Delete',
    actionVariant: 'destructive',
  }),
}));

// Mock the child components
vi.mock('./MaterialFormDialog', () => ({
  MaterialFormDialog: () => <div data-testid="material-form-dialog" />,
}));

vi.mock('./MaterialsTable', () => ({
  MaterialsTable: ({ materials }: { materials: Material[] }) => (
    <div data-testid="materials-table">
      <div>Materials Count: {materials.length}</div>
    </div>
  ),
}));

vi.mock('@/components/shared/ConfirmationDialog', () => ({
  ConfirmationDialog: () => <div data-testid="confirmation-dialog" />,
}));

describe('MaterialManagement', () => {
  const mockMaterials: Material[] = [
    { id: '1', name: 'Steel Grade A', dimensions: '10mm' } as Material,
    { id: '2', name: 'Steel Grade B', dimensions: '20mm' } as Material,
  ];

  const mockOperations = {
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useMaterials, useMaterialOperations } = await import(
      '@/hooks/useMaterials'
    );

    (useMaterials as any).mockReturnValue([mockMaterials, false, null]);
    (useMaterialOperations as any).mockReturnValue(mockOperations);
  });

  // Basic rendering and data flow
  it('should display page title and materials table', () => {
    renderWithProviders(<MaterialManagement />);

    expect(screen.getByText('Material Management')).toBeInTheDocument();
    expect(screen.getByTestId('materials-table')).toBeInTheDocument();
    expect(screen.getByText('Materials Count: 2')).toBeInTheDocument();
  });

  // Loading state
  it('should show loading state', async () => {
    const { useMaterials } = await import('@/hooks/useMaterials');
    (useMaterials as any).mockReturnValue([[], true, null]);

    renderWithProviders(<MaterialManagement />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Error state
  it('should show error state', async () => {
    const { useMaterials } = await import('@/hooks/useMaterials');
    (useMaterials as any).mockReturnValue([
      null,
      false,
      new Error('Failed to load materials'),
    ]);

    renderWithProviders(<MaterialManagement />);

    expect(screen.getByText(/Error loading/)).toBeInTheDocument();
  });
});