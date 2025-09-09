import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useImportDataFetching from './useImportDataFetching';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: {},
  storage: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
}));

// Mock Storage functions
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  getDownloadURL: vi.fn(() => Promise.resolve('https://test-url.com')),
}));

// Mock the ACTIONS from useImportBrowser
vi.mock('./useImportBrowser', () => ({
  ACTIONS: {
    SET_LOADING: 'SET_LOADING',
    SET_COLLECTIONS: 'SET_COLLECTIONS',
    SET_SECTIONS: 'SET_SECTIONS',
    SET_DOCUMENTS: 'SET_DOCUMENTS',
    SET_THUMBNAILS: 'SET_THUMBNAILS',
  },
}));

describe('useImportDataFetching', () => {
  const mockDispatch = vi.fn();

  it('does not crash when initialized with document library source', () => {
    const state = {
      currentView: 'collections',
      selectedCollection: null,
      selectedSection: null,
    };

    const { result } = renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'documentLibrary', null)
    );

    // Hook should initialize without errors
    expect(result.error).toBeUndefined();
  });

  it('does not crash when initialized with project library source', () => {
    const state = {
      currentView: 'sections',
      selectedCollection: { id: 'main', name: 'Project Documents' },
      selectedSection: null,
    };

    const { result } = renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'projectLibrary', 'proj-123')
    );

    // Hook should initialize without errors
    expect(result.error).toBeUndefined();
  });

  it('does not crash when view changes', () => {
    const state = {
      currentView: 'sections',
      selectedCollection: { id: 'col-1', name: 'Collection' },
      selectedSection: null,
    };

    const { rerender, result } = renderHook(
      ({ view }) =>
        useImportDataFetching(
          { ...state, currentView: view },
          mockDispatch,
          'documentLibrary',
          null
        ),
      {
        initialProps: { view: 'sections' },
      }
    );

    // Change view
    rerender({ view: 'documents' });

    // Hook should handle view change without errors
    expect(result.error).toBeUndefined();
  });

  it('does not crash when section is selected', () => {
    const state = {
      currentView: 'documents',
      selectedCollection: { id: 'col-1', name: 'Collection' },
      selectedSection: { id: 'sec-1', name: 'Section' },
    };

    const { result } = renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'documentLibrary', null)
    );

    // Hook should handle section selection without errors
    expect(result.error).toBeUndefined();
  });

  it('handles missing projectId gracefully for project library', () => {
    const state = {
      currentView: 'sections',
      selectedCollection: { id: 'main', name: 'Project Documents' },
      selectedSection: null,
    };

    const { result } = renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'projectLibrary', null)
    );

    // Hook should handle missing projectId without errors
    expect(result.error).toBeUndefined();
  });

  it('dispatches loading state for document library collections', () => {
    const state = {
      currentView: 'collections',
      selectedCollection: null,
      selectedSection: null,
    };

    renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'documentLibrary', null)
    );

    // Should set loading to true
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOADING',
      payload: true,
    });
  });

  it('dispatches reset for project library collections view', () => {
    const state = {
      currentView: 'collections',
      selectedCollection: null,
      selectedSection: null,
    };

    renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'projectLibrary', 'proj-123')
    );

    // Should reset sections and set loading to false
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SECTIONS',
      payload: [],
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOADING',
      payload: false,
    });
  });

  it('does not fetch when conditions are not met', () => {
    vi.clearAllMocks();

    const state = {
      currentView: 'sections',
      selectedCollection: null, // No collection selected
      selectedSection: null,
    };

    renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'documentLibrary', null)
    );

    // Should not trigger any dispatch
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
