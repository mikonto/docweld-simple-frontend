/**
 * User object with required firstName and lastName fields
 */
interface UserWithName {
  firstName?: string | null;
  lastName?: string | null;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Get initials from user object for avatar display
 * Uses required firstName and lastName fields from Firestore
 * @param user - User object with firstName and lastName
 * @returns Two character initials in uppercase
 */
export function getUserInitials(user: UserWithName | null | undefined): string {
  if (!user?.firstName || !user?.lastName) return '?';

  // firstName and lastName are required fields in user creation
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}
