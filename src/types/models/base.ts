/**
 * Base interfaces that all models extend
 * These provide common fields like timestamps and IDs
 */

/**
 * Every document in Firestore has these fields
 */
export interface FirestoreBase {
  id: string;
}

/**
 * Documents owned by a user within a company
 */
export interface UserOwned extends FirestoreBase {
  userId: string;
  companyId: string;
}

/**
 * Documents that can be soft-deleted
 */
export interface SoftDeletable {
  deletedAt?: string;
  isDeleted: boolean;
}

/**
 * Combined base for most business documents
 */
export interface BaseDocument extends FirestoreBase, SoftDeletable {
  companyId: string;
}