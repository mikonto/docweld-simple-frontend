import { useReducer, Dispatch } from 'react';
import type { DocumentData, SectionData, CollectionData } from '@/types/database';

// Action types
export const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_VIEW: 'SET_VIEW',
  SET_COLLECTIONS: 'SET_COLLECTIONS',
  SET_SELECTED_COLLECTION: 'SET_SELECTED_COLLECTION',
  SET_SECTIONS: 'SET_SECTIONS',
  SET_SELECTED_SECTION: 'SET_SELECTED_SECTION',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  SET_THUMBNAILS: 'SET_THUMBNAILS',
  ADD_THUMBNAIL: 'ADD_THUMBNAIL',
  TOGGLE_ITEM_SELECTION: 'TOGGLE_ITEM_SELECTION',
  SET_SELECTED_ITEMS: 'SET_SELECTED_ITEMS',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  RESET_FOR_SOURCE_CHANGE: 'RESET_FOR_SOURCE_CHANGE',
  RESET_SECTIONS_AND_DOCUMENTS: 'RESET_SECTIONS_AND_DOCUMENTS',
} as const;

// View types
type ViewType = 'collections' | 'sections' | 'documents';

// Selected item type
export interface SelectedItem {
  id: string;
  type: 'section' | 'document';
  collectionId?: string | null;
  sectionId?: string | null;
  projectId?: string;
  [key: string]: any; // Allow additional properties from the original item
}

// Browser state
export interface BrowserState {
  // Data
  collections: CollectionData[];
  sections: SectionData[];
  documents: DocumentData[];
  thumbnails: Record<string, string>;

  // Selection
  selectedCollection: CollectionData | null;
  selectedSection: SectionData | null;
  selectedItems: SelectedItem[];

  // UI State
  currentView: ViewType;
  isLoading: boolean;
}

// Action types
export type BrowserAction =
  | { type: typeof ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof ACTIONS.SET_VIEW; payload: ViewType }
  | { type: typeof ACTIONS.SET_COLLECTIONS; payload: CollectionData[] }
  | { type: typeof ACTIONS.SET_SELECTED_COLLECTION; payload: CollectionData | null }
  | { type: typeof ACTIONS.SET_SECTIONS; payload: SectionData[] }
  | { type: typeof ACTIONS.SET_SELECTED_SECTION; payload: SectionData | null }
  | { type: typeof ACTIONS.SET_DOCUMENTS; payload: DocumentData[] }
  | { type: typeof ACTIONS.SET_THUMBNAILS; payload: Record<string, string> }
  | { type: typeof ACTIONS.ADD_THUMBNAIL; payload: { id: string; url: string } }
  | {
      type: typeof ACTIONS.TOGGLE_ITEM_SELECTION;
      payload: {
        item: any;
        type: 'section' | 'document';
        allowMultiple: boolean;
        sourceType: string;
        projectId?: string | null;
        selectedCollection: CollectionData | null;
        selectedSection: SectionData | null;
      };
    }
  | { type: typeof ACTIONS.SET_SELECTED_ITEMS; payload: SelectedItem[] }
  | { type: typeof ACTIONS.CLEAR_SELECTION }
  | {
      type: typeof ACTIONS.RESET_FOR_SOURCE_CHANGE;
      payload: {
        view: ViewType;
        collection?: CollectionData | null;
      };
    }
  | { type: typeof ACTIONS.RESET_SECTIONS_AND_DOCUMENTS };

// Initial state
const initialState: BrowserState = {
  // Data
  collections: [],
  sections: [],
  documents: [],
  thumbnails: {},

  // Selection
  selectedCollection: null,
  selectedSection: null,
  selectedItems: [],

  // UI State
  currentView: 'collections',
  isLoading: true, // Start with loading true to prevent flash of "no data" message
};

// Reducer function
function browserReducer(state: BrowserState, action: BrowserAction): BrowserState {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ACTIONS.SET_VIEW:
      return { ...state, currentView: action.payload };

    case ACTIONS.SET_COLLECTIONS:
      return { ...state, collections: action.payload };

    case ACTIONS.SET_SELECTED_COLLECTION:
      return { ...state, selectedCollection: action.payload };

    case ACTIONS.SET_SECTIONS:
      return { ...state, sections: action.payload };

    case ACTIONS.SET_SELECTED_SECTION:
      return { ...state, selectedSection: action.payload };

    case ACTIONS.SET_DOCUMENTS:
      return { ...state, documents: action.payload };

    case ACTIONS.SET_THUMBNAILS:
      return { ...state, thumbnails: action.payload };

    case ACTIONS.ADD_THUMBNAIL:
      return {
        ...state,
        thumbnails: {
          ...state.thumbnails,
          [action.payload.id]: action.payload.url,
        },
      };

    case ACTIONS.TOGGLE_ITEM_SELECTION: {
      const {
        item,
        type,
        allowMultiple,
        sourceType,
        projectId,
        selectedCollection,
        selectedSection,
      } = action.payload;

      const isAlreadySelected = state.selectedItems.some(
        (selected) => selected.id === item.id && selected.type === type
      );

      if (isAlreadySelected) {
        // Remove from selection
        return {
          ...state,
          selectedItems: state.selectedItems.filter(
            (selected) => !(selected.id === item.id && selected.type === type)
          ),
        };
      } else {
        // Add to selection
        let newItem: SelectedItem;
        if (type === 'section') {
          newItem = {
            ...item,
            type: 'section',
            collectionId: selectedCollection?.id || null,
            projectId: sourceType === 'projectLibrary' ? projectId || undefined : undefined,
          };
        } else {
          newItem = {
            ...item,
            type: 'document',
            collectionId: selectedCollection?.id || null,
            sectionId: selectedSection?.id || null,
            projectId: sourceType === 'projectLibrary' ? projectId || undefined : undefined,
          };
        }

        if (allowMultiple) {
          return {
            ...state,
            selectedItems: [...state.selectedItems, newItem],
          };
        } else {
          return {
            ...state,
            selectedItems: [newItem],
          };
        }
      }
    }

    case ACTIONS.SET_SELECTED_ITEMS:
      return { ...state, selectedItems: action.payload };

    case ACTIONS.CLEAR_SELECTION:
      return { ...state, selectedItems: [] };

    case ACTIONS.RESET_FOR_SOURCE_CHANGE:
      return {
        ...initialState,
        currentView: action.payload.view,
        selectedCollection: action.payload.collection || null,
      };

    case ACTIONS.RESET_SECTIONS_AND_DOCUMENTS:
      return {
        ...state,
        selectedSection: null,
        sections: [],
        documents: [],
        selectedItems: [],
      };

    default:
      return state;
  }
}

/**
 * Return type for useImportBrowser hook
 */
interface UseImportBrowserReturn {
  state: BrowserState;
  dispatch: Dispatch<BrowserAction>;
  ACTIONS: typeof ACTIONS;
}

/**
 * Hook for managing import browser state
 * @returns State and dispatch function
 */
export default function useImportBrowser(): UseImportBrowserReturn {
  const [state, dispatch] = useReducer(browserReducer, initialState);

  return {
    state,
    dispatch,
    ACTIONS,
  };
}