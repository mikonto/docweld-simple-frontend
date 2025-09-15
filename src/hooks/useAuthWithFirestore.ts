import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, FirestoreError } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User as FirestoreUser } from '@/types';
import type { Status } from '@/types/common/status';

/**
 * Combined user type with both Auth and Firestore data
 * Composed rather than extended to avoid property conflicts
 */
interface LoggedInUser {
  // Firebase Auth properties
  uid: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  photoURL: string | null;
  providerId: string;

  // Firestore User properties (takes precedence for displayName)
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: FirestoreUser['role'];
  companyName?: string;
  createdAt: FirestoreUser['createdAt'];
  updatedAt: FirestoreUser['updatedAt'];
  lastLogin?: FirestoreUser['lastLogin'];
  status: FirestoreUser['status'];

  // Additional Firebase Auth methods/properties can be added as needed
}

/**
 * Return type for useAuthWithFirestore hook
 */
export interface UseAuthWithFirestoreReturn {
  /** Combined user object with both Auth and Firestore data */
  loggedInUser: LoggedInUser | null;
  /** Raw Firebase Auth user */
  userAuth: FirebaseUser | null;
  /** Raw Firestore user document data */
  userDb: FirestoreUser | null;
  /** User status from Firestore */
  userStatus: Status | null;
  /** Whether user is fully authorized to access the app */
  isAuthorized: boolean;
  /** Whether any loading is happening */
  loading: boolean;
  /** Any errors from Auth or Firestore */
  error: Error | FirestoreError | undefined;
}

/**
 * Custom hook that combines Firebase Auth and Firestore user document
 * Handles the race condition between auth loading and Firestore document fetching
 *
 * @returns Auth state with Firestore user data
 */
export function useAuthWithFirestore(): UseAuthWithFirestoreReturn {
  // Get authentication state from Firebase
  const [userAuth, authLoading, authError] = useAuthState(auth);

  // Get user document from Firestore (if user is logged in)
  const [userDoc, userDocLoading, userDocError] = useDocument(
    userAuth ? doc(db, 'users', userAuth.uid) : null
  );

  // Track if we've completed at least one load attempt for the user doc
  // This prevents the race condition where userDocLoading is false before it starts
  const [hasLoadedUserDoc, setHasLoadedUserDoc] = useState(false);

  useEffect(() => {
    if (userAuth && !userDocLoading && (userDoc || userDocError)) {
      // We've completed at least one load attempt for this user
      setHasLoadedUserDoc(true);
    }
    if (!userAuth) {
      // Reset when user logs out
      setHasLoadedUserDoc(false);
    }
  }, [userAuth, userDoc, userDocLoading, userDocError]);

  // Calculate the actual loading state
  // We're loading if auth is loading OR if we have a user but haven't attempted to load their doc
  const loading = authLoading || (userAuth && !hasLoadedUserDoc);

  // Extract user data from Firestore document
  const userDb = userDoc?.exists() ? (userDoc.data() as FirestoreUser) : null;

  // Determine if user is authorized (authenticated + active in Firestore)
  const isAuthorized = !!(userAuth && userDb && userDb.status === 'active');

  // Combine Firebase Auth and Firestore user data for convenience
  // Manually construct to ensure proper type alignment
  const loggedInUser: LoggedInUser | null =
    userAuth && userDb
      ? {
          // Firebase Auth properties
          uid: userAuth.uid,
          email: userAuth.email,
          emailVerified: userAuth.emailVerified,
          phoneNumber: userAuth.phoneNumber,
          photoURL: userAuth.photoURL,
          providerId: userAuth.providerId,

          // Firestore User properties
          id: userDb.id,
          displayName: userDb.displayName,
          firstName: userDb.firstName,
          lastName: userDb.lastName,
          role: userDb.role,
          companyName: userDb.companyName,
          createdAt: userDb.createdAt,
          updatedAt: userDb.updatedAt,
          lastLogin: userDb.lastLogin,
          status: userDb.status,
        }
      : null;

  return {
    // Combined user object with both Auth and Firestore data
    loggedInUser,
    // Raw Firebase Auth user (convert undefined to null)
    userAuth: userAuth ?? null,
    // Raw Firestore user document data
    userDb,
    // User status from Firestore
    userStatus: userDb ? userDb.status : null,
    // Whether user is fully authorized to access the app
    isAuthorized,
    // Whether any loading is happening (default to false if undefined)
    loading: loading ?? false,
    // Any errors from Auth or Firestore
    error: userDocError || authError,
  };
}
