/**
 * Document-related types
 * Types for document processing, import/export, and browser functionality
 */

// ============== Processing States ==============

/**
 * Document processing states
 * Used across document upload, display, and management features
 */
import type {
  DocumentLibrary,
  Document,
  Section,
  FirestoreSection,
  FirestoreDocument
} from '@/types/api/firestore';
export type ProcessingState = 'pending' | 'completed' | 'failed';

/**
 * Upload states for file uploads
 */
export type UploadState = 'uploading' | 'complete';

/**
 * Processing state constants for UI display
 */
export const PROCESSING_STATES = {
  PENDING: 'pending' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
};

/**
 * Upload state constants for UI display
 */
export const UPLOAD_STATES = {
  UPLOADING: 'uploading' as const,
  COMPLETE: 'complete' as const,
};

// ============== Import Browser Types ==============

/**
 * Selected item in the import browser
 * Can be a section or document with optional collection/section context
 */
export interface SelectedItem {
  id: string;
  type: 'section' | 'document';
  collectionId?: string | null;
  sectionId?: string | null;
  projectId?: string;
  [key: string]: unknown; // Allow additional properties from the original item
}

/**
 * Flexible type aliases for browser context
 * These allow partial data structures during import/browsing operations
 */
export type BrowserCollection = DocumentLibrary | { id: string; name: string; [key: string]: unknown };
export type BrowserSection = Section | FirestoreSection | { id: string; name: string; [key: string]: unknown };
export type BrowserDocument = Document | FirestoreDocument | { id: string; title?: string; name?: string; [key: string]: unknown };

/**
 * Browser state for document import functionality
 */
export interface BrowserState {
  // Data - These can be partial collections/sections/documents in browser context
  collections: BrowserCollection[];
  sections: BrowserSection[];
  documents: BrowserDocument[];
  thumbnails: Record<string, string>;

  // Selection
  selectedCollection: BrowserCollection | null;
  selectedSection: BrowserSection | null;
  selectedItems: SelectedItem[];

  // UI State
  currentView: 'collections' | 'sections' | 'documents';
  isLoading: boolean;

  // Import source
  importSource: 'documentLibrary' | 'projectLibrary';
}

/**
 * Actions for browser state management
 */
export type BrowserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_VIEW'; payload: BrowserState['currentView'] }
  | { type: 'SET_COLLECTIONS'; payload: BrowserCollection[] }
  | { type: 'SET_SELECTED_COLLECTION'; payload: BrowserCollection | null }
  | { type: 'SET_SECTIONS'; payload: BrowserSection[] }
  | { type: 'SET_SELECTED_SECTION'; payload: BrowserSection | null }
  | { type: 'SET_DOCUMENTS'; payload: BrowserDocument[] }
  | { type: 'SET_THUMBNAILS'; payload: Record<string, string> }
  | { type: 'ADD_THUMBNAIL'; payload: { id: string; url: string } }
  | {
      type: 'TOGGLE_ITEM_SELECTION';
      payload: {
        item: BrowserDocument | BrowserSection;
        type: 'section' | 'document';
        allowMultiple: boolean;
        sourceType: string;
        projectId?: string | null;
        selectedCollection: BrowserCollection;
        selectedSection: BrowserSection;
      };
    }
  | { type: 'SET_SELECTED_ITEMS'; payload: SelectedItem[] }
  | { type: 'CLEAR_SELECTION' }
  | {
      type: 'RESET_FOR_SOURCE_CHANGE';
      payload: {
        view: BrowserState['currentView'];
        collection?: BrowserCollection;
      };
    }
  | { type: 'RESET_SECTIONS_AND_DOCUMENTS' }
  | { type: 'SET_IMPORT_SOURCE'; payload: { source: BrowserState['importSource']; projectId?: string } };

// ============== Upload Configuration ==============

export const UPLOAD_CONFIG = {
  MAX_FILES: 10,
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
  ] as const,
  ALLOWED_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.heic',
    '.heif',
    '.pdf',
  ] as const,
} as const;

// ============== UI Configuration ==============

export const DND_ACTIVATION_CONSTRAINT = {
  delay: 250,
  tolerance: 5,
} as const;
export const IMPORT_BROWSER_ASPECT_RATIO = 1.42 as const;

export const SECTION_SIZE_CONFIG = {
  MULTI: {
    ANIMATION_DURATION: '300',
    CARD_MIN_WIDTH: 140,
    CARD_HEIGHT_RATIO: 1.42,
  },
  STANDALONE: {
    ANIMATION_DURATION: '300',
    CARD_MIN_WIDTH: 140,
    CARD_HEIGHT_RATIO: 1.42,
  },
} as const;

// ============== Re-export existing document types ==============

export * from '../api/firestore';