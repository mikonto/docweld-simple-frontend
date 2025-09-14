/**
 * Central Type Exports
 *
 * This file re-exports all types for convenient importing.
 * Import types from here rather than individual files.
 *
 * @example
 * import { User, Document, Section } from '@/types';
 */

// Database types (Firestore data models)
export type {
  // Documents
  FirestoreDocument,

  // Document Library
  DocumentLibrary,
  DocumentLibraryFormData,

  // Company
  CompanyInformation,

  // Sections
  FirestoreSection,

  // Upload
  UploadingFile,

  // Import
  ImportedDocumentData,
  ImportedSectionData,

  // Queries

  // Results
} from './database';

// Application types (Business logic)
export type {
  // User
  User,

  // Project
  Project,
  ProjectParticipant,
  ProjectRole,
  ProjectPermission,

  // Weld
  WeldLog,
  Weld,

  // Material
  Material,

  // Company
  Company,

  // Forms
  ProjectFormData,
  MaterialFormData,
  UserFormData,
  WeldLogFormData,
  WeldFormData,
  CompanyFormData,
  ProjectParticipantFormData,

  // Context
  LoggedInUser,
} from './app';

// Test utility types
export type {} from // Render

// Mocks

// Props

// Events

// Factory

'./test-utils';

// Re-export utility functions
