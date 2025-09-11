/**
 * Database Types - Firestore Data Models
 * 
 * These types represent the actual data structure stored in Firestore.
 * They serve as the source of truth for all database operations.
 */

import type { Timestamp, FieldValue } from 'firebase/firestore';

// ============== Document Types ==============

/**
 * Firestore document data structure
 * This matches the actual fields stored in the database
 */
export interface FirestoreDocument {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  storageRef: string;
  thumbStorageRef: string | null;
  processingState: 'uploading' | 'pending' | 'processing' | 'completed' | 'error';
  status: 'active' | 'deleted';
  order: number;
  
  // Foreign keys (only one will be set based on context)
  sectionId?: string | null;
  projectId?: string;
  libraryId?: string;
  weldLogId?: string;
  weldId?: string;
  
  // Timestamps
  createdAt: Timestamp | FieldValue;
  createdBy: string;
  updatedAt: Timestamp | FieldValue;
  updatedBy: string;
}

/**
 * Document type for application usage
 * Extends Firestore type with computed properties
 */
export interface Document extends Omit<FirestoreDocument, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============== Section Types ==============

/**
 * Firestore section data structure
 * Note: Firestore uses 'name' and 'description' fields
 */
export interface FirestoreSection {
  id: string;
  name: string;        // Display name of the section
  description: string; // Section description
  status: 'active' | 'deleted';
  order: number;
  
  // Foreign keys (only one will be set)
  projectId?: string;
  libraryId?: string;
  
  // Timestamps
  createdAt: Timestamp | FieldValue;
  createdBy: string;
  updatedAt: Timestamp | FieldValue;
  updatedBy: string;
}

/**
 * Section type for application usage
 */
export interface Section extends Omit<FirestoreSection, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============== Upload Types ==============

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: Error;
  documentId?: string;
}

// @unused - Upload results handled inline
// interface UploadResult {
//   success: boolean;
//   documentId?: string;
//   error?: Error;
// }

// ============== Import Types ==============

export interface ImportedDocumentData extends FirestoreDocument {
  importedFrom?: string;
  importedAt?: FieldValue;
}

export interface ImportedSectionData extends FirestoreSection {
  importedFrom?: string | null;
  importedAt?: FieldValue;
}

// ============== Query Types ==============

// @unused - Queries built inline
// interface DocumentQuery {
//   projectId?: string;
//   libraryId?: string;
//   weldLogId?: string;
//   weldId?: string;
//   sectionId?: string | null;
//   status?: 'active' | 'deleted';
// }

// interface SectionQuery {
//   projectId?: string;
//   libraryId?: string;
//   status?: 'active' | 'deleted';
// }

// ============== Operation Results ==============

// @unused - operation result interface
// interface OperationResult {
//   success: boolean;
//   error?: Error;
//   data?: any;
// }

// @unused - Delete results handled inline
// interface DeleteResult extends OperationResult {
//   deletedCount?: number;
// }