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

/*
// Base interfaces - preserved for future use
// Currently not used but may be needed for document modeling

export interface UserOwned extends FirestoreBase {
  userId: string;
  companyId: string;
}

export interface SoftDeletable {
  deletedAt?: string;
  isDeleted: boolean;
}

export interface BaseDocument extends FirestoreBase, SoftDeletable {
  companyId: string;
}
*/