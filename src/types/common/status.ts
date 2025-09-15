/**
 * Common status types used across the application
 * These are the base status values that can be used by any entity
 */

/**
 * Generic status values used across all collections
 * This is the base status type that most entities use
 */
export type Status =
  | 'active'
  | 'deleted'
  | 'archived'
  | 'inactive'; // Only for users

/**
 * Status constants for consistency
 */
export const STATUS = {
  ACTIVE: 'active' as const,
  DELETED: 'deleted' as const,
  ARCHIVED: 'archived' as const,
  INACTIVE: 'inactive' as const,
} as const;