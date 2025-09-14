import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useConfirmationDialog,
  type IdentifiableEntity,
} from './useConfirmationDialog';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: vi.fn((key: string, options?: Record<string, unknown>) => {
      if (key === 'crud.operationSuccess')
        return `Operation ${options?.operation} successful`;
      if (key === 'crud.bulkOperationSuccess')
        return `Bulk ${options?.operation} successful (${options?.count} items)`;
      if (key === 'crud.operationNotConfigured')
        return 'Operation not configured';
      if (key === 'crud.operationFailedWithMessage')
        return `Operation ${options?.operation} failed: ${options?.message}`;
      if (key === 'crud.unknownError') return 'Unknown error';
      return key;
    }),
  }),
}));

describe('useConfirmationDialog', () => {
  const mockDelete = vi.fn<(id: string) => Promise<void>>();
  const mockArchive = vi.fn<(id: string) => Promise<void>>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useConfirmationDialog());

    expect(result.current.dialog.isOpen).toBe(false);
    expect(result.current.dialog.type).toBe(null);
    expect(result.current.dialog.data).toBe(null);
    expect(result.current.dialog.isBulk).toBe(false);
  });

  it('should open confirmation dialog for single operation', () => {
    const { result } = renderHook(() => useConfirmationDialog());
    const testEntity: IdentifiableEntity = { id: '1', name: 'Test Entity' };

    act(() => {
      result.current.open('delete', testEntity);
    });

    expect(result.current.dialog.isOpen).toBe(true);
    expect(result.current.dialog.type).toBe('delete');
    expect(result.current.dialog.data).toBe(testEntity);
    expect(result.current.dialog.isBulk).toBe(false);
  });

  it('should open confirmation dialog for bulk operation', () => {
    const { result } = renderHook(() => useConfirmationDialog());
    const testEntities: IdentifiableEntity[] = [
      { id: '1', name: 'Entity 1' },
      { id: '2', name: 'Entity 2' },
    ];

    act(() => {
      result.current.open('archive', testEntities, true);
    });

    expect(result.current.dialog.isOpen).toBe(true);
    expect(result.current.dialog.type).toBe('archive');
    expect(result.current.dialog.data).toBe(testEntities);
    expect(result.current.dialog.isBulk).toBe(true);
  });

  it('should close dialog and reset state', () => {
    const { result } = renderHook(() => useConfirmationDialog());
    const testEntity: IdentifiableEntity = { id: '1', name: 'Test Entity' };

    // First open
    act(() => {
      result.current.open('delete', testEntity);
    });

    expect(result.current.dialog.isOpen).toBe(true);

    // Then close
    act(() => {
      result.current.close();
    });

    expect(result.current.dialog.isOpen).toBe(false);
    expect(result.current.dialog.type).toBe(null);
    expect(result.current.dialog.data).toBe(null);
    expect(result.current.dialog.isBulk).toBe(false);
  });

  it('should execute single operation successfully', async () => {
    mockDelete.mockResolvedValue();
    const { result } = renderHook(() =>
      useConfirmationDialog({ delete: mockDelete })
    );
    const testEntity: IdentifiableEntity = { id: '1', name: 'Test Entity' };

    act(() => {
      result.current.open('delete', testEntity);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(mockDelete).toHaveBeenCalledWith('1');
    expect(result.current.dialog.isOpen).toBe(false);
  });

  it('should execute bulk operation successfully', async () => {
    mockArchive.mockResolvedValue();
    const { result } = renderHook(() =>
      useConfirmationDialog({ archive: mockArchive })
    );
    const testEntities: IdentifiableEntity[] = [
      { id: '1', name: 'Entity 1' },
      { id: '2', name: 'Entity 2' },
    ];

    act(() => {
      result.current.open('archive', testEntities, true);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(mockArchive).toHaveBeenCalledWith('1');
    expect(mockArchive).toHaveBeenCalledWith('2');
    expect(mockArchive).toHaveBeenCalledTimes(2);
    expect(result.current.dialog.isOpen).toBe(false);
  });

  it('should handle operation not configured', async () => {
    const { result } = renderHook(() => useConfirmationDialog({}));
    const testEntity: IdentifiableEntity = { id: '1', name: 'Test Entity' };

    act(() => {
      result.current.open('delete', testEntity);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(toast.error).toHaveBeenCalledWith('Operation not configured');
    expect(result.current.dialog.isOpen).toBe(false);
  });

  it('should handle operation error', async () => {
    const error = new Error('Operation failed');
    mockDelete.mockRejectedValue(error);
    const { result } = renderHook(() =>
      useConfirmationDialog({ delete: mockDelete })
    );
    const testEntity: IdentifiableEntity = { id: '1', name: 'Test Entity' };

    act(() => {
      result.current.open('delete', testEntity);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(mockDelete).toHaveBeenCalledWith('1');
    expect(toast.error).toHaveBeenCalledWith(
      'Operation delete failed: Operation failed'
    );
    expect(result.current.dialog.isOpen).toBe(false);
  });
});
