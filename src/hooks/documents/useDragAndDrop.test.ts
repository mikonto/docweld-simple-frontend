import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, MockedFunction } from 'vitest';
import { useDragAndDrop } from './useDragAndDrop';
import { DragEvent } from 'react';

describe('useDragAndDrop', () => {
  let onDropMock: MockedFunction<(files: FileList) => void>;

  beforeEach(() => {
    onDropMock = vi.fn();
  });

  it('should initialize with isDragging false', () => {
    const { result } = renderHook(() => useDragAndDrop(onDropMock));

    expect(result.current.isDragging).toBe(false);
    expect(result.current.dragProps).toBeDefined();
  });

  it('should set isDragging to true on drag enter', () => {
    const { result } = renderHook(() => useDragAndDrop(onDropMock));

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        items: [{ type: 'file' }],
      },
    } as unknown as DragEvent<HTMLElement>;

    act(() => {
      result.current.dragProps.onDragEnter(mockEvent);
    });

    expect(result.current.isDragging).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should handle drag leave correctly', () => {
    const { result } = renderHook(() => useDragAndDrop(onDropMock));

    const mockEnterEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        items: [{ type: 'file' }],
      },
    } as unknown as DragEvent<HTMLElement>;

    const mockLeaveEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent<HTMLElement>;

    // Enter drag area
    act(() => {
      result.current.dragProps.onDragEnter(mockEnterEvent);
    });

    expect(result.current.isDragging).toBe(true);

    // Leave drag area
    act(() => {
      result.current.dragProps.onDragLeave(mockLeaveEvent);
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('should prevent default on drag over', () => {
    const { result } = renderHook(() => useDragAndDrop(onDropMock));

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent<HTMLElement>;

    act(() => {
      result.current.dragProps.onDragOver(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should handle drop and call onDrop with files', () => {
    const { result } = renderHook(() => useDragAndDrop(onDropMock));

    const mockFiles = [
      new File(['content'], 'test.pdf', { type: 'application/pdf' }),
    ] as unknown as FileList;

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: mockFiles,
      },
    } as unknown as DragEvent<HTMLElement>;

    // Set dragging state first
    const mockEnterEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        items: [{ type: 'file' }],
      },
    } as unknown as DragEvent<HTMLElement>;

    act(() => {
      result.current.dragProps.onDragEnter(mockEnterEvent);
    });

    expect(result.current.isDragging).toBe(true);

    // Now drop
    act(() => {
      result.current.dragProps.onDrop(mockEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(onDropMock).toHaveBeenCalledWith(mockFiles);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should not call onDrop if no files are dropped', () => {
    const { result } = renderHook(() => useDragAndDrop(onDropMock));

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [],
      },
    } as unknown as DragEvent<HTMLElement>;

    act(() => {
      result.current.dragProps.onDrop(mockEvent);
    });

    expect(onDropMock).not.toHaveBeenCalled();
  });
});
