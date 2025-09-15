/**
 * User-related types
 * Handles authentication, roles, and permissions
 */

import type { Timestamp } from 'firebase/firestore';
import { FirestoreBase } from './base';

/**
 * Available user roles in the system
 */
export type UserRole =
  | 'admin'    // Full system access
  | 'user'     // Standard user
  | 'viewer';  // Read-only access

/**
 * Role constants for consistency
 */
export const USER_ROLE = {
  ADMIN: 'admin' as const,
  USER: 'user' as const,
  VIEWER: 'viewer' as const,
} as const;

/**
 * User status values
 */
export type UserStatus =
  | 'active'
  | 'inactive'
  | 'deleted'
  | 'archived';

/**
 * Core user data from authentication
 */
export interface User extends FirestoreBase {
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
  status: UserStatus;
}

/**
 * Firebase auth user interface
 */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

/**
 * Currently logged-in user (extends with auth info)
 */
export interface LoggedInUser extends AppUser {
  role?: UserRole;
  displayName: string;
  email: string;
}