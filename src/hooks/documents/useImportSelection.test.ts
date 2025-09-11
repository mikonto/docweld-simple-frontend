import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useImportSelection from './useImportSelection';
import type { BrowserState, BrowserAction, SelectedItem } from './useImportBrowser';
import type { CollectionData, SectionData, DocumentData } from '@/types/database';
import { Dispatch } from 'react';

// Mock the ACTIONS from useImportBrowser
vi.mock('./useImportBrowser', () => ({
  ACTIONS: {
    TOGGLE_ITEM_SELECTION: 'TOGGLE_ITEM_SELECTION',
    SET_SELECTED_ITEMS: 'SET_SELECTED_ITEMS',
    CLEAR_SELECTION: 'CLEAR_SELECTION',
  },
}));

describe('useImportSelection', () => {
  const mockDispatch = vi.fn() as MockedFunction<Dispatch<BrowserAction>>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSelectItem', () => {
    it('dispatches TOGGLE_ITEM_SELECTION with correct payload', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [],
        sections: [],
        documents: [],
        selectedCollection: { id: 'col-1', name: 'Collection' } as CollectionData,
        selectedSection: { id: 'sec-1', name: 'Section' } as SectionData,
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      const item = { id: 'doc-1', title: 'Document 1' };
      act(() => {
        result.current.handleSelectItem(item, 'document');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'TOGGLE_ITEM_SELECTION',
        payload: {
          item,
          type: 'document',
          allowMultiple: true,
          sourceType: 'documentLibrary',
          projectId: null,
          selectedCollection: { id: 'col-1', name: 'Collection' },
          selectedSection: { id: 'sec-1', name: 'Section' },
        },
      });
    });

    it('dispatches TOGGLE_ITEM_SELECTION for single selection mode', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [],
        sections: [],
        documents: [],
        selectedCollection: null,
        selectedSection: null,
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, false, 'documentLibrary', null)
      );

      const item = { id: 'doc-1', title: 'Document 1' };
      act(() => {
        result.current.handleSelectItem(item, 'document');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'TOGGLE_ITEM_SELECTION',
        payload: {
          item,
          type: 'document',
          allowMultiple: false,
          sourceType: 'documentLibrary',
          projectId: null,
          selectedCollection: null,
          selectedSection: null,
        },
      });
    });

    it('includes projectId for project library sources', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [],
        sections: [],
        documents: [],
        selectedCollection: null,
        selectedSection: null,
      };

      const { result } = renderHook(() =>
        useImportSelection(
          state as BrowserState,
          mockDispatch,
          true,
          'projectLibrary',
          'proj-123'
        )
      );

      const item = { id: 'doc-1', title: 'Document 1' };
      act(() => {
        result.current.handleSelectItem(item, 'document');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'TOGGLE_ITEM_SELECTION',
        payload: {
          item,
          type: 'document',
          allowMultiple: true,
          sourceType: 'projectLibrary',
          projectId: 'proj-123',
          selectedCollection: null,
          selectedSection: null,
        },
      });
    });
  });

  describe('isItemSelected', () => {
    it('returns true when item is in selected items', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [
          { id: 'doc-1', title: 'Document 1', type: 'document' },
          { id: 'sec-1', name: 'Section 1', type: 'section' },
        ] as SelectedItem[],
        sections: [],
        documents: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.isItemSelected({ id: 'doc-1' }, 'document')).toBe(
        true
      );
      expect(result.current.isItemSelected({ id: 'sec-1' }, 'section')).toBe(
        true
      );
    });

    it('returns false when item is not selected', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [{ id: 'doc-1', title: 'Document 1', type: 'document' }] as SelectedItem[],
        sections: [],
        documents: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.isItemSelected({ id: 'doc-2' }, 'document')).toBe(
        false
      );
      expect(result.current.isItemSelected({ id: 'sec-1' }, 'section')).toBe(
        false
      );
    });

    it('returns false when no items are selected', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [],
        sections: [],
        documents: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.isItemSelected({ id: 'doc-1' }, 'document')).toBe(
        false
      );
    });
  });

  describe('areAllItemsSelected', () => {
    it('returns true when all documents are selected', () => {
      const documents = [
        { id: 'doc-1', title: 'Document 1' },
        { id: 'doc-2', title: 'Document 2' },
      ] as DocumentData[];

      const state: Partial<BrowserState> = {
        selectedItems: [
          { id: 'doc-1', title: 'Document 1', type: 'document' },
          { id: 'doc-2', title: 'Document 2', type: 'document' },
        ] as SelectedItem[],
        sections: [],
        documents,
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.areAllItemsSelected('document')).toBe(true);
    });

    it('returns false when only some documents are selected', () => {
      const documents = [
        { id: 'doc-1', title: 'Document 1' },
        { id: 'doc-2', title: 'Document 2' },
        { id: 'doc-3', title: 'Document 3' },
      ] as DocumentData[];

      const state: Partial<BrowserState> = {
        selectedItems: [
          { id: 'doc-1', title: 'Document 1', type: 'document' },
          { id: 'doc-2', title: 'Document 2', type: 'document' },
        ] as SelectedItem[],
        documents,
        sections: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.areAllItemsSelected('document')).toBe(false);
    });

    it('returns true when all sections are selected', () => {
      const sections = [
        { id: 'sec-1', name: 'Section 1' },
        { id: 'sec-2', name: 'Section 2' },
      ] as SectionData[];

      const state: Partial<BrowserState> = {
        selectedItems: [
          { id: 'sec-1', name: 'Section 1', type: 'section' },
          { id: 'sec-2', name: 'Section 2', type: 'section' },
        ] as SelectedItem[],
        sections,
        documents: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.areAllItemsSelected('section')).toBe(true);
    });

    it('returns false when no items exist', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [],
        sections: [],
        documents: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.areAllItemsSelected('document')).toBe(false);
      expect(result.current.areAllItemsSelected('section')).toBe(false);
    });
  });

  describe('toggleAllItems', () => {
    it('selects all documents when none are selected', () => {
      const documents = [
        { id: 'doc-1', title: 'Document 1' },
        { id: 'doc-2', title: 'Document 2' },
      ] as DocumentData[];

      const state: Partial<BrowserState> = {
        selectedItems: [],
        sections: [],
        documents,
        selectedCollection: null,
        selectedSection: null,
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      act(() => {
        result.current.toggleAllItems('document');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SELECTED_ITEMS',
        payload: [
          {
            id: 'doc-1',
            title: 'Document 1',
            type: 'document',
            collectionId: null,
            sectionId: null,
            projectId: undefined,
          },
          {
            id: 'doc-2',
            title: 'Document 2',
            type: 'document',
            collectionId: null,
            sectionId: null,
            projectId: undefined,
          },
        ],
      });
    });

    it('deselects all documents when all are selected', () => {
      const documents = [
        { id: 'doc-1', title: 'Document 1' },
        { id: 'doc-2', title: 'Document 2' },
      ] as DocumentData[];

      const state: Partial<BrowserState> = {
        selectedItems: [
          { id: 'doc-1', title: 'Document 1', type: 'document' },
          { id: 'doc-2', title: 'Document 2', type: 'document' },
        ] as SelectedItem[],
        sections: [],
        documents,
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      act(() => {
        result.current.toggleAllItems('document');
      });

      // Should remove only document type items
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SELECTED_ITEMS',
        payload: [],
      });
    });

    it('selects all sections when toggling sections', () => {
      const sections = [
        { id: 'sec-1', name: 'Section 1' },
        { id: 'sec-2', name: 'Section 2' },
      ] as SectionData[];

      const state: Partial<BrowserState> = {
        selectedItems: [],
        sections,
        documents: [],
        selectedCollection: null,
        selectedSection: null,
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      act(() => {
        result.current.toggleAllItems('section');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SELECTED_ITEMS',
        payload: [
          {
            id: 'sec-1',
            name: 'Section 1',
            type: 'section',
            collectionId: null,
            projectId: undefined,
          },
          {
            id: 'sec-2',
            name: 'Section 2',
            type: 'section',
            collectionId: null,
            projectId: undefined,
          },
        ],
      });
    });

    it('preserves other type selections when toggling', () => {
      const documents = [
        { id: 'doc-1', title: 'Document 1' },
        { id: 'doc-2', title: 'Document 2' },
      ] as DocumentData[];

      const state: Partial<BrowserState> = {
        selectedItems: [{ id: 'sec-1', name: 'Section 1', type: 'section' }] as SelectedItem[],
        sections: [],
        documents,
        selectedCollection: null,
        selectedSection: null,
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      act(() => {
        result.current.toggleAllItems('document');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SELECTED_ITEMS',
        payload: [
          { id: 'sec-1', name: 'Section 1', type: 'section' },
          {
            id: 'doc-1',
            title: 'Document 1',
            type: 'document',
            collectionId: null,
            sectionId: null,
            projectId: undefined,
          },
          {
            id: 'doc-2',
            title: 'Document 2',
            type: 'document',
            collectionId: null,
            sectionId: null,
            projectId: undefined,
          },
        ],
      });
    });
  });

  describe('clearSelection', () => {
    it('dispatches CLEAR_SELECTION action', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [
          { id: 'doc-1', title: 'Document 1', type: 'document' },
          { id: 'sec-1', name: 'Section 1', type: 'section' },
        ] as SelectedItem[],
        sections: [],
        documents: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CLEAR_SELECTION',
      });
    });
  });

  describe('selectedItems', () => {
    it('returns the current selected items from state', () => {
      const selectedItems = [
        { id: 'doc-1', title: 'Document 1', type: 'document' },
        { id: 'sec-1', name: 'Section 1', type: 'section' },
      ] as SelectedItem[];

      const state: Partial<BrowserState> = {
        selectedItems,
        sections: [],
        documents: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.selectedItems).toEqual(selectedItems);
    });

    it('returns empty array when no items are selected', () => {
      const state: Partial<BrowserState> = {
        selectedItems: [],
        sections: [],
        documents: [],
      };

      const { result } = renderHook(() =>
        useImportSelection(state as BrowserState, mockDispatch, true, 'documentLibrary', null)
      );

      expect(result.current.selectedItems).toEqual([]);
    });
  });
});