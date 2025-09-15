import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useImportDataFetching from './useImportDataFetching';
import type { BrowserState } from '@/types/documents';
import type { FirestoreSection } from '@/types/api/firestore';

// Type aliases for compatibility
type CollectionData = { id: string; name: string; [key: string]: unknown };
type SectionData = FirestoreSection;

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
    const state: BrowserState = {
      currentView: 'collections',
      selectedCollection: null,
      selectedSection: null,
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedItems: [],
      isLoading: false,
      importSource: 'documentLibrary',
    };

    const { result } = renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'documentLibrary', null)
    );

    // Hook should initialize without errors (hook returns void)
    expect(result.current).toBeUndefined();
  });

  it('does not crash when initialized with project library source', () => {
    const state: BrowserState = {
      currentView: 'sections',
      selectedCollection: {
        id: 'main',
        name: 'Project Documents',
      } as CollectionData,
      selectedSection: null,
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedItems: [],
      isLoading: false,
      importSource: 'documentLibrary',
    };

    const { result } = renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'projectLibrary', 'proj-123')
    );

    // Hook should initialize without errors (hook returns void)
    expect(result.current).toBeUndefined();
  });

  it('does not crash when view changes', () => {
    const baseState: BrowserState = {
      selectedCollection: { id: 'col-1', name: 'Collection' } as CollectionData,
      selectedSection: null,
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedItems: [],
      isLoading: false,
      currentView: 'sections',
      importSource: 'documentLibrary',
    };

    const { rerender, result } = renderHook<
      void,
      { view: 'collections' | 'sections' | 'documents' }
    >(
      ({ view }) =>
        useImportDataFetching(
          { ...baseState, currentView: view },
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

    // Hook should handle view change without errors (hook returns void)
    expect(result.current).toBeUndefined();
  });

  it('does not crash when section is selected', () => {
    const state: BrowserState = {
      currentView: 'documents',
      selectedCollection: { id: 'col-1', name: 'Collection' } as CollectionData,
      selectedSection: { id: 'sec-1', name: 'Section' } as SectionData,
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedItems: [],
      isLoading: false,
      importSource: 'documentLibrary',
    };

    const { result } = renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'documentLibrary', null)
    );

    // Hook should handle section selection without errors (hook returns void)
    expect(result.current).toBeUndefined();
  });

  it('handles missing projectId gracefully for project library', () => {
    const state: BrowserState = {
      currentView: 'sections',
      selectedCollection: {
        id: 'main',
        name: 'Project Documents',
      } as CollectionData,
      selectedSection: null,
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedItems: [],
      isLoading: false,
      importSource: 'documentLibrary',
    };

    const { result } = renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'projectLibrary', null)
    );

    // Hook should handle missing projectId without errors (hook returns void)
    expect(result.current).toBeUndefined();
  });

  it('dispatches loading state for document library collections', () => {
    const state: BrowserState = {
      currentView: 'collections',
      selectedCollection: null,
      selectedSection: null,
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedItems: [],
      isLoading: false,
      importSource: 'documentLibrary',
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
    const state: BrowserState = {
      currentView: 'collections',
      selectedCollection: null,
      selectedSection: null,
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedItems: [],
      isLoading: false,
      importSource: 'documentLibrary',
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

    const state: BrowserState = {
      currentView: 'sections',
      selectedCollection: null, // No collection selected
      selectedSection: null,
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedItems: [],
      isLoading: false,
      importSource: 'documentLibrary',
    };

    renderHook(() =>
      useImportDataFetching(state, mockDispatch, 'documentLibrary', null)
    );

    // Should not trigger any dispatch
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
