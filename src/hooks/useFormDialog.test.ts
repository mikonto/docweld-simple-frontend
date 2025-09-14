import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFormDialog } from './useFormDialog';

interface TestEntity {
  id: string;
  name: string;
}

describe('useFormDialog', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useFormDialog<TestEntity>());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.entity).toBe(null);
  });

  it('should open dialog for create (no entity)', () => {
    const { result } = renderHook(() => useFormDialog<TestEntity>());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.entity).toBe(null);
  });

  it('should open dialog for edit with entity', () => {
    const { result } = renderHook(() => useFormDialog<TestEntity>());
    const testEntity: TestEntity = { id: '1', name: 'Test Entity' };

    act(() => {
      result.current.open(testEntity);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.entity).toBe(testEntity);
  });

  it('should close dialog and reset state', () => {
    const { result } = renderHook(() => useFormDialog<TestEntity>());
    const testEntity: TestEntity = { id: '1', name: 'Test Entity' };

    // First open with entity
    act(() => {
      result.current.open(testEntity);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.entity).toBe(testEntity);

    // Then close
    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.entity).toBe(null);
  });

  it('should override entity when opening again', () => {
    const { result } = renderHook(() => useFormDialog<TestEntity>());
    const firstEntity: TestEntity = { id: '1', name: 'First Entity' };
    const secondEntity: TestEntity = { id: '2', name: 'Second Entity' };

    // Open with first entity
    act(() => {
      result.current.open(firstEntity);
    });

    expect(result.current.entity).toBe(firstEntity);

    // Open with second entity (should replace first)
    act(() => {
      result.current.open(secondEntity);
    });

    expect(result.current.entity).toBe(secondEntity);
    expect(result.current.isOpen).toBe(true);
  });
});
