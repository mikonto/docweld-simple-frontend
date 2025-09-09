import { useCallback } from 'react';
import { ACTIONS } from './useImportBrowser';

/**
 * Hook for managing selection logic in the import browser
 * @param {Object} state - Current browser state
 * @param {Function} dispatch - Dispatch function for state updates
 * @param {boolean} allowMultiple - Whether multiple selection is allowed
 * @param {string} sourceType - Source type ('documentLibrary' or 'projectLibrary')
 * @param {string} projectId - Project ID for project library source
 * @returns {Object} Selection handlers and utilities
 */
export default function useImportSelection(
  state,
  dispatch,
  allowMultiple,
  sourceType,
  projectId
) {
  const {
    selectedItems,
    selectedCollection,
    selectedSection,
    sections,
    documents,
  } = state;

  // Handle selection with useCallback to prevent re-renders
  const handleSelectItem = useCallback(
    (item, type) => {
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
    (item, type) => {
      return selectedItems.some(
        (selected) => selected.id === item.id && selected.type === type
      );
    },
    [selectedItems]
  );

  // Check if all items of a type are selected
  const areAllItemsSelected = useCallback(
    (type) => {
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
    (type) => {
      if (type === 'section') {
        if (areAllItemsSelected('section')) {
          // Deselect all sections
          dispatch({
            type: ACTIONS.SET_SELECTED_ITEMS,
            payload: selectedItems.filter((item) => item.type !== 'section'),
          });
        } else {
          // Select all sections
          const allSections = sections.map((section) => ({
            ...section,
            type: 'section',
            collectionId: selectedCollection?.id || null,
            projectId: sourceType === 'projectLibrary' ? projectId : undefined,
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
          const allDocuments = documents.map((doc) => ({
            ...doc,
            type: 'document',
            collectionId: selectedCollection?.id || null,
            sectionId: selectedSection?.id || null,
            projectId: sourceType === 'projectLibrary' ? projectId : undefined,
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
