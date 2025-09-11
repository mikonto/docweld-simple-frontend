import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, where, setDoc, serverTimestamp, QueryConstraint, FirestoreError } from 'firebase/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { db, functions } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { STATUS, USER_ROLE, COLLECTIONS, type Status } from '@/constants/firestore';
import { type User, type UserFormData } from '@/types';

/**
 * Migration Notes:
 *
 * This file has been migrated to use useFirestoreOperations:
 *
 * 1. useUsers: Now uses useFirestoreOperations instead of useCollection
 *    - Replaced direct Firestore queries with useFirestoreOperations(collectionPath, { constraints })
 *    - Returns [documents, loading, error] tuple with name field automatically added
 *
 * 2. useUser: Remains unchanged (still uses useDocument for single doc fetching)
 *    - This is intentional as useDocument is more efficient for single document subscriptions
 *
 * 3. useUserOperations: Delegates update operations to useFirestoreOperations
 *    - createUser still uses Cloud Functions for Auth user creation, then setDoc for Firestore
 *    - All update operations (updateUser, promoteToAdmin, etc.) now use useFirestoreOperations.update
 *    - Maintains the same API surface for backwards compatibility
 *
 * Benefits of this migration:
 * - Consistent error handling and loading states across the application
 * - Centralized Firestore logic with automatic timestamp management
 * - Better testability with cleaner mocking patterns
 * - Reduced boilerplate code
 */

/**
 * User with computed name field
 */
export interface UserWithName extends User {
  name: string;
}

/**
 * Return type for useUserOperations hook
 */
interface UseUserOperationsReturn {
  createUser: (userData: UserFormData) => Promise<string>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  promoteToAdmin: (userId: string) => Promise<void>;
  demoteToUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
}

/**
 * Collection of hooks for interacting with users in Firebase
 * All operations are performed on the 'users' collection
 */

/**
 * Hook to fetch a single user's Firestore document
 * @param userId - The Firebase Auth user ID
 * @returns Returns:
 *   - User's Firestore document data or null if not found
 *   - Loading state
 *   - Error if any
 *
 * Note: For accessing the currently logged-in user's combined data (Auth + Firestore),
 * use the useApp hook's loggedInUser instead.
 */
export const useUser = (userId?: string): [User | null, boolean, FirestoreError | undefined] => {
  // Only fetch if we have a userId
  const [snapshot, loading, error] = useDocument(
    userId ? doc(db, 'users', userId) : null
  );

  // Return the user data if it exists
  const firestoreUser = snapshot?.exists()
    ? { id: snapshot.id, ...snapshot.data() } as User
    : null;

  return [firestoreUser, loading, error];
};

/**
 * Hook to fetch multiple users with status filtering
 * @param status - Filter users by status (active/inactive)
 * @returns Returns:
 *   - Array of user documents with name field
 *   - Loading state
 *   - Error if any
 */
export const useUsers = (status?: Status): [UserWithName[], boolean, FirestoreError | undefined] => {
  // Build constraints based on status filter
  const constraints: QueryConstraint[] = status ? [where('status', '==', status)] : [];

  // Use useFirestoreOperations to fetch users
  const { documents, loading, error } = useFirestoreOperations('users', {
    constraints,
  });

  // Transform documents to include combined name field
  const users: UserWithName[] = documents.map((user) => ({
    ...user,
    name: `${user.firstName} ${user.lastName}`,
  } as UserWithName));

  return [users, loading, error];
};

/**
 * Hook to create, update, and manage users
 * @returns Object containing user operation functions
 */
export const useUserOperations = (): UseUserOperationsReturn => {
  const { loggedInUser } = useApp();
  const { t } = useTranslation();

  // Use useFirestoreOperations for CRUD operations
  const userOps = useFirestoreOperations('users');

  /**
   * Create a new user in both Firebase Auth and Firestore
   * @param userData - The user data including email and password
   * @returns The ID of the created user
   */
  const createUser = async (userData: UserFormData): Promise<string> => {
    if (!loggedInUser) throw new Error('Must be logged in to create users');

    try {
      // Create user using Cloud Function to avoid auto-login
      const createUserAdmin = httpsCallable<
        { email: string; password: string },
        { uid: string }
      >(functions, 'createUser');
      const { email, password, ...firestoreData } = userData;

      // Validate required fields before sending to Firebase
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Call the Cloud Function to create the user in Firebase Auth
      const result: HttpsCallableResult<{ uid: string }> = await createUserAdmin({ email, password });
      const { uid } = result.data;

      // Create the corresponding Firestore document
      const newUser = {
        ...firestoreData,
        email,
        status: STATUS.ACTIVE,
        createdAt: serverTimestamp(),
        createdBy: loggedInUser.uid,
        updatedAt: serverTimestamp(),
        updatedBy: loggedInUser.uid,
      };

      // Use the returned UID as the Firestore document ID
      await setDoc(doc(db, COLLECTIONS.USERS, uid), newUser);
      toast.success(t('users.createSuccess'));
      return uid;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(errorMessage);
      // Throw a more user-friendly error message
      throw new Error(`Failed to create user: ${errorMessage}`);
    }
  };

  /**
   * Update an existing user
   * @param userId - The ID of the user to update
   * @param updates - The fields to update
   */
  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    return userOps.update(userId, updates);
  };

  /**
   * Promote a user to admin role
   * @param userId - The ID of the user to promote
   */
  const promoteToAdmin = async (userId: string): Promise<void> => {
    return userOps.update(userId, { role: USER_ROLE.ADMIN });
  };

  /**
   * Demote a user to regular user role
   * @param userId - The ID of the user to demote
   */
  const demoteToUser = async (userId: string): Promise<void> => {
    return userOps.update(userId, { role: USER_ROLE.USER });
  };

  /**
   * Deactivate a user
   * @param userId - The ID of the user to deactivate
   */
  const deactivateUser = async (userId: string): Promise<void> => {
    return userOps.update(userId, { status: STATUS.INACTIVE });
  };

  /**
   * Activate a user
   * @param userId - The ID of the user to activate
   */
  const activateUser = async (userId: string): Promise<void> => {
    return userOps.update(userId, { status: STATUS.ACTIVE });
  };

  return {
    createUser,
    updateUser,
    promoteToAdmin,
    demoteToUser,
    activateUser,
    deactivateUser,
  };
};