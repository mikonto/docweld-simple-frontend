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

// const DOCUMENT_ASPECT_RATIO = 1.42 as const

export const IMPORT_BROWSER_ASPECT_RATIO = 1.42 as const;

export const PROCESSING_STATES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const UPLOAD_STATES = {
  UPLOADING: 'uploading',
  COMPLETE: 'complete',
} as const;

export const DND_ACTIVATION_CONSTRAINT = {
  delay: 250,
  tolerance: 5,
} as const;

// Section sizing configuration
// These can be adjusted independently for different visual behavior
export const SECTION_SIZE_CONFIG = {
  // For multi-section containers (Section.jsx)
  // Used in Project Documents, Library Collections
  MULTI: {
    // MAX_HEIGHT_EXPANDED removed - sections now expand to full content height
    ANIMATION_DURATION: '300', // ms for expand/collapse animation
    CARD_MIN_WIDTH: 140, // Minimum width for cards in grid
    CARD_HEIGHT_RATIO: 1.42, // Card height = width × 1.42 (portrait orientation)
  },
  // For standalone sections (StandaloneSection.jsx)
  // Used in Attachments, future standalone sections
  STANDALONE: {
    // MAX_HEIGHT_EXPANDED removed - sections now expand to full content height like MULTI
    ANIMATION_DURATION: '300', // Can have different animation speed
    CARD_MIN_WIDTH: 140, // Minimum width for cards in grid
    CARD_HEIGHT_RATIO: 1.42, // Card height = width × 1.42 (portrait orientation)
  },
} as const;

// Type definitions for the constants
export type ProcessingState =
  (typeof PROCESSING_STATES)[keyof typeof PROCESSING_STATES];
// @unused - Types derived from constants, kept for future use
// type UploadState = (typeof UPLOAD_STATES)[keyof typeof UPLOAD_STATES]
// type AllowedFileType = (typeof UPLOAD_CONFIG.ALLOWED_TYPES)[number]
// type AllowedFileExtension = (typeof UPLOAD_CONFIG.ALLOWED_EXTENSIONS)[number]
