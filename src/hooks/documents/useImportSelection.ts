import { useCallback, Dispatch } from 'react';
import {
  ACTIONS,
  BrowserState,
  BrowserAction,
  SelectedItem,
} from './useImportBrowser';
import type { FirestoreSection, FirestoreDocument } from '@/types/database';

// Type aliases for import selection context
type DocumentData = FirestoreDocument;
type SectionData = FirestoreSection;

// Union type for selectable items
type SelectableItem = DocumentData | SectionData;

/**
 * Return type for useImportSelection hook
 */
interface UseImportSelectionReturn {
  handleSelectItem: (
    item: SelectableItem,
    type: 'section' | 'document'
  ) => void;
  isItemSelected: (
    item: SelectableItem,
    type: 'section' | 'document'
  ) => boolean;
  areAllItemsSelected: (type: 'section' | 'document') => boolean;
  toggleAllItems: (type: 'section' | 'document') => void;
  clearSelection: () => void;
  selectedItems: SelectedItem[];
}

/**
 * Hook for managing selection logic in the import browser
 * @param state - Current browser state
 * @param dispatch - Dispatch function for state updates
 * @param allowMultiple - Whether multiple selection is allowed
 * @param sourceType - Source type ('documentLibrary' or 'projectLibrary')
 * @param projectId - Project ID for project library source
 * @returns Selection handlers and utilities
 */
export default function useImportSelection(
  state: BrowserState,
  dispatch: Dispatch<BrowserAction>,
  allowMultiple: boolean,
  sourceType: 'documentLibrary' | 'projectLibrary',
  projectId: string | null
): UseImportSelectionReturn {
  const {
    selectedItems,
    selectedCollection,
    selectedSection,
    sections,
    documents,
  } = state;

  // Handle selection with useCallback to prevent re-renders
  const handleSelectItem = useCallback(
    (item: SelectableItem, type: 'section' | 'document') => {
      dispatch({
        type: ACTIONS.TOGGLE_ITEM_SELECTION,
        payload: {
          item,
          type,
          allowMultiple,
          sourceType,
          projectId,
          selectedCollection,
          selectedSection,
        },
      });
    },
    [
      allowMultiple,
      sourceType,
      projectId,
      selectedCollection,
      selectedSection,
      dispatch,
    ]
  );

  const isItemSelected = useCallback(
    (item: SelectableItem, type: 'section' | 'document'): boolean => {
      return selectedItems.some(
        (selected) => selected.id === item.id && selected.type === type
      );
    },
    [selectedItems]
  );

  // Check if all items of a type are selected
  const areAllItemsSelected = useCallback(
    (type: 'section' | 'document'): boolean => {
      if (type === 'section') {
        if (sections.length === 0) return false;
        return sections.every((section) => isItemSelected(section, 'section'));
      } else if (type === 'document') {
        if (documents.length === 0) return false;
        return documents.every((doc) => isItemSelected(doc, 'document'));
      }
      return false;
    },
    [sections, documents, isItemSelected]
  );

  // Toggle all items of a type
  const toggleAllItems = useCallback(
    (type: 'section' | 'document') => {
      if (type === 'section') {
        if (areAllItemsSelected('section')) {
          // Deselect all sections
          dispatch({
            type: ACTIONS.SET_SELECTED_ITEMS,
            payload: selectedItems.filter((item) => item.type !== 'section'),
          });
        } else {
          // Select all sections
          const allSections: SelectedItem[] = sections.map((section) => ({
            ...section,
            type: 'section',
            collectionId: selectedCollection?.id || null,
            projectId:
              sourceType === 'projectLibrary'
                ? projectId || undefined
                : undefined,
          }));

          // Remove existing sections and add all
          const nonSections = selectedItems.filter(
            (item) => item.type !== 'section'
          );
          dispatch({
            type: ACTIONS.SET_SELECTED_ITEMS,
            payload: [...nonSections, ...allSections],
          });
        }
      } else if (type === 'document') {
        if (areAllItemsSelected('document')) {
          // Deselect all documents
          dispatch({
            type: ACTIONS.SET_SELECTED_ITEMS,
            payload: selectedItems.filter((item) => item.type !== 'document'),
          });
        } else {
          // Select all documents
          const allDocuments: SelectedItem[] = documents.map((doc) => ({
            ...doc,
            type: 'document',
            collectionId: selectedCollection?.id || null,
            sectionId: selectedSection?.id || null,
            projectId:
              sourceType === 'projectLibrary'
                ? projectId || undefined
                : undefined,
          }));

          // Remove existing documents and add all
          const nonDocuments = selectedItems.filter(
            (item) => item.type !== 'document'
          );
          dispatch({
            type: ACTIONS.SET_SELECTED_ITEMS,
            payload: [...nonDocuments, ...allDocuments],
          });
        }
      }
    },
    [
      sections,
      documents,
      selectedItems,
      selectedCollection,
      selectedSection,
      sourceType,
      projectId,
      areAllItemsSelected,
      dispatch,
    ]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_SELECTION });
  }, [dispatch]);

  return {
    handleSelectItem,
    isItemSelected,
    areAllItemsSelected,
    toggleAllItems,
    clearSelection,
    selectedItems,
  };
}
