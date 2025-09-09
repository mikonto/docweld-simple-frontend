import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { STATUS, USER_ROLE, COLLECTIONS } from '@/constants/firestore';

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
 * Collection of hooks for interacting with users in Firebase
 * All operations are performed on the 'users' collection
 */

/**
 * Hook to fetch a single user's Firestore document
 * @param {string} userId - The Firebase Auth user ID
 * @returns {[Object | null, boolean, Error | undefined]} - Returns:
 *   - User's Firestore document data or null if not found
 *   - Loading state
 *   - Error if any
 *
 * Note: For accessing the currently logged-in user's combined data (Auth + Firestore),
 * use the useApp hook's loggedInUser instead.
 */
export const useUser = (userId) => {
  // Only fetch if we have a userId
  const [snapshot, loading, error] = useDocument(
    userId ? doc(db, 'users', userId) : null
  );

  // Return the user data if it exists
  const firestoreUser = snapshot?.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;

  return [firestoreUser, loading, error];
};

/**
 * Hook to fetch multiple users with status filtering
 * @param {string} status - Filter users by status (active/inactive)
 * @returns {[Object[], boolean, Error | undefined]} - Returns:
 *   - Array of user documents
 *   - Loading state
 *   - Error if any
 */
export const useUsers = (status) => {
  // Build constraints based on status filter
  const constraints = status ? [where('status', '==', status)] : [];

  // Use useFirestoreOperations to fetch users
  const { documents, loading, error } = useFirestoreOperations('users', {
    constraints,
  });

  // Transform documents to include combined name field
  const users = documents.map((user) => ({
    ...user,
    name: `${user.firstName} ${user.lastName}`,
  }));

  return [users, loading, error];
};

/**
 * Hook to create, update, and manage users
 * @returns {Object} Object containing user operation functions
 */
export const useUserOperations = () => {
  const { loggedInUser } = useApp();
  const { t } = useTranslation();

  // Use useFirestoreOperations for CRUD operations
  const userOps = useFirestoreOperations('users');

  /**
   * Create a new user in both Firebase Auth and Firestore
   * @param {Object} userData - The user data including email and password
   * @returns {Promise<string>} The ID of the created user
   */
  const createUser = async (userData) => {
    if (!loggedInUser) throw new Error('Must be logged in to create users');

    try {
      // Create user using Cloud Function to avoid auto-login
      const createUserAdmin = httpsCallable(functions, 'createUser');
      const { email, password, ...firestoreData } = userData;

      // Validate required fields before sending to Firebase
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Call the Cloud Function to create the user in Firebase Auth
      const result = await createUserAdmin({ email, password });
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
    } catch (error) {
      const errorMessage = error.message || 'Failed to create user';
      toast.error(errorMessage);
      // Throw a more user-friendly error message
      throw new Error(`Failed to create user: ${error.message}`);
    }
  };

  /**
   * Update an existing user
   * @param {string} userId - The ID of the user to update
   * @param {Object} updates - The fields to update
   */
  const updateUser = async (userId, updates) => {
    return userOps.update(userId, updates);
  };

  /**
   * Promote a user to admin role
   * @param {string} userId - The ID of the user to promote
   */
  const promoteToAdmin = async (userId) => {
    return userOps.update(userId, { role: USER_ROLE.ADMIN });
  };

  /**
   * Demote a user to regular user role
   * @param {string} userId - The ID of the user to demote
   */
  const demoteToUser = async (userId) => {
    return userOps.update(userId, { role: USER_ROLE.USER });
  };

  /**
   * Deactivate a user
   * @param {string} userId - The ID of the user to deactivate
   */
  const deactivateUser = async (userId) => {
    return userOps.update(userId, { status: STATUS.INACTIVE });
  };

  /**
   * Activate a user
   * @param {string} userId - The ID of the user to activate
   */
  const activateUser = async (userId) => {
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
