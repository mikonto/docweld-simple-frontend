import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useImportBrowser from './useImportBrowser';
import type { FirestoreSection, FirestoreDocument } from '@/types/database';

// Type aliases for compatibility
type CollectionData = { id: string; name: string; [key: string]: unknown };
type SectionData = FirestoreSection;
type DocumentData = FirestoreDocument;
import type { SelectedItem } from './useImportBrowser';

describe('useImportBrowser', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useImportBrowser());

    expect(result.current.state).toEqual({
      collections: [],
      sections: [],
      documents: [],
      thumbnails: {},
      selectedCollection: null,
      selectedSection: null,
      selectedItems: [],
      currentView: 'collections',
      isLoading: true,
    });
  });

  it('handles SET_LOADING action to control loading state', () => {
    const { result } = renderHook(() => useImportBrowser());

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_LOADING,
        payload: false,
      });
    });

    expect(result.current.state.isLoading).toBe(false);

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_LOADING,
        payload: true,
      });
    });

    expect(result.current.state.isLoading).toBe(true);
  });

  it('handles SET_VIEW action to navigate between views', () => {
    const { result } = renderHook(() => useImportBrowser());

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_VIEW,
        payload: 'sections',
      });
    });

    expect(result.current.state.currentView).toBe('sections');

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_VIEW,
        payload: 'documents',
      });
    });

    expect(result.current.state.currentView).toBe('documents');
  });

  it('handles SET_COLLECTIONS action to update collections data', () => {
    const { result } = renderHook(() => useImportBrowser());
    const mockCollections: CollectionData[] = [
      { id: 'col-1', name: 'Technical Standards' } as CollectionData,
      { id: 'col-2', name: 'Quality Documents' } as CollectionData,
    ];

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_COLLECTIONS,
        payload: mockCollections,
      });
    });

    expect(result.current.state.collections).toEqual(mockCollections);
  });

  it('handles SET_SELECTED_COLLECTION action', () => {
    const { result } = renderHook(() => useImportBrowser());
    const mockCollection: CollectionData = {
      id: 'col-1',
      name: 'Technical Standards',
    } as CollectionData;

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_SELECTED_COLLECTION,
        payload: mockCollection,
      });
    });

    expect(result.current.state.selectedCollection).toEqual(mockCollection);
  });

  it('handles SET_SECTIONS action to update sections data', () => {
    const { result } = renderHook(() => useImportBrowser());
    const mockSections: SectionData[] = [
      { id: 'sec-1', name: 'Welding Procedures' } as SectionData,
      { id: 'sec-2', name: 'Testing Standards' } as SectionData,
    ];

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_SECTIONS,
        payload: mockSections,
      });
    });

    expect(result.current.state.sections).toEqual(mockSections);
  });

  it('handles SET_SELECTED_SECTION action', () => {
    const { result } = renderHook(() => useImportBrowser());
    const mockSection: SectionData = {
      id: 'sec-1',
      name: 'Welding Procedures',
    } as SectionData;

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_SELECTED_SECTION,
        payload: mockSection,
      });
    });

    expect(result.current.state.selectedSection).toEqual(mockSection);
  });

  it('handles SET_DOCUMENTS action to update documents data', () => {
    const { result } = renderHook(() => useImportBrowser());
    const mockDocuments: DocumentData[] = [
      { id: 'doc-1', title: 'WPS-001.pdf' } as DocumentData,
      { id: 'doc-2', title: 'WPS-002.pdf' } as DocumentData,
    ];

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_DOCUMENTS,
        payload: mockDocuments,
      });
    });

    expect(result.current.state.documents).toEqual(mockDocuments);
  });

  it('handles SET_THUMBNAILS action for document previews', () => {
    const { result } = renderHook(() => useImportBrowser());
    const mockThumbnails: Record<string, string> = {
      'doc-1': 'https://example.com/thumb1.jpg',
      'doc-2': 'https://example.com/thumb2.jpg',
    };

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_THUMBNAILS,
        payload: mockThumbnails,
      });
    });

    expect(result.current.state.thumbnails).toEqual(mockThumbnails);
  });

  it('handles TOGGLE_ITEM_SELECTION action to track user selections', () => {
    const { result } = renderHook(() => useImportBrowser());
    const item1: DocumentData = {
      id: 'doc-1',
      title: 'Document 1',
      fileType: 'PDF',
      fileSize: 1024,
      storageRef: 'documents/doc-1/file.pdf',
      thumbStorageRef: null,
      processingState: 'completed',
      status: 'active',
      order: 1,
      createdAt: {
        seconds: 0,
        nanoseconds: 0,
      } as unknown as import('firebase/firestore').Timestamp,
      createdBy: 'user',
      updatedAt: {
        seconds: 0,
        nanoseconds: 0,
      } as unknown as import('firebase/firestore').Timestamp,
      updatedBy: 'user',
    };
    const item2: SectionData = {
      id: 'sec-1',
      name: 'Section 1',
      description: '',
      status: 'active',
      order: 1,
      createdAt: {
        seconds: 0,
        nanoseconds: 0,
      } as unknown as import('firebase/firestore').Timestamp,
      createdBy: 'user',
      updatedAt: {
        seconds: 0,
        nanoseconds: 0,
      } as unknown as import('firebase/firestore').Timestamp,
      updatedBy: 'user',
    };

    // Add first item
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.TOGGLE_ITEM_SELECTION,
        payload: {
          item: item1,
          type: 'document',
          allowMultiple: true,
          sourceType: 'documentLibrary',
          projectId: null,
          selectedCollection: null,
          selectedSection: null,
        },
      });
    });

    expect(result.current.state.selectedItems).toContainEqual({
      ...item1,
      type: 'document',
      collectionId: null,
      sectionId: null,
      projectId: undefined,
    });

    // Add second item
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.TOGGLE_ITEM_SELECTION,
        payload: {
          item: item2,
          type: 'section',
          allowMultiple: true,
          sourceType: 'documentLibrary',
          projectId: null,
          selectedCollection: null,
          selectedSection: null,
        },
      });
    });

    expect(result.current.state.selectedItems).toHaveLength(2);
  });

  it('handles TOGGLE_ITEM_SELECTION to unselect items', () => {
    const { result } = renderHook(() => useImportBrowser());
    const item1: DocumentData = {
      id: 'doc-1',
      title: 'Document 1',
      fileType: 'PDF',
      fileSize: 1024,
      storageRef: 'documents/doc-1/file.pdf',
      thumbStorageRef: null,
      processingState: 'completed',
      status: 'active',
      order: 1,
      createdAt: {
        seconds: 0,
        nanoseconds: 0,
      } as unknown as import('firebase/firestore').Timestamp,
      createdBy: 'user',
      updatedAt: {
        seconds: 0,
        nanoseconds: 0,
      } as unknown as import('firebase/firestore').Timestamp,
      updatedBy: 'user',
    };

    // First add item
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.TOGGLE_ITEM_SELECTION,
        payload: {
          item: item1,
          type: 'document',
          allowMultiple: true,
          sourceType: 'documentLibrary',
          projectId: null,
          selectedCollection: null,
          selectedSection: null,
        },
      });
    });

    expect(result.current.state.selectedItems).toHaveLength(1);

    // Toggle same item to remove it
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.TOGGLE_ITEM_SELECTION,
        payload: {
          item: item1,
          type: 'document',
          allowMultiple: true,
          sourceType: 'documentLibrary',
          projectId: null,
          selectedCollection: null,
          selectedSection: null,
        },
      });
    });

    expect(result.current.state.selectedItems).toHaveLength(0);
  });

  it('handles SET_SELECTED_ITEMS action for bulk selection updates', () => {
    const { result } = renderHook(() => useImportBrowser());
    const items: SelectedItem[] = [
      { id: 'doc-1', title: 'Document 1', type: 'document' },
      { id: 'doc-2', title: 'Document 2', type: 'document' },
      { id: 'doc-3', title: 'Document 3', type: 'document' },
    ];

    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_SELECTED_ITEMS,
        payload: items,
      });
    });

    expect(result.current.state.selectedItems).toEqual(items);
  });

  it('handles CLEAR_SELECTION action to reset all selections', () => {
    const { result } = renderHook(() => useImportBrowser());

    // Add some items first
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_SELECTED_ITEMS,
        payload: [
          { id: 'doc-1', title: 'Document 1', type: 'document' },
          { id: 'doc-2', title: 'Document 2', type: 'document' },
        ],
      });
    });

    expect(result.current.state.selectedItems).toHaveLength(2);

    // Clear selection
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.CLEAR_SELECTION,
      });
    });

    expect(result.current.state.selectedItems).toEqual([]);
  });

  it('handles RESET_FOR_SOURCE_CHANGE action when switching sources', () => {
    const { result } = renderHook(() => useImportBrowser());

    // Set up some existing state
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_COLLECTIONS,
        payload: [{ id: 'col-1', name: 'Collection' } as CollectionData],
      });
      result.current.dispatch({
        type: result.current.ACTIONS.SET_SELECTED_ITEMS,
        payload: [{ id: 'doc-1', title: 'Document', type: 'document' }],
      });
    });

    // Reset for source change
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.RESET_FOR_SOURCE_CHANGE,
        payload: {
          view: 'sections',
          collection: {
            id: 'main',
            name: 'Project Documents',
          } as CollectionData,
        },
      });
    });

    expect(result.current.state.currentView).toBe('sections');
    expect(result.current.state.selectedCollection).toEqual({
      id: 'main',
      name: 'Project Documents',
    });
    expect(result.current.state.collections).toEqual([]);
    expect(result.current.state.selectedItems).toEqual([]);
    expect(result.current.state.isLoading).toBe(true);
  });

  it('handles RESET_SECTIONS_AND_DOCUMENTS action to clear navigation state', () => {
    const { result } = renderHook(() => useImportBrowser());

    // Set up some state
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.SET_SELECTED_SECTION,
        payload: { id: 'sec-1', name: 'Section' } as SectionData,
      });
      result.current.dispatch({
        type: result.current.ACTIONS.SET_SECTIONS,
        payload: [{ id: 'sec-1', name: 'Section' } as SectionData],
      });
      result.current.dispatch({
        type: result.current.ACTIONS.SET_DOCUMENTS,
        payload: [{ id: 'doc-1', title: 'Document' } as DocumentData],
      });
    });

    // Reset sections and documents
    act(() => {
      result.current.dispatch({
        type: result.current.ACTIONS.RESET_SECTIONS_AND_DOCUMENTS,
      });
    });

    expect(result.current.state.selectedSection).toBeNull();
    expect(result.current.state.sections).toEqual([]);
    expect(result.current.state.documents).toEqual([]);
  });

  it('returns ACTIONS object with all action types', () => {
    const { result } = renderHook(() => useImportBrowser());

    expect(result.current.ACTIONS).toHaveProperty('SET_LOADING');
    expect(result.current.ACTIONS).toHaveProperty('SET_VIEW');
    expect(result.current.ACTIONS).toHaveProperty('SET_COLLECTIONS');
    expect(result.current.ACTIONS).toHaveProperty('SET_SELECTED_COLLECTION');
    expect(result.current.ACTIONS).toHaveProperty('SET_SECTIONS');
    expect(result.current.ACTIONS).toHaveProperty('SET_SELECTED_SECTION');
    expect(result.current.ACTIONS).toHaveProperty('SET_DOCUMENTS');
    expect(result.current.ACTIONS).toHaveProperty('SET_THUMBNAILS');
    expect(result.current.ACTIONS).toHaveProperty('ADD_THUMBNAIL');
    expect(result.current.ACTIONS).toHaveProperty('TOGGLE_ITEM_SELECTION');
    expect(result.current.ACTIONS).toHaveProperty('SET_SELECTED_ITEMS');
    expect(result.current.ACTIONS).toHaveProperty('CLEAR_SELECTION');
    expect(result.current.ACTIONS).toHaveProperty('RESET_FOR_SOURCE_CHANGE');
    expect(result.current.ACTIONS).toHaveProperty(
      'RESET_SECTIONS_AND_DOCUMENTS'
    );
  });
});
