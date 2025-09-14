/**
 * Firestore field value constants
 * These constants ensure consistency across the application
 * and help prevent typos in status values and other enums
 */

// Common status values used across all collections
export const STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
  ARCHIVED: 'archived',
  INACTIVE: 'inactive', // Only for users
} as const;

// User roles
export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

// Collection names (kebab-case)
export const COLLECTIONS = {
  USERS: 'users',
  COMPANY: 'company',
  PROJECTS: 'projects',
  PROJECT_PARTICIPANTS: 'project-participants',
  DOCUMENT_LIBRARY: 'document-library',
  LIBRARY_DOCUMENT_SECTIONS: 'library-document-sections',
  LIBRARY_DOCUMENTS: 'library-documents',
  PROJECT_DOCUMENT_SECTIONS: 'project-document-sections',
  PROJECT_DOCUMENTS: 'project-documents',
  WELD_LOGS: 'weld-logs',
  WELD_LOG_DOCUMENTS: 'weld-log-documents',
  WELD_LOG_DOCUMENT_SECTIONS: 'weld-log-document-sections',
  WELDS: 'welds',
  WELD_DOCUMENTS: 'weld-documents',
  WELD_DOCUMENT_SECTIONS: 'weld-document-sections',
  PARENT_MATERIALS: 'parent-materials',
  FILLER_MATERIALS: 'filler-materials',
  ALLOY_MATERIALS: 'alloy-materials',
} as const;

// Type exports for use in other files
export type Status = (typeof STATUS)[keyof typeof STATUS];
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
// @unused - type for collection names
// type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
