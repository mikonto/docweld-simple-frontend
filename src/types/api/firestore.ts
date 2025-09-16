/**
 * Firestore-specific types
 * Data structures for Firestore database operations
 */

import type { Timestamp, FieldValue } from 'firebase/firestore';

// ============== Document Management Types ==============

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
  processingState:
    | 'uploading'
    | 'pending'
    | 'processing'
    | 'completed'
    | 'error';
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
export interface Document
  extends Omit<FirestoreDocument, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firestore section data structure
 * Note: Firestore uses 'name' and 'description' fields
 */
export interface FirestoreSection {
  id: string;
  name: string; // Display name of the section
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
export interface Section
  extends Omit<FirestoreSection, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  documentOrder?: string[]; // Array of document IDs in order
  documentCount?: number; // Number of documents in this section
}

// ============== Document Library Types ==============

/**
 * Document Library (Collection) data structure
 * Represents a collection of documents organized in sections
 */
export interface DocumentLibrary {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'deleted';

  // Timestamps
  createdAt: Timestamp | FieldValue;
  createdBy: string;
  updatedAt: Timestamp | FieldValue;
  updatedBy: string;
}

/**
 * Form data for creating/updating document libraries
 */
export interface DocumentLibraryFormData {
  name: string;
  description?: string;
}

// ============== Company Information ==============

/**
 * Company information data structure
 * Represents company profile information
 */
export interface CompanyInformation {
  id?: string;
  companyName: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  logoUrl?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

// ============== Import/Export Types ==============

export interface ImportedDocumentData extends FirestoreDocument {
  importedFrom?: string;
  importedAt?: FieldValue;
}

export interface ImportedSectionData extends FirestoreSection {
  importedFrom?: string | null;
  importedAt?: FieldValue;
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

// ============== Query Types ==============

/*
// Firebase query interface - not currently used
export interface FirebaseQuery {
  collection: string;
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '>' | '<=' | '>=';
    value: unknown;
  }>;
  orderBy?: string;
  limit?: number;
}
*/