/**
 * Firestore field value constants
 * These constants ensure consistency across the application
 *
 * Note: Status and UserRole types have been moved to:
 * - Status: @/types/common/status
 * - UserRole: @/types/models/user
 */

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
