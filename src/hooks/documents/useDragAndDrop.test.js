import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDragAndDrop } from './useDragAndDrop';

describe('useDragAndDrop', () => {
  let onDropMock;

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
    };

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
    };

    const mockLeaveEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

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
    };

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
    ];

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: mockFiles,
      },
    };

    // Set dragging state first
    const mockEnterEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        items: [{ type: 'file' }],
      },
    };

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
    };

    act(() => {
      result.current.dragProps.onDrop(mockEvent);
    });

    expect(onDropMock).not.toHaveBeenCalled();
  });
});
