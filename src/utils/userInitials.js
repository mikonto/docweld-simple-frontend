/**
 * Get initials from user object for avatar display
 * Uses required firstName and lastName fields from Firestore
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} Two character initials in uppercase
 */
export function getUserInitials(user) {
  if (!user?.firstName || !user?.lastName) return '?';

  // firstName and lastName are required fields in user creation
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}
